/**
 * Project Service
 * Business logic for project management
 * Uses db adapter (SqliteDbAdapter or SupabaseDbAdapter) for data access
 */

import { Project, ProjectCollaborator, ProjectVersion } from '../models/Project.js';

export class ProjectService {
  constructor(dbAdapter) {
    this.db = dbAdapter;
  }

  async createProject(projectData) {
    const project = new Project(projectData);
    const validation = project.validate();

    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    return await this.db.projects.create(project.toJSON());
  }

  async getUserProjects(userId, filters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const result = await this.db.projects.findByUser(userId, filters, { page, limit });

    return {
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.count,
        totalPages: Math.ceil(result.count / limit),
      },
    };
  }

  async getProjectById(projectId, userId) {
    const data = await this.db.projects.findById(projectId);

    if (!data) throw new Error('Project not found');

    // Check if user has access
    if (data.owner_id !== userId && !data.collaborators?.some((c) => c.user_id === userId)) {
      throw new Error('Access denied');
    }

    return data;
  }

  async updateProject(projectId, userId, updates) {
    const project = await this.getProjectById(projectId, userId);

    if (!this.canEdit(project, userId)) {
      throw new Error('Permission denied');
    }

    return await this.db.projects.update(projectId, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  }

  async deleteProject(projectId, userId, permanent = false) {
    const project = await this.getProjectById(projectId, userId);

    if (project.owner_id !== userId) {
      throw new Error('Only project owner can delete');
    }

    await this.db.projects.delete(projectId, !permanent);
    return true;
  }

  async getProjectStats(projectId, userId) {
    const project = await this.getProjectById(projectId, userId);
    const images = await this.db.projects.getImages(projectId, { page: 1, limit: 1 });
    const collaborators = await this.db.projects.getCollaborators(projectId);
    const versions = await this.db.projects.getVersions(projectId);

    return {
      images: images.count || 0,
      collaborators: collaborators.length || 0,
      versions: versions.length || 0,
      created_at: project.created_at,
      updated_at: project.updated_at,
    };
  }

  async addImagesToProject(projectId, userId, imageIds) {
    const project = await this.getProjectById(projectId, userId);

    if (!this.canEdit(project, userId)) {
      throw new Error('Permission denied');
    }

    await this.db.projects.addImages(projectId, imageIds);
    return await this.db.projects.getImages(projectId, { page: 1, limit: imageIds.length + 10 });
  }

  async removeImagesFromProject(projectId, userId, imageIds) {
    const project = await this.getProjectById(projectId, userId);

    if (!this.canEdit(project, userId)) {
      throw new Error('Permission denied');
    }

    await this.db.projects.removeImages(projectId, imageIds);
    return true;
  }

  async getProjectImages(projectId, userId, options = {}) {
    await this.getProjectById(projectId, userId); // Check access

    const page = options.page || 1;
    const limit = options.limit || 50;

    const result = await this.db.projects.getImages(projectId, { page, limit });

    return {
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.count,
        totalPages: Math.ceil(result.count / limit),
      },
    };
  }

  async addCollaborator(projectId, userId, collaboratorData) {
    const project = await this.getProjectById(projectId, userId);

    if (project.owner_id !== userId) {
      throw new Error('Only project owner can add collaborators');
    }

    await this.db.projects.addCollaborator(projectId, {
      ...collaboratorData,
      invited_by: userId,
    });

    return await this.db.projects.getCollaborators(projectId);
  }

  async getCollaborators(projectId, userId) {
    await this.getProjectById(projectId, userId); // Check access
    return await this.db.projects.getCollaborators(projectId);
  }

  async removeCollaborator(projectId, userId, collaboratorUserId) {
    const project = await this.getProjectById(projectId, userId);

    if (project.owner_id !== userId) {
      throw new Error('Only project owner can remove collaborators');
    }

    await this.db.projects.removeCollaborator(projectId, collaboratorUserId);
    return true;
  }

  async createVersion(projectId, userId, notes = '') {
    const project = await this.getProjectById(projectId, userId);

    if (!this.canEdit(project, userId)) {
      throw new Error('Permission denied');
    }

    return await this.db.projects.createVersion(projectId, userId, notes);
  }

  async getVersionHistory(projectId, userId) {
    await this.getProjectById(projectId, userId); // Check access
    return await this.db.projects.getVersions(projectId);
  }

  async restoreVersion(projectId, userId, versionId) {
    const project = await this.getProjectById(projectId, userId);

    if (!this.canEdit(project, userId)) {
      throw new Error('Permission denied');
    }

    return await this.db.projects.restoreVersion(projectId, versionId);
  }

  async exportProject(projectId, userId, format = 'json') {
    const project = await this.getProjectById(projectId, userId);
    const images = await this.getProjectImages(projectId, userId, { limit: 1000 });
    const collaborators = await this.getCollaborators(projectId, userId);
    const versions = await this.getVersionHistory(projectId, userId);

    return {
      project,
      images: images.data,
      collaborators,
      versions,
      exported_at: new Date().toISOString(),
      format,
    };
  }

  async importProject(userId, importData) {
    const projectData = {
      ...importData.project,
      owner_id: userId,
      id: undefined,
    };

    const project = await this.createProject(projectData);

    if (importData.images && importData.images.length > 0) {
      const imageIds = importData.images.map((img) => img.image_id);
      await this.addImagesToProject(project.id, userId, imageIds);
    }

    return project;
  }

  async bulkOperation(userId, operation, projectIds, data = {}) {
    const results = { success: [], failed: [] };

    for (const projectId of projectIds) {
      try {
        switch (operation) {
          case 'delete':
            await this.deleteProject(projectId, userId, false);
            break;
          case 'archive':
            await this.updateProject(projectId, userId, { status: 'archived' });
            break;
          case 'restore':
            await this.updateProject(projectId, userId, { status: 'active', deleted_at: null });
            break;
          case 'update':
            await this.updateProject(projectId, userId, data);
            break;
        }
        results.success.push(projectId);
      } catch (error) {
        results.failed.push({ projectId, error: error.message });
      }
    }

    return results;
  }

  async getAnalytics(projectId, userId, period = '30d') {
    const project = await this.getProjectById(projectId, userId);
    const images = await this.db.projects.getImages(projectId, { page: 1, limit: 1000 });
    const collaborators = await this.db.projects.getCollaborators(projectId);
    const versions = await this.db.projects.getVersions(projectId);

    return {
      period,
      images_added: images.count || 0,
      collaborators: collaborators.length || 0,
      versions_created: versions.length || 0,
      timeline: [],
    };
  }

  canEdit(project, userId) {
    if (project.owner_id === userId) return true;
    const collaborator = project.collaborators?.find((c) => c.user_id === userId);
    return collaborator && ['owner', 'editor'].includes(collaborator.role);
  }

  canView(project, userId) {
    if (project.visibility === 'public') return true;
    if (project.owner_id === userId) return true;
    return project.collaborators?.some((c) => c.user_id === userId);
  }
}
