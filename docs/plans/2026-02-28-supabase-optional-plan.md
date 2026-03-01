# Make Supabase Optional - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Supabase optional by introducing a provider abstraction layer with SQLite + local filesystem + local JWT auth as a first-class self-hosted alternative.

**Architecture:** Repository pattern with adapter injection. A factory reads config at startup and returns the correct set of providers (db, storage, auth). Services receive adapters and never know which backend is active. SQLite via better-sqlite3 for local DB, bcrypt+jsonwebtoken for local auth, Express static serving for local storage.

**Tech Stack:** better-sqlite3, bcrypt, jsonwebtoken, uuid (for local ID generation)

**Design Doc:** `docs/plans/2026-02-28-supabase-optional-design.md`

---

### Task 1: Install Dependencies & Setup

**Files:**

- Modify: `server/package.json`
- Modify: `.gitignore`

**Step 1: Install new dependencies**

Run: `cd server && npm install better-sqlite3 bcrypt jsonwebtoken uuid`
Expected: Packages added to package.json

**Step 2: Add data directory to .gitignore**

Add to `.gitignore`:

```
# Local database and storage
server/data/
```

**Step 3: Commit**

```bash
git add server/package.json server/package-lock.json .gitignore
git commit -m "chore: add better-sqlite3, bcrypt, jsonwebtoken dependencies"
```

---

### Task 2: SQLite Schema

**Files:**

- Create: `server/providers/local/schema.js`

**Step 1: Write the failing test**

Create `server/providers/local/schema.test.js`:

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { initializeSchema } from './schema.js';

describe('SQLite Schema', () => {
  let db;

  beforeEach(() => {
    db = new Database(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  it('creates all required tables', () => {
    initializeSchema(db);

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((t) => t.name);

    expect(tables).toContain('users');
    expect(tables).toContain('projects');
    expect(tables).toContain('project_images');
    expect(tables).toContain('project_collaborators');
    expect(tables).toContain('project_versions');
    expect(tables).toContain('analytics_events');
    expect(tables).toContain('user_usage_stats');
    expect(tables).toContain('daily_usage_aggregates');
    expect(tables).toContain('platform_usage_stats');
    expect(tables).toContain('cost_tracking');
    expect(tables).toContain('performance_metrics');
    expect(tables).toContain('user_engagement');
    expect(tables).toContain('system_metrics');
    expect(tables).toContain('generations');
    expect(tables).toContain('generated_images');
  });

  it('is idempotent (can run twice without error)', () => {
    initializeSchema(db);
    expect(() => initializeSchema(db)).not.toThrow();
  });

  it('can insert and retrieve a user', () => {
    initializeSchema(db);

    db.prepare('INSERT INTO users (id, email, password_hash, metadata) VALUES (?, ?, ?, ?)').run(
      'test-id',
      'test@example.com',
      'hash',
      '{}'
    );

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get('test@example.com');
    expect(user.id).toBe('test-id');
    expect(user.email).toBe('test@example.com');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run providers/local/schema.test.js`
Expected: FAIL - cannot find ./schema.js

**Step 3: Write minimal implementation**

Create `server/providers/local/schema.js`:

```javascript
/**
 * SQLite schema initialization
 * Mirrors the Supabase/PostgreSQL schema for local mode
 */

export function initializeSchema(db) {
  db.exec(`
    -- Users table (replaces Supabase auth.users)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      metadata TEXT DEFAULT '{}',
      email_verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Projects
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      template_id TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
      visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'shared', 'public')),
      settings TEXT DEFAULT '{}',
      tags TEXT DEFAULT '[]',
      categories TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    -- Project Images
    CREATE TABLE IF NOT EXISTS project_images (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      image_id TEXT NOT NULL,
      "order" INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(project_id, image_id)
    );

    -- Project Collaborators
    CREATE TABLE IF NOT EXISTS project_collaborators (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
      permissions TEXT DEFAULT '[]',
      invited_by TEXT NOT NULL REFERENCES users(id),
      invited_at TEXT DEFAULT (datetime('now')),
      accepted_at TEXT,
      UNIQUE(project_id, user_id)
    );

    -- Project Versions
    CREATE TABLE IF NOT EXISTS project_versions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      version_number INTEGER NOT NULL,
      snapshot TEXT NOT NULL DEFAULT '{}',
      changes TEXT DEFAULT '[]',
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      notes TEXT DEFAULT '',
      UNIQUE(project_id, version_number)
    );

    -- Analytics Events
    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      session_id TEXT,
      event_type TEXT NOT NULL,
      event_category TEXT,
      event_action TEXT,
      event_label TEXT,
      event_value REAL,
      metadata TEXT DEFAULT '{}',
      ip_address TEXT,
      user_agent TEXT,
      referrer TEXT,
      platform TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- User Usage Stats
    CREATE TABLE IF NOT EXISTS user_usage_stats (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      total_images_generated INTEGER DEFAULT 0,
      total_images_downloaded INTEGER DEFAULT 0,
      total_projects_created INTEGER DEFAULT 0,
      storage_used_bytes INTEGER DEFAULT 0,
      total_api_calls INTEGER DEFAULT 0,
      total_active_time_seconds INTEGER DEFAULT 0,
      last_active_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Daily Usage Aggregates
    CREATE TABLE IF NOT EXISTS daily_usage_aggregates (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      images_generated INTEGER DEFAULT 0,
      images_downloaded INTEGER DEFAULT 0,
      projects_created INTEGER DEFAULT 0,
      api_calls INTEGER DEFAULT 0,
      active_time_seconds INTEGER DEFAULT 0,
      unique_sessions INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, date)
    );

    -- Platform Usage Stats
    CREATE TABLE IF NOT EXISTS platform_usage_stats (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      usage_count INTEGER DEFAULT 0,
      last_used_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, platform)
    );

    -- Cost Tracking
    CREATE TABLE IF NOT EXISTS cost_tracking (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      service_provider TEXT,
      api_calls INTEGER DEFAULT 0,
      total_cost_usd REAL DEFAULT 0,
      tokens_used INTEGER DEFAULT 0,
      images_generated INTEGER DEFAULT 0,
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, date, service_provider)
    );

    -- Performance Metrics
    CREATE TABLE IF NOT EXISTS performance_metrics (
      id TEXT PRIMARY KEY,
      metric_type TEXT NOT NULL,
      metric_name TEXT NOT NULL,
      value REAL,
      unit TEXT,
      tags TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- User Engagement
    CREATE TABLE IF NOT EXISTS user_engagement (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      week_start_date TEXT NOT NULL,
      days_active INTEGER DEFAULT 0,
      sessions_count INTEGER DEFAULT 0,
      total_actions INTEGER DEFAULT 0,
      features_used TEXT DEFAULT '[]',
      retention_cohort TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, week_start_date)
    );

    -- System Metrics
    CREATE TABLE IF NOT EXISTS system_metrics (
      id TEXT PRIMARY KEY,
      metric_date TEXT NOT NULL UNIQUE,
      total_users INTEGER DEFAULT 0,
      active_users INTEGER DEFAULT 0,
      new_users INTEGER DEFAULT 0,
      total_images INTEGER DEFAULT 0,
      total_projects INTEGER DEFAULT 0,
      total_api_calls INTEGER DEFAULT 0,
      average_response_time_ms REAL,
      error_rate REAL,
      storage_used_gb REAL,
      total_cost_usd REAL,
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Generations
    CREATE TABLE IF NOT EXISTS generations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      prompt TEXT NOT NULL,
      image_type TEXT DEFAULT 'photo',
      status TEXT DEFAULT 'completed',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Generated Images
    CREATE TABLE IF NOT EXISTS generated_images (
      id TEXT PRIMARY KEY,
      generation_id TEXT NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
      platform_id TEXT,
      platform_name TEXT,
      width INTEGER,
      height INTEGER,
      file_size INTEGER,
      storage_path TEXT,
      url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_project_images_project ON project_images(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_collaborators_project ON project_collaborators(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_collaborators_user ON project_collaborators(user_id);
    CREATE INDEX IF NOT EXISTS idx_project_versions_project ON project_versions(project_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_usage_aggregates(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_cost_tracking_user_date ON cost_tracking(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
    CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id);
  `);
}
```

**Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run providers/local/schema.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add server/providers/local/schema.js server/providers/local/schema.test.js
git commit -m "feat: add SQLite schema for local database provider"
```

---

### Task 3: Local Auth Adapter

**Files:**

- Create: `server/providers/local/LocalAuthAdapter.js`
- Test: `server/providers/local/LocalAuthAdapter.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { initializeSchema } from './schema.js';
import { LocalAuthAdapter } from './LocalAuthAdapter.js';

describe('LocalAuthAdapter', () => {
  let db, auth;

  beforeEach(() => {
    db = new Database(':memory:');
    initializeSchema(db);
    auth = new LocalAuthAdapter(db, 'test-secret-key-at-least-32-chars-long');
  });

  afterEach(() => {
    db.close();
  });

  describe('register', () => {
    it('creates a user and returns user object without password', async () => {
      const user = await auth.register('test@example.com', 'password123', {
        full_name: 'Test User',
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.user_metadata).toEqual({ full_name: 'Test User' });
      expect(user.password_hash).toBeUndefined();
    });

    it('rejects duplicate emails', async () => {
      await auth.register('test@example.com', 'password123');
      await expect(auth.register('test@example.com', 'other')).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('returns a JWT token and user on valid credentials', async () => {
      await auth.register('test@example.com', 'password123');
      const result = await auth.login('test@example.com', 'password123');

      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('rejects invalid password', async () => {
      await auth.register('test@example.com', 'password123');
      await expect(auth.login('test@example.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });

    it('rejects unknown email', async () => {
      await expect(auth.login('nope@example.com', 'pass')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('verifyToken', () => {
    it('returns user from a valid token', async () => {
      await auth.register('test@example.com', 'password123');
      const { token } = await auth.login('test@example.com', 'password123');

      const user = await auth.verifyToken(token);
      expect(user.email).toBe('test@example.com');
    });

    it('rejects invalid token', async () => {
      await expect(auth.verifyToken('garbage')).rejects.toThrow();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run providers/local/LocalAuthAdapter.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**

```javascript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '24h';

export class LocalAuthAdapter {
  constructor(db, jwtSecret) {
    this.db = db;
    this.jwtSecret = jwtSecret;
  }

  async register(email, password, metadata = {}) {
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      this.db
        .prepare('INSERT INTO users (id, email, password_hash, metadata) VALUES (?, ?, ?, ?)')
        .run(id, email, passwordHash, JSON.stringify(metadata));
    } catch (err) {
      if (err.message.includes('UNIQUE constraint')) {
        throw new Error('User already exists');
      }
      throw err;
    }

    return { id, email, user_metadata: metadata, created_at: new Date().toISOString() };
  }

  async login(email, password) {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!row) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) throw new Error('Invalid credentials');

    const token = jwt.sign({ sub: row.id, email: row.email }, this.jwtSecret, {
      expiresIn: TOKEN_EXPIRY,
    });

    const user = {
      id: row.id,
      email: row.email,
      user_metadata: JSON.parse(row.metadata || '{}'),
      created_at: row.created_at,
    };

    return { token, user };
  }

  async verifyToken(token) {
    const payload = jwt.verify(token, this.jwtSecret);
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub);
    if (!row) throw new Error('User not found');

    return {
      id: row.id,
      email: row.email,
      user_metadata: JSON.parse(row.metadata || '{}'),
      created_at: row.created_at,
    };
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run providers/local/LocalAuthAdapter.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add server/providers/local/LocalAuthAdapter.js server/providers/local/LocalAuthAdapter.test.js
git commit -m "feat: add local auth adapter with bcrypt + JWT"
```

---

### Task 4: Local Storage Adapter

**Files:**

- Create: `server/providers/local/LocalStorageAdapter.js`
- Test: `server/providers/local/LocalStorageAdapter.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { LocalStorageAdapter } from './LocalStorageAdapter.js';

describe('LocalStorageAdapter', () => {
  let storage, tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapasset-test-'));
    storage = new LocalStorageAdapter(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('uploads a file and returns a URL', async () => {
    const buffer = Buffer.from('fake image data');
    const result = await storage.upload('generated-images', 'user1/gen1/test.png', buffer);

    expect(result.url).toBe('/storage/generated-images/user1/gen1/test.png');
    expect(fs.existsSync(path.join(tmpDir, 'generated-images', 'user1', 'gen1', 'test.png'))).toBe(
      true
    );
  });

  it('getPublicUrl returns correct path', () => {
    const url = storage.getPublicUrl('generated-images', 'user1/gen1/test.png');
    expect(url).toBe('/storage/generated-images/user1/gen1/test.png');
  });

  it('deletes a file', async () => {
    const buffer = Buffer.from('fake image data');
    await storage.upload('generated-images', 'user1/gen1/test.png', buffer);

    await storage.delete('generated-images', 'user1/gen1/test.png');
    expect(fs.existsSync(path.join(tmpDir, 'generated-images', 'user1', 'gen1', 'test.png'))).toBe(
      false
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run providers/local/LocalStorageAdapter.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**

```javascript
import fs from 'fs';
import path from 'path';

export class LocalStorageAdapter {
  constructor(basePath) {
    this.basePath = basePath;
  }

  async upload(bucket, filePath, buffer, options = {}) {
    const fullPath = path.join(this.basePath, bucket, filePath);
    const dir = path.dirname(fullPath);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, buffer);

    return {
      path: filePath,
      url: this.getPublicUrl(bucket, filePath),
    };
  }

  getPublicUrl(bucket, filePath) {
    return `/storage/${bucket}/${filePath}`;
  }

  async delete(bucket, filePath) {
    const fullPath = path.join(this.basePath, bucket, filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run providers/local/LocalStorageAdapter.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add server/providers/local/LocalStorageAdapter.js server/providers/local/LocalStorageAdapter.test.js
git commit -m "feat: add local filesystem storage adapter"
```

---

### Task 5: Supabase Auth Adapter

**Files:**

- Create: `server/providers/supabase/SupabaseAuthAdapter.js`
- Test: `server/providers/supabase/SupabaseAuthAdapter.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, vi } from 'vitest';
import { SupabaseAuthAdapter } from './SupabaseAuthAdapter.js';

describe('SupabaseAuthAdapter', () => {
  it('verifyToken calls supabase.auth.getUser and returns user', async () => {
    const mockUser = { id: 'u1', email: 'a@b.com' };
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    };

    const adapter = new SupabaseAuthAdapter(mockSupabase);
    const user = await adapter.verifyToken('fake-token');

    expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('fake-token');
    expect(user.id).toBe('u1');
  });

  it('verifyToken throws on error', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'bad' } }),
      },
    };

    const adapter = new SupabaseAuthAdapter(mockSupabase);
    await expect(adapter.verifyToken('bad')).rejects.toThrow('Invalid token');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run providers/supabase/SupabaseAuthAdapter.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**

```javascript
export class SupabaseAuthAdapter {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async verifyToken(token) {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser(token);
    if (error || !user) throw new Error('Invalid token');
    return user;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run providers/supabase/SupabaseAuthAdapter.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add server/providers/supabase/SupabaseAuthAdapter.js server/providers/supabase/SupabaseAuthAdapter.test.js
git commit -m "feat: add Supabase auth adapter wrapper"
```

---

### Task 6: Supabase Storage Adapter

**Files:**

- Create: `server/providers/supabase/SupabaseStorageAdapter.js`
- Test: `server/providers/supabase/SupabaseStorageAdapter.test.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect, vi } from 'vitest';
import { SupabaseStorageAdapter } from './SupabaseStorageAdapter.js';

describe('SupabaseStorageAdapter', () => {
  it('upload calls supabase storage and returns url', async () => {
    const mockSupabase = {
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ data: { path: 'user/file.png' }, error: null }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn/file.png' } }),
        }),
      },
    };

    const adapter = new SupabaseStorageAdapter(mockSupabase);
    const result = await adapter.upload('generated-images', 'user/file.png', Buffer.from('data'));

    expect(result.url).toBe('https://cdn/file.png');
    expect(mockSupabase.storage.from).toHaveBeenCalledWith('generated-images');
  });

  it('getPublicUrl returns supabase public URL', () => {
    const mockSupabase = {
      storage: {
        from: vi.fn().mockReturnValue({
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn/file.png' } }),
        }),
      },
    };

    const adapter = new SupabaseStorageAdapter(mockSupabase);
    expect(adapter.getPublicUrl('bucket', 'path')).toBe('https://cdn/file.png');
  });
});
```

**Step 2: Run test, verify fail, write implementation**

```javascript
export class SupabaseStorageAdapter {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async upload(bucket, filePath, buffer, options = {}) {
    const { data, error } = await this.supabase.storage.from(bucket).upload(filePath, buffer, {
      contentType: options.contentType || 'image/png',
      cacheControl: options.cacheControl || '3600',
      upsert: true,
    });

    if (error) throw error;

    const { data: urlData } = this.supabase.storage.from(bucket).getPublicUrl(filePath);

    return { path: data.path, url: urlData.publicUrl };
  }

  getPublicUrl(bucket, filePath) {
    const { data } = this.supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  }

  async delete(bucket, filePath) {
    const { error } = await this.supabase.storage.from(bucket).remove([filePath]);
    if (error) throw error;
  }
}
```

**Step 3: Run test to verify it passes**

Run: `cd server && npx vitest run providers/supabase/SupabaseStorageAdapter.test.js`
Expected: PASS

**Step 4: Commit**

```bash
git add server/providers/supabase/SupabaseStorageAdapter.js server/providers/supabase/SupabaseStorageAdapter.test.js
git commit -m "feat: add Supabase storage adapter wrapper"
```

---

### Task 7: SQLite DB Adapter - Projects Domain

**Files:**

- Create: `server/providers/local/SqliteDbAdapter.js`
- Test: `server/providers/local/SqliteDbAdapter.test.js`

This is the largest task. The SqliteDbAdapter must implement all repository methods from the design doc grouped into `projects`, `analytics`, `images`, and `users` namespaces.

**Step 1: Write failing tests for projects domain**

Create `server/providers/local/SqliteDbAdapter.test.js` with project-focused tests:

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { initializeSchema } from './schema.js';
import { SqliteDbAdapter } from './SqliteDbAdapter.js';

describe('SqliteDbAdapter - projects', () => {
  let db, adapter;
  const userId = 'user-1';

  beforeEach(() => {
    db = new Database(':memory:');
    initializeSchema(db);
    adapter = new SqliteDbAdapter(db);
    // Seed a test user
    db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(
      userId,
      'test@test.com',
      'hash'
    );
  });

  afterEach(() => {
    db.close();
  });

  it('creates and retrieves a project', async () => {
    const project = await adapter.projects.create({
      name: 'Test Project',
      owner_id: userId,
      description: 'desc',
      tags: ['a'],
      categories: ['b'],
      visibility: 'private',
      status: 'active',
    });

    expect(project.id).toBeDefined();
    expect(project.name).toBe('Test Project');

    const found = await adapter.projects.findById(project.id);
    expect(found.name).toBe('Test Project');
    expect(found.project_images).toEqual([]);
    expect(found.collaborators).toEqual([]);
  });

  it('findByUser returns paginated results', async () => {
    await adapter.projects.create({ name: 'P1', owner_id: userId });
    await adapter.projects.create({ name: 'P2', owner_id: userId });

    const result = await adapter.projects.findByUser(userId, {}, { page: 1, limit: 10 });
    expect(result.data.length).toBe(2);
    expect(result.count).toBe(2);
  });

  it('updates a project', async () => {
    const p = await adapter.projects.create({ name: 'Old', owner_id: userId });
    const updated = await adapter.projects.update(p.id, { name: 'New' });
    expect(updated.name).toBe('New');
  });

  it('soft deletes a project', async () => {
    const p = await adapter.projects.create({ name: 'P', owner_id: userId });
    await adapter.projects.delete(p.id, true);

    const found = await adapter.projects.findById(p.id);
    expect(found.status).toBe('deleted');
  });

  it('hard deletes a project', async () => {
    const p = await adapter.projects.create({ name: 'P', owner_id: userId });
    await adapter.projects.delete(p.id, false);

    expect(await adapter.projects.findById(p.id)).toBeUndefined();
  });

  it('manages images in a project', async () => {
    const p = await adapter.projects.create({ name: 'P', owner_id: userId });

    await adapter.projects.addImages(p.id, ['img-1', 'img-2']);
    const images = await adapter.projects.getImages(p.id, { page: 1, limit: 10 });
    expect(images.data.length).toBe(2);

    await adapter.projects.removeImages(p.id, ['img-1']);
    const after = await adapter.projects.getImages(p.id, { page: 1, limit: 10 });
    expect(after.data.length).toBe(1);
  });

  it('manages collaborators', async () => {
    const p = await adapter.projects.create({ name: 'P', owner_id: userId });
    const user2 = 'user-2';
    db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(
      user2,
      'u2@test.com',
      'hash'
    );

    await adapter.projects.addCollaborator(p.id, {
      user_id: user2,
      role: 'editor',
      permissions: ['read', 'write'],
      invited_by: userId,
    });
    const collabs = await adapter.projects.getCollaborators(p.id);
    expect(collabs.length).toBe(1);
    expect(collabs[0].role).toBe('editor');

    await adapter.projects.removeCollaborator(p.id, user2);
    expect((await adapter.projects.getCollaborators(p.id)).length).toBe(0);
  });

  it('manages versions', async () => {
    const p = await adapter.projects.create({ name: 'P', owner_id: userId });

    const v = await adapter.projects.createVersion(p.id, userId, 'Initial');
    expect(v.version_number).toBe(1);

    const versions = await adapter.projects.getVersions(p.id);
    expect(versions.length).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run providers/local/SqliteDbAdapter.test.js`
Expected: FAIL

**Step 3: Write implementation**

Create `server/providers/local/SqliteDbAdapter.js`. This file will contain the full adapter. Start with the projects namespace:

```javascript
import { v4 as uuidv4 } from 'uuid';

export class SqliteDbAdapter {
  constructor(db) {
    this.db = db;
    this.projects = new ProjectsRepository(db);
    this.analytics = new AnalyticsRepository(db);
    this.images = new ImagesRepository(db);
    this.users = new UsersRepository(db);
  }
}

class ProjectsRepository {
  constructor(db) {
    this.db = db;
  }

  async create(data) {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
      INSERT INTO projects (id, name, description, owner_id, template_id, status, visibility, settings, tags, categories, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        id,
        data.name,
        data.description || '',
        data.owner_id,
        data.template_id || null,
        data.status || 'active',
        data.visibility || 'private',
        JSON.stringify(data.settings || {}),
        JSON.stringify(data.tags || []),
        JSON.stringify(data.categories || []),
        now,
        now
      );
    return this._getById(id);
  }

  async findById(id) {
    const row = this._getById(id);
    if (!row) return undefined;

    row.project_images = this.db
      .prepare('SELECT * FROM project_images WHERE project_id = ? ORDER BY "order"')
      .all(id)
      .map((r) => this._parseJson(r, ['tags', 'metadata']));
    row.collaborators = this.db
      .prepare(
        `
      SELECT pc.*, u.email as user_email FROM project_collaborators pc
      LEFT JOIN users u ON pc.user_id = u.id WHERE pc.project_id = ?
    `
      )
      .all(id)
      .map((r) => this._parseJson(r, ['permissions']));
    return row;
  }

  async findByUser(userId, filters = {}, pagination = {}) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const offset = (page - 1) * limit;

    let where =
      'WHERE (owner_id = ? OR id IN (SELECT project_id FROM project_collaborators WHERE user_id = ?))';
    const params = [userId, userId];

    if (filters.status) {
      where += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.visibility) {
      where += ' AND visibility = ?';
      params.push(filters.visibility);
    }
    if (filters.search) {
      where += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const countRow = this.db
      .prepare(`SELECT COUNT(*) as count FROM projects ${where}`)
      .get(...params);
    const rows = this.db
      .prepare(`SELECT * FROM projects ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);

    return { data: rows.map((r) => this._parseJsonFields(r)), count: countRow.count };
  }

  async update(id, data) {
    const sets = [];
    const params = [];
    for (const [key, value] of Object.entries(data)) {
      if (['tags', 'categories', 'settings'].includes(key)) {
        sets.push(`${key} = ?`);
        params.push(JSON.stringify(value));
      } else {
        sets.push(`${key} = ?`);
        params.push(value);
      }
    }
    sets.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    this.db.prepare(`UPDATE projects SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return this._getById(id);
  }

  async delete(id, soft = true) {
    if (soft) {
      this.db
        .prepare('UPDATE projects SET status = ?, deleted_at = ? WHERE id = ?')
        .run('deleted', new Date().toISOString(), id);
    } else {
      this.db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    }
  }

  async addImages(projectId, imageIds) {
    const insert = this.db.prepare(
      'INSERT OR IGNORE INTO project_images (id, project_id, image_id, "order") VALUES (?, ?, ?, ?)'
    );
    const txn = this.db.transaction((ids) => {
      ids.forEach((imageId, index) => insert.run(uuidv4(), projectId, imageId, index));
    });
    txn(imageIds);
  }

  async getImages(projectId, pagination = {}) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 50;
    const offset = (page - 1) * limit;

    const countRow = this.db
      .prepare('SELECT COUNT(*) as count FROM project_images WHERE project_id = ?')
      .get(projectId);
    const rows = this.db
      .prepare(
        'SELECT * FROM project_images WHERE project_id = ? ORDER BY "order" LIMIT ? OFFSET ?'
      )
      .all(projectId, limit, offset);

    return {
      data: rows.map((r) => this._parseJson(r, ['tags', 'metadata'])),
      count: countRow.count,
    };
  }

  async removeImages(projectId, imageIds) {
    const placeholders = imageIds.map(() => '?').join(',');
    this.db
      .prepare(`DELETE FROM project_images WHERE project_id = ? AND image_id IN (${placeholders})`)
      .run(projectId, ...imageIds);
  }

  async addCollaborator(projectId, data) {
    const id = uuidv4();
    this.db
      .prepare(
        `
      INSERT INTO project_collaborators (id, project_id, user_id, role, permissions, invited_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        id,
        projectId,
        data.user_id,
        data.role || 'viewer',
        JSON.stringify(data.permissions || []),
        data.invited_by
      );
  }

  async getCollaborators(projectId) {
    return this.db
      .prepare(
        `
      SELECT pc.*, u.email as user_email FROM project_collaborators pc
      LEFT JOIN users u ON pc.user_id = u.id WHERE pc.project_id = ?
    `
      )
      .all(projectId)
      .map((r) => this._parseJson(r, ['permissions']));
  }

  async removeCollaborator(projectId, userId) {
    this.db
      .prepare('DELETE FROM project_collaborators WHERE project_id = ? AND user_id = ?')
      .run(projectId, userId);
  }

  async createVersion(projectId, createdBy, notes = '') {
    const id = uuidv4();
    const project = this._getById(projectId);
    const images = this.db
      .prepare('SELECT * FROM project_images WHERE project_id = ?')
      .all(projectId);

    const lastVersion = this.db
      .prepare('SELECT MAX(version_number) as max_v FROM project_versions WHERE project_id = ?')
      .get(projectId);
    const versionNumber = (lastVersion?.max_v || 0) + 1;

    this.db
      .prepare(
        `
      INSERT INTO project_versions (id, project_id, version_number, snapshot, created_by, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `
      )
      .run(id, projectId, versionNumber, JSON.stringify({ project, images }), createdBy, notes);

    return this.db.prepare('SELECT * FROM project_versions WHERE id = ?').get(id);
  }

  async getVersions(projectId) {
    return this.db
      .prepare('SELECT * FROM project_versions WHERE project_id = ? ORDER BY version_number DESC')
      .all(projectId)
      .map((r) => ({
        ...r,
        snapshot: JSON.parse(r.snapshot || '{}'),
        changes: JSON.parse(r.changes || '[]'),
      }));
  }

  async restoreVersion(projectId, versionId) {
    const version = this.db.prepare('SELECT * FROM project_versions WHERE id = ?').get(versionId);
    if (!version) throw new Error('Version not found');
    const snapshot = JSON.parse(version.snapshot);

    if (snapshot.project) {
      const { id, project_images, collaborators, ...fields } = snapshot.project;
      await this.update(projectId, fields);
    }

    this.db.prepare('DELETE FROM project_images WHERE project_id = ?').run(projectId);
    if (snapshot.images?.length > 0) {
      const insert = this.db.prepare(
        'INSERT INTO project_images (id, project_id, image_id, "order", tags, metadata) VALUES (?, ?, ?, ?, ?, ?)'
      );
      for (const img of snapshot.images) {
        insert.run(
          img.id || uuidv4(),
          projectId,
          img.image_id,
          img.order || 0,
          img.tags || '[]',
          img.metadata || '{}'
        );
      }
    }
    return this._getById(projectId);
  }

  _getById(id) {
    const row = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    return row ? this._parseJsonFields(row) : undefined;
  }

  _parseJsonFields(row) {
    return {
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      categories: JSON.parse(row.categories || '[]'),
      settings: JSON.parse(row.settings || '{}'),
    };
  }

  _parseJson(row, fields) {
    const result = { ...row };
    for (const f of fields) {
      if (result[f]) result[f] = JSON.parse(result[f]);
    }
    return result;
  }
}
```

**Note:** AnalyticsRepository, ImagesRepository, and UsersRepository classes are stubs in this step -- they will be filled in Tasks 8 and 9.

```javascript
class AnalyticsRepository {
  constructor(db) {
    this.db = db;
  }
  // Implemented in Task 8
}

class ImagesRepository {
  constructor(db) {
    this.db = db;
  }
  // Implemented in Task 9
}

class UsersRepository {
  constructor(db) {
    this.db = db;
  }

  async create(email, passwordHash, metadata = {}) {
    const id = uuidv4();
    this.db
      .prepare('INSERT INTO users (id, email, password_hash, metadata) VALUES (?, ?, ?, ?)')
      .run(id, email, passwordHash, JSON.stringify(metadata));
    return { id, email, metadata };
  }

  async findByEmail(email) {
    return this.db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }

  async findById(id) {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  }
}
```

**Step 4: Run tests to verify pass**

Run: `cd server && npx vitest run providers/local/SqliteDbAdapter.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add server/providers/local/SqliteDbAdapter.js server/providers/local/SqliteDbAdapter.test.js
git commit -m "feat: add SQLite DB adapter with projects domain"
```

---

### Task 8: SQLite DB Adapter - Analytics Domain

**Files:**

- Modify: `server/providers/local/SqliteDbAdapter.js` (fill in AnalyticsRepository)
- Add tests to: `server/providers/local/SqliteDbAdapter.test.js`

**Step 1: Write failing tests for analytics methods**

Add to test file:

```javascript
describe('SqliteDbAdapter - analytics', () => {
  let db, adapter;
  const userId = 'user-1';

  beforeEach(() => {
    db = new Database(':memory:');
    initializeSchema(db);
    adapter = new SqliteDbAdapter(db);
    db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(
      userId,
      'test@test.com',
      'hash'
    );
  });

  afterEach(() => {
    db.close();
  });

  it('tracks an event', async () => {
    await adapter.analytics.trackEvent({
      user_id: userId,
      event_type: 'image_generated',
      event_category: 'generation',
    });
    const events = db.prepare('SELECT * FROM analytics_events WHERE user_id = ?').all(userId);
    expect(events.length).toBe(1);
  });

  it('tracks cost with upsert logic', async () => {
    await adapter.analytics.trackCost({
      user_id: userId,
      date: '2026-02-28',
      service_provider: 'openai',
      cost: 0.04,
      tokens: 100,
      images: 1,
    });
    await adapter.analytics.trackCost({
      user_id: userId,
      date: '2026-02-28',
      service_provider: 'openai',
      cost: 0.02,
      tokens: 50,
      images: 1,
    });

    const row = db
      .prepare('SELECT * FROM cost_tracking WHERE user_id = ? AND date = ?')
      .get(userId, '2026-02-28');
    expect(row.api_calls).toBe(2);
    expect(row.total_cost_usd).toBeCloseTo(0.06);
  });

  it('tracks performance metrics', async () => {
    await adapter.analytics.trackPerformance({
      metric_type: 'api_response',
      metric_name: 'GET /api',
      value: 42,
      unit: 'ms',
    });
    const rows = db.prepare('SELECT * FROM performance_metrics').all();
    expect(rows.length).toBe(1);
  });

  it('gets dashboard data without errors', async () => {
    const dashboard = await adapter.analytics.getDashboard(userId, '30d');
    expect(dashboard).toBeDefined();
    expect(dashboard.overview).toBeDefined();
  });
});
```

**Step 2: Implement AnalyticsRepository**

Fill in all analytics methods following the same query patterns as AnalyticsService but using SQLite prepared statements. The key difference: SQLite uses `datetime()` instead of Postgres `NOW()`, TEXT instead of UUID, and JSON parsing for JSONB columns.

Each method maps to the corresponding AnalyticsService method, performing direct SQL queries instead of Supabase chaining. Helper methods like `parsePeriod`, `calculateTrends`, `aggregateCosts` can be shared by importing from AnalyticsService or duplicating the pure JS helpers.

**Step 3: Run tests, verify pass, commit**

```bash
git add server/providers/local/SqliteDbAdapter.js server/providers/local/SqliteDbAdapter.test.js
git commit -m "feat: add analytics domain to SQLite DB adapter"
```

---

### Task 9: SQLite DB Adapter - Images Domain

**Files:**

- Modify: `server/providers/local/SqliteDbAdapter.js` (fill in ImagesRepository)
- Add tests to: `server/providers/local/SqliteDbAdapter.test.js`

**Step 1: Write failing tests**

```javascript
describe('SqliteDbAdapter - images', () => {
  let db, adapter;
  const userId = 'user-1';

  beforeEach(() => {
    db = new Database(':memory:');
    initializeSchema(db);
    adapter = new SqliteDbAdapter(db);
    db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(
      userId,
      'test@test.com',
      'hash'
    );
  });

  afterEach(() => {
    db.close();
  });

  it('saves a generation', async () => {
    const gen = await adapter.images.saveGeneration({
      user_id: userId,
      prompt: 'sunset',
      image_type: 'photo',
    });
    expect(gen.id).toBeDefined();
    expect(gen.prompt).toBe('sunset');
  });

  it('saves a generated image', async () => {
    const gen = await adapter.images.saveGeneration({ user_id: userId, prompt: 'sunset' });
    const img = await adapter.images.saveGeneratedImage({
      generation_id: gen.id,
      platform_id: 'instagram-post',
      platform_name: 'Instagram Post',
      width: 1080,
      height: 1080,
      file_size: 50000,
      storage_path: 'path',
      url: 'http://url',
    });
    expect(img.id).toBeDefined();
    expect(img.platform_id).toBe('instagram-post');
  });
});
```

**Step 2: Implement ImagesRepository**

```javascript
class ImagesRepository {
  constructor(db) {
    this.db = db;
  }

  async saveGeneration(data) {
    const id = uuidv4();
    this.db
      .prepare(
        'INSERT INTO generations (id, user_id, prompt, image_type, status) VALUES (?, ?, ?, ?, ?)'
      )
      .run(id, data.user_id, data.prompt, data.image_type || 'photo', 'completed');
    return this.db.prepare('SELECT * FROM generations WHERE id = ?').get(id);
  }

  async saveGeneratedImage(data) {
    const id = uuidv4();
    this.db
      .prepare(
        `
      INSERT INTO generated_images (id, generation_id, platform_id, platform_name, width, height, file_size, storage_path, url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        id,
        data.generation_id,
        data.platform_id,
        data.platform_name,
        data.width,
        data.height,
        data.file_size,
        data.storage_path,
        data.url
      );
    return this.db.prepare('SELECT * FROM generated_images WHERE id = ?').get(id);
  }
}
```

**Step 3: Run tests, verify pass, commit**

```bash
git add server/providers/local/SqliteDbAdapter.js server/providers/local/SqliteDbAdapter.test.js
git commit -m "feat: add images domain to SQLite DB adapter"
```

---

### Task 10: Supabase DB Adapter

**Files:**

- Create: `server/providers/supabase/SupabaseDbAdapter.js`
- Test: `server/providers/supabase/SupabaseDbAdapter.test.js`

This adapter wraps the existing Supabase query chains inside the same interface. Each method in the projects/analytics/images namespaces calls the existing Supabase chaining patterns currently in ProjectService and AnalyticsService.

**Approach:** Extract the data access code (the `.from().select().eq()` chains) from the existing services into this adapter. The services will then call adapter methods instead.

**Key pattern** -- for each existing service method:

1. Find the Supabase query chain
2. Move it into the corresponding adapter method
3. The adapter returns the same shaped data the service expects

Mock-based tests verify the adapter calls the correct Supabase methods.

**Commit:**

```bash
git commit -m "feat: add Supabase DB adapter wrapping existing query patterns"
```

---

### Task 11: Provider Factory

**Files:**

- Create: `server/providers/index.js`
- Test: `server/providers/index.test.js`

**Step 1: Write failing test**

```javascript
import { describe, it, expect, vi } from 'vitest';
import { createProviders } from './index.js';

describe('createProviders', () => {
  it('returns local providers when DB_PROVIDER=local', () => {
    const providers = createProviders({
      dbProvider: 'local',
      jwtSecret: 'test-secret-at-least-32-chars-long-here',
    });
    expect(providers.db).toBeDefined();
    expect(providers.storage).toBeDefined();
    expect(providers.auth).toBeDefined();
    expect(providers.type).toBe('local');
  });

  it('returns supabase providers when DB_PROVIDER=supabase', () => {
    const mockSupabase = { auth: {}, storage: { from: vi.fn() }, from: vi.fn() };
    const providers = createProviders({ dbProvider: 'supabase', supabaseClient: mockSupabase });
    expect(providers.type).toBe('supabase');
  });

  it('auto-detects supabase when SUPABASE_URL is present', () => {
    const mockSupabase = { auth: {}, storage: { from: vi.fn() }, from: vi.fn() };
    const providers = createProviders({
      supabaseUrl: 'https://x.supabase.co',
      supabaseClient: mockSupabase,
    });
    expect(providers.type).toBe('supabase');
  });

  it('auto-detects local when no SUPABASE_URL', () => {
    const providers = createProviders({ jwtSecret: 'test-secret-at-least-32-chars-long-here' });
    expect(providers.type).toBe('local');
  });

  it('throws when local mode has no JWT_SECRET', () => {
    expect(() => createProviders({ dbProvider: 'local' })).toThrow('JWT_SECRET');
  });
});
```

**Step 2: Implement**

```javascript
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeSchema } from './local/schema.js';
import { SqliteDbAdapter } from './local/SqliteDbAdapter.js';
import { LocalStorageAdapter } from './local/LocalStorageAdapter.js';
import { LocalAuthAdapter } from './local/LocalAuthAdapter.js';
import { SupabaseDbAdapter } from './supabase/SupabaseDbAdapter.js';
import { SupabaseStorageAdapter } from './supabase/SupabaseStorageAdapter.js';
import { SupabaseAuthAdapter } from './supabase/SupabaseAuthAdapter.js';

export function createProviders(config = {}) {
  const dbProvider = config.dbProvider || (config.supabaseUrl ? 'supabase' : 'local');

  if (dbProvider === 'supabase') {
    if (!config.supabaseClient) throw new Error('Supabase client required for supabase provider');
    return {
      type: 'supabase',
      db: new SupabaseDbAdapter(config.supabaseClient),
      storage: new SupabaseStorageAdapter(config.supabaseClient),
      auth: new SupabaseAuthAdapter(config.supabaseClient),
    };
  }

  // Local mode
  if (!config.jwtSecret) throw new Error('JWT_SECRET is required for local mode');

  const dataDir = config.dataDir || path.join(process.cwd(), 'data');
  const storageDir = config.storageDir || path.join(dataDir, 'storage');
  const dbPath = config.dbPath || path.join(dataDir, 'snapasset.db');

  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(storageDir, { recursive: true });

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initializeSchema(db);

  return {
    type: 'local',
    db: new SqliteDbAdapter(db),
    storage: new LocalStorageAdapter(storageDir),
    auth: new LocalAuthAdapter(db, config.jwtSecret),
    _sqlite: db, // For graceful shutdown
  };
}
```

**Step 3: Run tests, verify pass, commit**

```bash
git commit -m "feat: add provider factory with auto-detection"
```

---

### Task 12: Auth Routes (Local Mode)

**Files:**

- Create: `server/routes/auth.js`
- Test: `server/routes/auth.test.js`

**Step 1: Write failing test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createProviders } from '../providers/index.js';
import authRouter from './auth.js';

describe('Auth routes (local)', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    const providers = createProviders({
      dbProvider: 'local',
      jwtSecret: 'test-secret-key-at-least-32-chars-long',
    });
    app.locals.providers = providers;
    app.use('/api/auth', authRouter);
  });

  it('POST /register creates a user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'pass123' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('a@b.com');
  });

  it('POST /login returns token', async () => {
    await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'pass123' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'pass123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('GET /me returns user from token', async () => {
    await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'pass123' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'pass123' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('a@b.com');
  });
});
```

**Step 2: Implement**

```javascript
import express from 'express';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, metadata } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await req.app.locals.providers.auth.register(email, password, metadata);
    res.status(201).json({ user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { token, user } = await req.app.locals.providers.auth.login(email, password);
    res.json({ token, user });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });

    const user = await req.app.locals.providers.auth.verifyToken(authHeader.substring(7));
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
```

**Step 3: Run tests, verify pass, commit**

```bash
git commit -m "feat: add local auth routes (register/login/me)"
```

---

### Task 13: Rewire server/index.js

**Files:**

- Modify: `server/index.js`

**Changes:**

1. Replace Supabase client initialization with `createProviders()`
2. Attach `providers` to `app.locals` (instead of `app.locals.supabase`)
3. Conditionally mount `/api/auth` routes in local mode
4. Serve `/storage` static files in local mode
5. Update health endpoint to show provider type

**Step 1: Write integration test for startup**

Test that the server starts in local mode without Supabase env vars and responds on health endpoint.

**Step 2: Apply the rewire** (exact edits to index.js per the changes above)

**Step 3: Run existing tests + new integration test, commit**

```bash
git commit -m "feat: rewire server startup to use provider factory"
```

---

### Task 14: Rewire Auth Middleware

**Files:**

- Modify: `server/middleware/auth.js`

**Change:** Replace `req.app.locals.supabase.auth.getUser(token)` with `req.app.locals.providers.auth.verifyToken(token)`.

```javascript
export const authMiddleware = async (req, res, next) => {
  try {
    const providers = req.app.locals.providers;
    if (!providers?.auth) {
      return res.status(503).json({ success: false, error: 'Authentication service unavailable' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const user = await providers.auth.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};
```

**Existing tests should still pass with updated mocks. Commit:**

```bash
git commit -m "refactor: rewire auth middleware to use provider abstraction"
```

---

### Task 15: Rewire Services to Use Adapters

**Files:**

- Modify: `server/services/ProjectService.js`
- Modify: `server/services/AnalyticsService.js`
- Modify: `server/services/imageService.js`

**For ProjectService:** Change constructor to take `dbAdapter` instead of `supabaseClient`. Replace all `this.supabase.from(...)` calls with `this.db.projects.*()` calls. Business logic (access control, validation) stays. Only data access moves to adapter.

**For AnalyticsService:** Same pattern. Replace `this.supabase.from(...)` chains with `this.db.analytics.*()` calls. Helper methods (parsePeriod, calculateTrends, etc.) stay in the service.

**For imageService:** Replace module-level Supabase client with injected providers. `uploadToStorage` calls `providers.storage.upload()`. `saveGeneration` calls `providers.db.images.saveGeneration()`.

**Each service change should be verified against existing tests (updated mocks) before committing.**

```bash
git commit -m "refactor: rewire services to use provider adapters"
```

---

### Task 16: Rewire Routes and Middleware

**Files:**

- Modify: `server/routes/projects.js` - Change `req.app.locals.supabase` to `req.app.locals.providers.db`
- Modify: `server/routes/analytics.js` - Same
- Modify: `server/routes/images.js` - Use `req.app.locals.providers.storage`
- Modify: `server/middleware/analytics.js` - Use `req.app.locals.providers.db`
- Modify: `server/workers/imageWorker.js` - Receive providers for db/storage operations

**Pattern for routes/projects.js:**

```javascript
router.use((req, res, next) => {
  req.projectService = new ProjectService(req.app.locals.providers.db);
  next();
});
```

**Pattern for routes/analytics.js:**

```javascript
const analyticsService = new AnalyticsService(req.app.locals.providers.db);
```

**Commit:**

```bash
git commit -m "refactor: rewire routes and middleware to use providers"
```

---

### Task 17: Update .env.example and Documentation

**Files:**

- Modify: `server/.env.example` - Add DB_PROVIDER, JWT_SECRET, LOCAL_STORAGE_PATH docs
- Modify: `docs/plans/2026-02-28-supabase-optional-design.md` - Mark as implemented
- Add quick-start section to README about running in local mode

**Commit:**

```bash
git commit -m "docs: add local mode configuration and setup instructions"
```

---

### Task 18: End-to-End Verification

**Step 1:** Start server in local mode (no Supabase env vars, just JWT_SECRET):

```bash
cd server && JWT_SECRET=my-secret-key-at-least-32-chars-long PORT=3002 node index.js
```

**Step 2:** Register a user, login, create a project, verify it all works:

```bash
# Register
curl -X POST http://localhost:3002/api/auth/register -H 'Content-Type: application/json' -d '{"email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:3002/api/auth/login -H 'Content-Type: application/json' -d '{"email":"test@test.com","password":"test123"}'

# Use token to create project
curl -X POST http://localhost:3002/api/projects -H 'Content-Type: application/json' -H 'Authorization: Bearer <token>' -d '{"name":"My Project"}'
```

**Step 3:** Verify health endpoint shows provider type

**Step 4:** Run full test suite:

```bash
cd server && npx vitest run
```

Expected: All tests pass

**Step 5: Final commit**

```bash
git commit -m "test: add end-to-end verification for local mode"
```
