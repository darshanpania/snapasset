/**
 * SupabaseDbAdapter Tests
 *
 * Mock-based tests that verify the adapter calls the right Supabase
 * methods with the right arguments and returns data in the expected shape.
 */

import { SupabaseDbAdapter } from './SupabaseDbAdapter.js';

// ---------------------------------------------------------------------------
// Chainable mock builder
// ---------------------------------------------------------------------------

function createChainableMock(resolvedValue = { data: null, error: null, count: 0 }) {
  const chain = {};
  const methods = [
    'from', 'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'gte', 'in', 'or', 'contains',
    'order', 'limit', 'range', 'single',
  ];

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // The terminal awaited value — resolve with the configured data.
  // Supabase client queries are thenable; we make the chain itself thenable.
  chain.then = (resolve) => resolve(resolvedValue);

  return chain;
}

// ---------------------------------------------------------------------------
// projects namespace
// ---------------------------------------------------------------------------

describe('SupabaseDbAdapter', () => {
  describe('projects', () => {
    it('create() inserts into the projects table and returns the first row', async () => {
      const project = { id: 'p1', name: 'My Project' };
      const mock = createChainableMock({ data: [project], error: null });
      const adapter = new SupabaseDbAdapter(mock);

      const result = await adapter.projects.create({ name: 'My Project' });

      expect(mock.from).toHaveBeenCalledWith('projects');
      expect(mock.insert).toHaveBeenCalledWith([{ name: 'My Project' }]);
      expect(mock.select).toHaveBeenCalled();
      expect(result).toEqual(project);
    });

    it('create() throws when Supabase returns an error', async () => {
      const dbError = { message: 'duplicate key', code: '23505' };
      const mock = createChainableMock({ data: null, error: dbError });
      const adapter = new SupabaseDbAdapter(mock);

      await expect(adapter.projects.create({ name: 'dup' })).rejects.toEqual(dbError);
    });

    it('findById() selects with project_images and collaborators joins', async () => {
      const project = { id: 'p1', project_images: [], collaborators: [] };
      const mock = createChainableMock({ data: project, error: null });
      const adapter = new SupabaseDbAdapter(mock);

      const result = await adapter.projects.findById('p1');

      expect(mock.from).toHaveBeenCalledWith('projects');
      expect(mock.select).toHaveBeenCalledWith(
        '*, project_images(*), collaborators:project_collaborators(*)'
      );
      expect(mock.eq).toHaveBeenCalledWith('id', 'p1');
      expect(mock.single).toHaveBeenCalled();
      expect(result).toEqual(project);
    });

    it('findByUser() applies filters, pagination and returns { data, count }', async () => {
      const projects = [{ id: 'p1' }, { id: 'p2' }];
      const mock = createChainableMock({ data: projects, error: null, count: 2 });
      const adapter = new SupabaseDbAdapter(mock);

      const result = await adapter.projects.findByUser(
        'user-1',
        { status: 'active', search: 'logo' },
        { page: 1, limit: 10 }
      );

      expect(mock.from).toHaveBeenCalledWith('projects');
      expect(mock.eq).toHaveBeenCalledWith('owner_id', 'user-1');
      expect(mock.eq).toHaveBeenCalledWith('status', 'active');
      expect(mock.or).toHaveBeenCalledWith(
        'name.ilike.%logo%,description.ilike.%logo%'
      );
      expect(mock.range).toHaveBeenCalledWith(0, 9);
      expect(result).toEqual({ data: projects, count: 2 });
    });

    it('delete() soft-deletes by default (sets status to deleted)', async () => {
      const mock = createChainableMock({ data: null, error: null });
      const adapter = new SupabaseDbAdapter(mock);

      await adapter.projects.delete('p1');

      expect(mock.from).toHaveBeenCalledWith('projects');
      expect(mock.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'deleted' })
      );
      expect(mock.eq).toHaveBeenCalledWith('id', 'p1');
    });

    it('delete(id, false) performs a hard delete', async () => {
      const mock = createChainableMock({ data: null, error: null });
      const adapter = new SupabaseDbAdapter(mock);

      await adapter.projects.delete('p1', false);

      expect(mock.from).toHaveBeenCalledWith('projects');
      expect(mock.delete).toHaveBeenCalled();
      expect(mock.eq).toHaveBeenCalledWith('id', 'p1');
    });

    it('addImages() inserts rows into project_images with correct order', async () => {
      const inserted = [
        { project_id: 'p1', image_id: 'img1', order: 0 },
        { project_id: 'p1', image_id: 'img2', order: 1 },
      ];
      const mock = createChainableMock({ data: inserted, error: null });
      const adapter = new SupabaseDbAdapter(mock);

      const result = await adapter.projects.addImages('p1', ['img1', 'img2']);

      expect(mock.from).toHaveBeenCalledWith('project_images');
      expect(mock.insert).toHaveBeenCalledWith([
        { project_id: 'p1', image_id: 'img1', order: 0 },
        { project_id: 'p1', image_id: 'img2', order: 1 },
      ]);
      expect(result).toEqual(inserted);
    });

    it('removeImages() deletes from project_images by project_id and image_ids', async () => {
      const mock = createChainableMock({ data: null, error: null });
      const adapter = new SupabaseDbAdapter(mock);

      await adapter.projects.removeImages('p1', ['img1', 'img2']);

      expect(mock.from).toHaveBeenCalledWith('project_images');
      expect(mock.delete).toHaveBeenCalled();
      expect(mock.eq).toHaveBeenCalledWith('project_id', 'p1');
      expect(mock.in).toHaveBeenCalledWith('image_id', ['img1', 'img2']);
    });

    it('getCollaborators() selects with user join', async () => {
      const collabs = [{ user_id: 'u1', role: 'editor', users: { id: 'u1', email: 'a@b.c' } }];
      const mock = createChainableMock({ data: collabs, error: null });
      const adapter = new SupabaseDbAdapter(mock);

      const result = await adapter.projects.getCollaborators('p1');

      expect(mock.from).toHaveBeenCalledWith('project_collaborators');
      expect(mock.select).toHaveBeenCalledWith('*, users(id, email, name)');
      expect(mock.eq).toHaveBeenCalledWith('project_id', 'p1');
      expect(result).toEqual(collabs);
    });

    it('removeCollaborator() deletes by project_id and user_id', async () => {
      const mock = createChainableMock({ data: null, error: null });
      const adapter = new SupabaseDbAdapter(mock);

      await adapter.projects.removeCollaborator('p1', 'u1');

      expect(mock.from).toHaveBeenCalledWith('project_collaborators');
      expect(mock.delete).toHaveBeenCalled();
      expect(mock.eq).toHaveBeenCalledWith('project_id', 'p1');
      expect(mock.eq).toHaveBeenCalledWith('user_id', 'u1');
    });

    it('getVersions() returns versions ordered by version_number DESC', async () => {
      const versions = [
        { id: 'v2', version_number: 2 },
        { id: 'v1', version_number: 1 },
      ];
      const mock = createChainableMock({ data: versions, error: null });
      const adapter = new SupabaseDbAdapter(mock);

      const result = await adapter.projects.getVersions('p1');

      expect(mock.from).toHaveBeenCalledWith('project_versions');
      expect(mock.eq).toHaveBeenCalledWith('project_id', 'p1');
      expect(mock.order).toHaveBeenCalledWith('version_number', { ascending: false });
      expect(result).toEqual(versions);
    });
  });

  describe('adaptations', () => {
    it('createProject() inserts into adaptation_projects and returns the row', async () => {
      const project = { id: 'ap1', name: 'Spring Campaign' };
      const mock = createChainableMock({ data: project, error: null });
      const adapter = new SupabaseDbAdapter(mock);

      const result = await adapter.adaptations.createProject({ name: 'Spring Campaign' });

      expect(mock.from).toHaveBeenCalledWith('adaptation_projects');
      expect(mock.insert).toHaveBeenCalledWith([{ name: 'Spring Campaign' }]);
      expect(mock.single).toHaveBeenCalled();
      expect(result).toEqual(project);
    });

    it('getProjectById() selects nested source assets, outputs, and attempts', async () => {
      const project = { id: 'ap1', source_asset: null, requested_outputs: [] };
      const mock = createChainableMock({ data: project, error: null });
      const adapter = new SupabaseDbAdapter(mock);

      const result = await adapter.adaptations.getProjectById('ap1');

      expect(mock.from).toHaveBeenCalledWith('adaptation_projects');
      expect(mock.select).toHaveBeenCalledWith(expect.stringContaining('source_asset:adaptation_source_assets(*)'));
      expect(mock.select).toHaveBeenCalledWith(expect.stringContaining('attempts:adaptation_output_attempts(*)'));
      expect(mock.eq).toHaveBeenCalledWith('id', 'ap1');
      expect(result).toEqual(project);
    });

    it('createOutputAttempt() computes the next attempt number when not provided', async () => {
      const firstQuery = createChainableMock({ data: [{ attempt_number: 2 }], error: null });
      const secondQuery = createChainableMock({ data: { id: 'aoa3', output_id: 'out1', attempt_number: 3 }, error: null });
      const mock = {
        from: vi.fn()
          .mockReturnValueOnce(firstQuery)
          .mockReturnValueOnce(secondQuery),
      };
      const adapter = new SupabaseDbAdapter(mock);

      const result = await adapter.adaptations.createOutputAttempt({ output_id: 'out1', status: 'queued' });

      expect(mock.from).toHaveBeenNthCalledWith(1, 'adaptation_output_attempts');
      expect(mock.from).toHaveBeenNthCalledWith(2, 'adaptation_output_attempts');
      expect(secondQuery.insert).toHaveBeenCalledWith([{ output_id: 'out1', status: 'queued', attempt_number: 3 }]);
      expect(result).toEqual({ id: 'aoa3', output_id: 'out1', attempt_number: 3 });
    });
  });

  // -------------------------------------------------------------------------
  // analytics namespace
  // -------------------------------------------------------------------------

  describe('analytics', () => {
    it('trackEvent() inserts into analytics_events and returns the row', async () => {
      const event = { user_id: 'u1', event_type: 'image_generated', platform: 'instagram' };
      const mock = createChainableMock({ data: [{ id: 'e1', ...event }], error: null });
      const adapter = new SupabaseDbAdapter(mock);

      const result = await adapter.analytics.trackEvent(event);

      expect(mock.from).toHaveBeenCalledWith('analytics_events');
      expect(mock.insert).toHaveBeenCalledWith([event]);
      expect(result).toEqual({ id: 'e1', ...event });
    });

    it('trackEvent() throws on Supabase error', async () => {
      const dbError = { message: 'insert failed' };
      const mock = createChainableMock({ data: null, error: dbError });
      const adapter = new SupabaseDbAdapter(mock);

      await expect(
        adapter.analytics.trackEvent({ event_type: 'test' })
      ).rejects.toEqual(dbError);
    });

    it('getUsageTimeline() queries daily_usage_aggregates with date filter', async () => {
      const timeline = [{ date: '2025-01-01', images_generated: 5 }];
      const mock = createChainableMock({ data: timeline, error: null });
      const adapter = new SupabaseDbAdapter(mock);

      const result = await adapter.analytics.getUsageTimeline('u1', '7d');

      expect(mock.from).toHaveBeenCalledWith('daily_usage_aggregates');
      expect(mock.eq).toHaveBeenCalledWith('user_id', 'u1');
      expect(mock.gte).toHaveBeenCalled();
      expect(mock.order).toHaveBeenCalledWith('date', { ascending: true });
      expect(result).toEqual(timeline);
    });

    it('getPlatformBreakdown() aggregates analytics_events by platform', async () => {
      const events = [
        { platform: 'instagram' },
        { platform: 'instagram' },
        { platform: 'twitter' },
      ];
      const mock = createChainableMock({ data: events, error: null });
      const adapter = new SupabaseDbAdapter(mock);

      const result = await adapter.analytics.getPlatformBreakdown('u1', '30d');

      expect(mock.from).toHaveBeenCalledWith('analytics_events');
      expect(mock.eq).toHaveBeenCalledWith('user_id', 'u1');
      expect(mock.eq).toHaveBeenCalledWith('event_type', 'image_generated');
      expect(result).toEqual([
        { platform: 'instagram', count: 2 },
        { platform: 'twitter', count: 1 },
      ]);
    });

    it('trackCost() upserts into cost_tracking', async () => {
      const costData = { user_id: 'u1', date: '2025-01-01', service_provider: 'openai', total_cost_usd: 0.04 };
      const mock = createChainableMock({ data: [costData], error: null });
      const adapter = new SupabaseDbAdapter(mock);

      const result = await adapter.analytics.trackCost(costData);

      expect(mock.from).toHaveBeenCalledWith('cost_tracking');
      expect(mock.upsert).toHaveBeenCalledWith(
        [costData],
        { onConflict: 'user_id,date,service_provider' }
      );
      expect(result).toEqual(costData);
    });

    it('getPerformanceMetrics() filters by metric_type when provided', async () => {
      const metrics = [{ metric_type: 'api_response', value: 120 }];
      const mock = createChainableMock({ data: metrics, error: null });
      const adapter = new SupabaseDbAdapter(mock);

      const result = await adapter.analytics.getPerformanceMetrics('api_response', 24);

      expect(mock.from).toHaveBeenCalledWith('performance_metrics');
      expect(mock.eq).toHaveBeenCalledWith('metric_type', 'api_response');
      expect(mock.gte).toHaveBeenCalled();
      expect(result).toEqual(metrics);
    });
  });

  // -------------------------------------------------------------------------
  // images namespace
  // -------------------------------------------------------------------------

  describe('images', () => {
    it('saveGeneration() inserts into generations and returns the row', async () => {
      const gen = { id: 'g1', user_id: 'u1', prompt: 'a cat' };
      const mock = createChainableMock({ data: gen, error: null });
      const adapter = new SupabaseDbAdapter(mock);

      const result = await adapter.images.saveGeneration({ user_id: 'u1', prompt: 'a cat' });

      expect(mock.from).toHaveBeenCalledWith('generations');
      expect(mock.insert).toHaveBeenCalledWith([{ user_id: 'u1', prompt: 'a cat' }]);
      expect(mock.single).toHaveBeenCalled();
      expect(result).toEqual(gen);
    });

    it('saveGeneratedImage() inserts into generated_images and returns the row', async () => {
      const img = { id: 'i1', generation_id: 'g1', platform_name: 'Instagram Post' };
      const mock = createChainableMock({ data: img, error: null });
      const adapter = new SupabaseDbAdapter(mock);

      const result = await adapter.images.saveGeneratedImage({
        generation_id: 'g1',
        platform_name: 'Instagram Post',
        width: 1080,
        height: 1080,
      });

      expect(mock.from).toHaveBeenCalledWith('generated_images');
      expect(mock.insert).toHaveBeenCalledWith([
        { generation_id: 'g1', platform_name: 'Instagram Post', width: 1080, height: 1080 },
      ]);
      expect(mock.single).toHaveBeenCalled();
      expect(result).toEqual(img);
    });

    it('saveGeneratedImage() throws on Supabase error', async () => {
      const dbError = { message: 'constraint violation' };
      const mock = createChainableMock({ data: null, error: dbError });
      const adapter = new SupabaseDbAdapter(mock);

      await expect(
        adapter.images.saveGeneratedImage({ generation_id: 'bad' })
      ).rejects.toEqual(dbError);
    });
  });

  // -------------------------------------------------------------------------
  // adapter structure
  // -------------------------------------------------------------------------

  describe('adapter structure', () => {
    it('exposes projects, analytics, and images namespaces', () => {
      const mock = createChainableMock();
      const adapter = new SupabaseDbAdapter(mock);

      expect(adapter.projects).toBeDefined();
      expect(adapter.analytics).toBeDefined();
      expect(adapter.images).toBeDefined();
    });
  });
});
