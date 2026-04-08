import path from 'path';
import sharp from 'sharp';
import { AdaptationProject, SourceAsset } from '../models/CreativeAdaptation.js';

const SOURCE_BUCKET = 'adaptation-source-assets';
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg']);

function sanitizeFileSegment(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function deriveProjectName(originalFilename, explicitName) {
  if (typeof explicitName === 'string' && explicitName.trim()) {
    return explicitName.trim().slice(0, 120);
  }

  const baseName = path.basename(originalFilename || '', path.extname(originalFilename || '')).trim();
  return (baseName || 'Untitled Creative').slice(0, 120);
}

function buildStoragePath({ ownerId, projectId, originalFilename }) {
  const extension = path.extname(originalFilename || '').toLowerCase() || '.png';
  const safeStem = sanitizeFileSegment(path.basename(originalFilename || 'source', extension)) || 'source';
  return `${sanitizeFileSegment(ownerId)}/${projectId}/${Date.now()}-${safeStem}${extension}`;
}

function withPublicAssetUrl(project, storage) {
  if (!project?.source_asset) {
    return project;
  }

  const bucket = project.source_asset.metadata?.bucket || SOURCE_BUCKET;
  const publicUrl = project.source_asset.metadata?.public_url
    || storage?.getPublicUrl?.(bucket, project.source_asset.storage_path)
    || null;

  return {
    ...project,
    source_asset: {
      ...project.source_asset,
      public_url: publicUrl,
    },
  };
}

export class CreativeAdaptationService {
  constructor(dbAdapter, storageAdapter) {
    this.db = dbAdapter;
    this.storage = storageAdapter;
  }

  async createProjectFromUpload({ ownerId, projectName, file }) {
    if (!ownerId) {
      throw new Error('Project owner is required');
    }

    if (!file) {
      throw new Error('Source image is required');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new Error('Only PNG and JPG creatives are supported');
    }

    if (!this.db?.adaptations) {
      throw new Error('Adaptation persistence is not configured');
    }

    if (!this.storage) {
      throw new Error('Storage service is not configured');
    }

    const metadata = await sharp(file.buffer).metadata();
    const project = new AdaptationProject({
      owner_id: ownerId,
      name: deriveProjectName(file.originalname, projectName),
      status: 'draft',
      preservation_intent: [],
      settings: {},
    });
    const projectValidation = project.validate();
    if (!projectValidation.isValid) {
      throw new Error(projectValidation.errors[0]);
    }

    const createdProject = await this.db.adaptations.createProject(project.toJSON());
    const storagePath = buildStoragePath({
      ownerId,
      projectId: createdProject.id,
      originalFilename: file.originalname,
    });

    const uploaded = await this.storage.upload(SOURCE_BUCKET, storagePath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: '3600',
      upsert: true,
    });
    const publicUrl = this.storage.getPublicUrl(SOURCE_BUCKET, uploaded.path || storagePath);

    try {
      const sourceAsset = new SourceAsset({
        project_id: createdProject.id,
        storage_path: uploaded.path || storagePath,
        original_filename: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        metadata: {
          bucket: SOURCE_BUCKET,
          public_url: publicUrl,
          format: metadata.format || null,
        },
      });
      const sourceValidation = sourceAsset.validate();
      if (!sourceValidation.isValid) {
        throw new Error(sourceValidation.errors[0]);
      }

      await this.db.adaptations.createSourceAsset(sourceAsset.toJSON());
    } catch (error) {
      await this.storage.delete(SOURCE_BUCKET, uploaded.path || storagePath).catch(() => undefined);
      throw error;
    }

    const hydratedProject = await this.db.adaptations.getProjectById(createdProject.id);
    return withPublicAssetUrl(hydratedProject, this.storage);
  }

  async getProjectById(projectId, ownerId) {
    const project = await this.db?.adaptations?.getProjectById(projectId);
    if (!project || project.owner_id !== ownerId) {
      return null;
    }

    return withPublicAssetUrl(project, this.storage);
  }

  async listProjects(ownerId, filters = {}, pagination = {}) {
    const result = await this.db?.adaptations?.listProjectsByOwner(ownerId, filters, pagination);
    return {
      data: (result?.data || []).map((project) => withPublicAssetUrl(project, this.storage)),
      count: result?.count || 0,
    };
  }
}

export default CreativeAdaptationService;
