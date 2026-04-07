import Database from 'better-sqlite3';
import { initializeSchema } from './schema.js';

describe('SQLite Schema', () => {
  let db;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  });

  afterEach(() => {
    db.close();
  });

  const getTableNames = (db) => {
    const rows = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all();
    return rows.map((r) => r.name);
  };

  const expectedTables = [
    'users',
    'projects',
    'project_images',
    'project_collaborators',
    'project_versions',
    'adaptation_projects',
    'adaptation_source_assets',
    'adaptation_requested_outputs',
    'adaptation_output_attempts',
    'analytics_events',
    'user_usage_stats',
    'daily_usage_aggregates',
    'platform_usage_stats',
    'cost_tracking',
    'performance_metrics',
    'user_engagement',
    'system_metrics',
    'generations',
    'generated_images',
  ].sort();

  describe('initializeSchema', () => {
    test('creates all required tables', () => {
      initializeSchema(db);

      const tables = getTableNames(db);

      for (const expected of expectedTables) {
        expect(tables).toContain(expected);
      }
    });

    test('is idempotent - runs twice without error', () => {
      initializeSchema(db);
      expect(() => initializeSchema(db)).not.toThrow();

      const tables = getTableNames(db);
      for (const expected of expectedTables) {
        expect(tables).toContain(expected);
      }
    });

    test('can insert and retrieve a user', () => {
      initializeSchema(db);

      const userId = 'test-user-001';
      const email = 'test@example.com';
      const passwordHash = '$2b$10$fakehashvalue';
      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run(userId, email, passwordHash, now, now);

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

      expect(user).toBeDefined();
      expect(user.id).toBe(userId);
      expect(user.email).toBe(email);
      expect(user.password_hash).toBe(passwordHash);
      expect(user.created_at).toBe(now);
    });

    test('enforces UNIQUE constraints on users.email', () => {
      initializeSchema(db);

      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u1', 'dup@test.com', 'hash1', now, now);

      expect(() => {
        db.prepare(
          `INSERT INTO users (id, email, password_hash, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)`
        ).run('u2', 'dup@test.com', 'hash2', now, now);
      }).toThrow();
    });

    test('enforces UNIQUE(project_id, image_id) on project_images', () => {
      initializeSchema(db);

      const now = new Date().toISOString();
      // Insert a user and project first
      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u1', 'owner@test.com', 'hash', now, now);
      db.prepare(
        `INSERT INTO projects (id, name, owner_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('p1', 'Test Project', 'u1', now, now);

      db.prepare(
        `INSERT INTO project_images (id, project_id, image_id, created_at)
         VALUES (?, ?, ?, ?)`
      ).run('pi1', 'p1', 'img1', now);

      expect(() => {
        db.prepare(
          `INSERT INTO project_images (id, project_id, image_id, created_at)
           VALUES (?, ?, ?, ?)`
        ).run('pi2', 'p1', 'img1', now);
      }).toThrow();
    });

    test('enforces UNIQUE(project_id, user_id) on project_collaborators', () => {
      initializeSchema(db);

      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u1', 'owner@test.com', 'hash', now, now);
      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u2', 'collab@test.com', 'hash', now, now);
      db.prepare(
        `INSERT INTO projects (id, name, owner_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('p1', 'Test Project', 'u1', now, now);

      db.prepare(
        `INSERT INTO project_collaborators (id, project_id, user_id, role, invited_by, invited_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run('pc1', 'p1', 'u2', 'editor', 'u1', now);

      expect(() => {
        db.prepare(
          `INSERT INTO project_collaborators (id, project_id, user_id, role, invited_by, invited_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run('pc2', 'p1', 'u2', 'viewer', 'u1', now);
      }).toThrow();
    });

    test('enforces UNIQUE(project_id, version_number) on project_versions', () => {
      initializeSchema(db);

      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u1', 'owner@test.com', 'hash', now, now);
      db.prepare(
        `INSERT INTO projects (id, name, owner_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('p1', 'Test Project', 'u1', now, now);

      db.prepare(
        `INSERT INTO project_versions (id, project_id, version_number, snapshot, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run('pv1', 'p1', 1, '{}', 'u1', now);

      expect(() => {
        db.prepare(
          `INSERT INTO project_versions (id, project_id, version_number, snapshot, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run('pv2', 'p1', 1, '{}', 'u1', now);
      }).toThrow();
    });

    test('enforces UNIQUE(project_id) on adaptation_source_assets', () => {
      initializeSchema(db);

      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u1', 'owner@test.com', 'hash', now, now);
      db.prepare(
        `INSERT INTO adaptation_projects (id, owner_id, name, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('ap1', 'u1', 'Campaign', now, now);

      db.prepare(
        `INSERT INTO adaptation_source_assets (id, project_id, storage_path, original_filename, mime_type, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run('asa1', 'ap1', '/uploads/source.png', 'source.png', 'image/png', now);

      expect(() => {
        db.prepare(
          `INSERT INTO adaptation_source_assets (id, project_id, storage_path, original_filename, mime_type, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run('asa2', 'ap1', '/uploads/source-2.png', 'source-2.png', 'image/png', now);
      }).toThrow();
    });

    test('enforces UNIQUE(output_id, attempt_number) on adaptation_output_attempts', () => {
      initializeSchema(db);

      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u1', 'owner@test.com', 'hash', now, now);
      db.prepare(
        `INSERT INTO adaptation_projects (id, owner_id, name, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('ap1', 'u1', 'Campaign', now, now);
      db.prepare(
        `INSERT INTO adaptation_requested_outputs (id, project_id, label, aspect_ratio, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run('aro1', 'ap1', 'Story', '9:16', now, now);
      db.prepare(
        `INSERT INTO adaptation_output_attempts (id, output_id, attempt_number, created_at)
         VALUES (?, ?, ?, ?)`
      ).run('aoa1', 'aro1', 1, now);

      expect(() => {
        db.prepare(
          `INSERT INTO adaptation_output_attempts (id, output_id, attempt_number, created_at)
           VALUES (?, ?, ?, ?)`
        ).run('aoa2', 'aro1', 1, now);
      }).toThrow();
    });

    test('enforces UNIQUE(user_id, date) on daily_usage_aggregates', () => {
      initializeSchema(db);

      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u1', 'user@test.com', 'hash', now, now);

      db.prepare(
        `INSERT INTO daily_usage_aggregates (id, user_id, date, created_at)
         VALUES (?, ?, ?, ?)`
      ).run('d1', 'u1', '2024-01-15', now);

      expect(() => {
        db.prepare(
          `INSERT INTO daily_usage_aggregates (id, user_id, date, created_at)
           VALUES (?, ?, ?, ?)`
        ).run('d2', 'u1', '2024-01-15', now);
      }).toThrow();
    });

    test('enforces UNIQUE(user_id, platform) on platform_usage_stats', () => {
      initializeSchema(db);

      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u1', 'user@test.com', 'hash', now, now);

      db.prepare(
        `INSERT INTO platform_usage_stats (id, user_id, platform, created_at)
         VALUES (?, ?, ?, ?)`
      ).run('ps1', 'u1', 'instagram', now);

      expect(() => {
        db.prepare(
          `INSERT INTO platform_usage_stats (id, user_id, platform, created_at)
           VALUES (?, ?, ?, ?)`
        ).run('ps2', 'u1', 'instagram', now);
      }).toThrow();
    });

    test('enforces UNIQUE(user_id, date, service_provider) on cost_tracking', () => {
      initializeSchema(db);

      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u1', 'user@test.com', 'hash', now, now);

      db.prepare(
        `INSERT INTO cost_tracking (id, user_id, date, service_provider, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('ct1', 'u1', '2024-01-15', 'openai', now);

      expect(() => {
        db.prepare(
          `INSERT INTO cost_tracking (id, user_id, date, service_provider, created_at)
           VALUES (?, ?, ?, ?, ?)`
        ).run('ct2', 'u1', '2024-01-15', 'openai', now);
      }).toThrow();
    });

    test('enforces UNIQUE(user_id, week_start_date) on user_engagement', () => {
      initializeSchema(db);

      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u1', 'user@test.com', 'hash', now, now);

      db.prepare(
        `INSERT INTO user_engagement (id, user_id, week_start_date, created_at)
         VALUES (?, ?, ?, ?)`
      ).run('ue1', 'u1', '2024-01-15', now);

      expect(() => {
        db.prepare(
          `INSERT INTO user_engagement (id, user_id, week_start_date, created_at)
           VALUES (?, ?, ?, ?)`
        ).run('ue2', 'u1', '2024-01-15', now);
      }).toThrow();
    });

    test('enforces UNIQUE metric_date on system_metrics', () => {
      initializeSchema(db);

      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO system_metrics (id, metric_date, created_at)
         VALUES (?, ?, ?)`
      ).run('sm1', '2024-01-15', now);

      expect(() => {
        db.prepare(
          `INSERT INTO system_metrics (id, metric_date, created_at)
           VALUES (?, ?, ?)`
        ).run('sm2', '2024-01-15', now);
      }).toThrow();
    });

    test('enforces UNIQUE user_id on user_usage_stats', () => {
      initializeSchema(db);

      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u1', 'user@test.com', 'hash', now, now);

      db.prepare(
        `INSERT INTO user_usage_stats (id, user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?)`
      ).run('uus1', 'u1', now, now);

      expect(() => {
        db.prepare(
          `INSERT INTO user_usage_stats (id, user_id, created_at, updated_at)
           VALUES (?, ?, ?, ?)`
        ).run('uus2', 'u1', now, now);
      }).toThrow();
    });

    test('enforces CHECK constraints on projects.status', () => {
      initializeSchema(db);

      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u1', 'user@test.com', 'hash', now, now);

      expect(() => {
        db.prepare(
          `INSERT INTO projects (id, name, owner_id, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run('p1', 'Test', 'u1', 'invalid_status', now, now);
      }).toThrow();
    });

    test('enforces CHECK constraints on projects.visibility', () => {
      initializeSchema(db);

      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u1', 'user@test.com', 'hash', now, now);

      expect(() => {
        db.prepare(
          `INSERT INTO projects (id, name, owner_id, visibility, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run('p1', 'Test', 'u1', 'bad_visibility', now, now);
      }).toThrow();
    });

    test('enforces CHECK constraints on project_collaborators.role', () => {
      initializeSchema(db);

      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u1', 'user@test.com', 'hash', now, now);
      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u2', 'collab@test.com', 'hash', now, now);
      db.prepare(
        `INSERT INTO projects (id, name, owner_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('p1', 'Test', 'u1', now, now);

      expect(() => {
        db.prepare(
          `INSERT INTO project_collaborators (id, project_id, user_id, role, invited_by, invited_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run('pc1', 'p1', 'u2', 'superadmin', 'u1', now);
      }).toThrow();
    });

    test('enforces CHECK constraints on adaptation_projects.status', () => {
      initializeSchema(db);

      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u1', 'user@test.com', 'hash', now, now);

      expect(() => {
        db.prepare(
          `INSERT INTO adaptation_projects (id, owner_id, name, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run('ap1', 'u1', 'Campaign', 'bad_status', now, now);
      }).toThrow();
    });

    test('enforces CHECK constraints on adaptation_requested_outputs.status', () => {
      initializeSchema(db);

      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u1', 'user@test.com', 'hash', now, now);
      db.prepare(
        `INSERT INTO adaptation_projects (id, owner_id, name, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('ap1', 'u1', 'Campaign', now, now);

      expect(() => {
        db.prepare(
          `INSERT INTO adaptation_requested_outputs (id, project_id, label, aspect_ratio, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run('aro1', 'ap1', 'Story', '9:16', 'retrying', now, now);
      }).toThrow();
    });

    test('creates indexes', () => {
      initializeSchema(db);

      const indexes = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name"
      ).all();

      expect(indexes.length).toBeGreaterThan(0);

      const indexNames = indexes.map((i) => i.name);
      // Spot-check some key indexes
      expect(indexNames).toContain('idx_projects_owner_id');
      expect(indexNames).toContain('idx_analytics_events_user_id');
      expect(indexNames).toContain('idx_analytics_events_created_at');
      expect(indexNames).toContain('idx_generations_user_id');
      expect(indexNames).toContain('idx_generated_images_generation_id');
      expect(indexNames).toContain('idx_adaptation_projects_owner_id');
      expect(indexNames).toContain('idx_adaptation_output_attempts_output_id');
    });

    test('can insert and retrieve across related tables', () => {
      initializeSchema(db);

      const now = new Date().toISOString();

      // User
      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u1', 'user@test.com', 'hash', now, now);

      // Generation
      db.prepare(
        `INSERT INTO generations (id, user_id, prompt, image_type, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run('g1', 'u1', 'a cat', 'social', 'completed', now);

      // Generated image
      db.prepare(
        `INSERT INTO generated_images (id, generation_id, platform_id, platform_name, width, height, storage_path, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run('gi1', 'g1', 'instagram-post', 'Instagram Post', 1080, 1080, '/images/gi1.png', now);

      const gen = db.prepare('SELECT * FROM generations WHERE id = ?').get('g1');
      expect(gen.prompt).toBe('a cat');
      expect(gen.status).toBe('completed');

      const img = db.prepare('SELECT * FROM generated_images WHERE generation_id = ?').get('g1');
      expect(img.platform_name).toBe('Instagram Post');
      expect(img.width).toBe(1080);
    });

    test('can insert and retrieve adaptation project data across related tables', () => {
      initializeSchema(db);

      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u1', 'user@test.com', 'hash', now, now);

      db.prepare(
        `INSERT INTO adaptation_projects (id, owner_id, name, preservation_intent, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run('ap1', 'u1', 'Spring Sale', '["logo integrity"]', now, now);

      db.prepare(
        `INSERT INTO adaptation_source_assets (id, project_id, storage_path, original_filename, mime_type, width, height, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run('asa1', 'ap1', '/uploads/source.png', 'source.png', 'image/png', 1200, 1500, now);

      db.prepare(
        `INSERT INTO adaptation_requested_outputs (id, project_id, label, aspect_ratio, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run('aro1', 'ap1', 'Instagram Story', '9:16', now, now);

      db.prepare(
        `INSERT INTO adaptation_output_attempts (id, output_id, attempt_number, status, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('aoa1', 'aro1', 1, 'queued', now);

      const project = db.prepare('SELECT * FROM adaptation_projects WHERE id = ?').get('ap1');
      const sourceAsset = db.prepare('SELECT * FROM adaptation_source_assets WHERE project_id = ?').get('ap1');
      const output = db.prepare('SELECT * FROM adaptation_requested_outputs WHERE project_id = ?').get('ap1');
      const attempt = db.prepare('SELECT * FROM adaptation_output_attempts WHERE output_id = ?').get('aro1');

      expect(project.name).toBe('Spring Sale');
      expect(JSON.parse(project.preservation_intent)).toEqual(['logo integrity']);
      expect(sourceAsset.original_filename).toBe('source.png');
      expect(output.aspect_ratio).toBe('9:16');
      expect(attempt.status).toBe('queued');
    });

    test('stores JSON fields as TEXT', () => {
      initializeSchema(db);

      const now = new Date().toISOString();
      const metadata = JSON.stringify({ theme: 'dark', lang: 'en' });

      db.prepare(
        `INSERT INTO users (id, email, password_hash, metadata, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run('u1', 'user@test.com', 'hash', metadata, now, now);

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get('u1');
      expect(user.metadata).toBe(metadata);
      expect(JSON.parse(user.metadata)).toEqual({ theme: 'dark', lang: 'en' });
    });

    test('default values are applied correctly', () => {
      initializeSchema(db);

      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('u1', 'user@test.com', 'hash', now, now);

      db.prepare(
        `INSERT INTO projects (id, name, owner_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run('p1', 'Test', 'u1', now, now);

      const project = db.prepare('SELECT * FROM projects WHERE id = ?').get('p1');
      expect(project.status).toBe('active');
      expect(project.visibility).toBe('private');
      expect(project.settings).toBe('{}');
      expect(project.tags).toBe('[]');
      expect(project.categories).toBe('[]');
    });

    test('foreign key constraints are enforced', () => {
      initializeSchema(db);

      const now = new Date().toISOString();

      // Trying to insert a project with a non-existent owner should fail
      expect(() => {
        db.prepare(
          `INSERT INTO projects (id, name, owner_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)`
        ).run('p1', 'Test', 'nonexistent-user', now, now);
      }).toThrow();
    });
  });
});
