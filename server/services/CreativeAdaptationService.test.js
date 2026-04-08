// @vitest-environment node
import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import { initializeSchema } from '../providers/local/schema.js';
import { SqliteDbAdapter } from '../providers/local/SqliteDbAdapter.js';
import { LocalStorageAdapter } from '../providers/local/LocalStorageAdapter.js';
import { CreativeAdaptationService } from './CreativeAdaptationService.js';

describe('CreativeAdaptationService', () => {
  let db;
  let tmpDir;
  let service;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (id, email, password_hash, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)
    `).run(
      'user-1',
      'owner@example.com',
      'hash',
      '{}',
      now,
      now,
      'user-2',
      'other@example.com',
      'hash',
      '{}',
      now,
      now,
    );

    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapasset-adapt-service-'));
    service = new CreativeAdaptationService(
      new SqliteDbAdapter(db),
      new LocalStorageAdapter(tmpDir),
    );
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates an upload-backed project and can fetch it for the owner', async () => {
    const project = await service.createProjectFromUpload({
      ownerId: 'user-1',
      projectName: 'Spring Launch',
      file: {
        originalname: 'creative.png',
        mimetype: 'image/png',
        size: 68,
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnLJtQAAAAASUVORK5CYII=',
          'base64',
        ),
      },
    });

    expect(project.name).toBe('Spring Launch');
    expect(project.source_asset.original_filename).toBe('creative.png');
    expect(project.source_asset.width).toBe(1);
    expect(project.source_asset.height).toBe(1);
    expect(project.source_asset.public_url).toContain('/storage/adaptation-source-assets/');

    const fetchedProject = await service.getProjectById(project.id, 'user-1');

    expect(fetchedProject.id).toBe(project.id);
    expect(fetchedProject.source_asset.original_filename).toBe('creative.png');
  });

  it('returns null when a different owner requests the project', async () => {
    const project = await service.createProjectFromUpload({
      ownerId: 'user-1',
      file: {
        originalname: 'creative.png',
        mimetype: 'image/png',
        size: 68,
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnLJtQAAAAASUVORK5CYII=',
          'base64',
        ),
      },
    });

    await expect(service.getProjectById(project.id, 'user-2')).resolves.toBeNull();
  });

  it('saves setup inputs as requested outputs with a size cap', async () => {
    const project = await service.createProjectFromUpload({
      ownerId: 'user-1',
      file: {
        originalname: 'creative.png',
        mimetype: 'image/png',
        size: 68,
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnLJtQAAAAASUVORK5CYII=',
          'base64',
        ),
      },
    });

    const updated = await service.saveProjectSetup(project.id, 'user-1', {
      preservation_intent: ['brand'],
      output_size_limit_bytes: 512000,
      requested_outputs: [
        {
          preset_id: 'instagram-story',
          label: 'Instagram Story',
          aspect_ratio: '9:16',
          target_width: 1080,
          target_height: 1920,
          generation_strategy: 'adapt',
          max_file_size_bytes: 512000,
        },
        {
          preset_id: 'instagram-post',
          label: 'Instagram Feed',
          aspect_ratio: '1:1',
          target_width: 1080,
          target_height: 1080,
          generation_strategy: 'pad_to_fit',
          max_file_size_bytes: 512000,
        },
      ],
    });

    expect(updated.preservation_intent).toEqual(['brand']);
    expect(updated.settings.output_size_limit_bytes).toBe(512000);
    expect(updated.requested_outputs).toHaveLength(2);
    expect(updated.requested_outputs[1].generation_strategy).toBe('pad_to_fit');
    expect(updated.requested_outputs[1].max_file_size_bytes).toBe(512000);
  });
});
