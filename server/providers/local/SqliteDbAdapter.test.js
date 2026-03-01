// @vitest-environment node
import Database from 'better-sqlite3';
import { initializeSchema } from './schema.js';
import { SqliteDbAdapter } from './SqliteDbAdapter.js';

describe('SqliteDbAdapter - projects', () => {
  let db, adapter;
  const userId = 'user-1';

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
    adapter = new SqliteDbAdapter(db);
    db.prepare(
      'INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, 'test@test.com', 'hash', new Date().toISOString(), new Date().toISOString());
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

  it('findByUser filters by status', async () => {
    await adapter.projects.create({ name: 'Active', owner_id: userId, status: 'active' });
    await adapter.projects.create({ name: 'Archived', owner_id: userId, status: 'archived' });

    const result = await adapter.projects.findByUser(
      userId,
      { status: 'active' },
      { page: 1, limit: 10 }
    );
    expect(result.data.length).toBe(1);
    expect(result.data[0].name).toBe('Active');
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
    db.prepare(
      'INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(user2, 'u2@test.com', 'hash', new Date().toISOString(), new Date().toISOString());

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

describe('SqliteDbAdapter - analytics', () => {
  let db, adapter;
  const userId = 'user-1';

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
    adapter = new SqliteDbAdapter(db);
    db.prepare(
      'INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, 'test@test.com', 'hash', new Date().toISOString(), new Date().toISOString());
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
    expect(events[0].event_type).toBe('image_generated');
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
    expect(rows[0].value).toBe(42);
  });

  it('gets dashboard data without errors', async () => {
    const dashboard = await adapter.analytics.getDashboard(userId, '30d');
    expect(dashboard).toBeDefined();
    expect(dashboard.overview).toBeDefined();
  });

  it('gets usage timeline', async () => {
    const timeline = await adapter.analytics.getUsageTimeline(userId, '30d');
    expect(Array.isArray(timeline)).toBe(true);
  });

  it('gets platform breakdown', async () => {
    await adapter.analytics.trackEvent({
      user_id: userId,
      event_type: 'image_generated',
      platform: 'instagram',
    });
    await adapter.analytics.trackEvent({
      user_id: userId,
      event_type: 'image_generated',
      platform: 'instagram',
    });
    await adapter.analytics.trackEvent({
      user_id: userId,
      event_type: 'image_generated',
      platform: 'twitter',
    });

    const breakdown = await adapter.analytics.getPlatformBreakdown(userId, '30d');
    expect(breakdown[0].platform).toBe('instagram');
    expect(breakdown[0].count).toBe(2);
  });

  it('gets admin dashboard', async () => {
    const dashboard = await adapter.analytics.getAdminDashboard('30d');
    expect(dashboard.overview).toBeDefined();
    expect(dashboard.overview.totalUsers).toBeGreaterThanOrEqual(1);
  });
});

describe('SqliteDbAdapter - images', () => {
  let db, adapter;
  const userId = 'user-1';

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
    adapter = new SqliteDbAdapter(db);
    db.prepare(
      'INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, 'test@test.com', 'hash', new Date().toISOString(), new Date().toISOString());
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
    expect(gen.status).toBe('completed');
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
    expect(img.width).toBe(1080);
  });
});

describe('SqliteDbAdapter - users', () => {
  let db, adapter;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
    adapter = new SqliteDbAdapter(db);
  });

  afterEach(() => {
    db.close();
  });

  it('creates and finds a user by email', async () => {
    await adapter.users.create('a@b.com', 'hash123', { name: 'Alice' });
    const user = await adapter.users.findByEmail('a@b.com');
    expect(user).toBeDefined();
    expect(user.email).toBe('a@b.com');
  });

  it('finds a user by id', async () => {
    const created = await adapter.users.create('b@c.com', 'hash456');
    const user = await adapter.users.findById(created.id);
    expect(user).toBeDefined();
    expect(user.email).toBe('b@c.com');
  });
});
