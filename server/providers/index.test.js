import fs from 'fs';
import path from 'path';
import { createProviders } from './index.js';

describe('createProviders', () => {
  const tempDirs = [];

  function makeTempDir() {
    const dir = path.join('/tmp', 'snapasset-test-' + Date.now() + '-' + Math.random().toString(36).slice(2));
    tempDirs.push(dir);
    return dir;
  }

  afterAll(() => {
    for (const dir of tempDirs) {
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
    }
  });

  it('returns local providers when dbProvider=local', () => {
    const dataDir = makeTempDir();
    const providers = createProviders({
      dbProvider: 'local',
      jwtSecret: 'test-secret-key-at-least-32-chars-long',
      dataDir,
    });
    expect(providers.db).toBeDefined();
    expect(providers.storage).toBeDefined();
    expect(providers.auth).toBeDefined();
    expect(providers.type).toBe('local');
    expect(providers._sqlite).toBeDefined();
    providers._sqlite.close();
  });

  it('returns supabase providers when dbProvider=supabase', () => {
    const mockSupabase = { auth: {}, storage: { from: vi.fn() }, from: vi.fn() };
    const providers = createProviders({ dbProvider: 'supabase', supabaseClient: mockSupabase });
    expect(providers.type).toBe('supabase');
    expect(providers.db).toBeDefined();
    expect(providers.storage).toBeDefined();
    expect(providers.auth).toBeDefined();
  });

  it('auto-detects supabase when supabaseUrl is present', () => {
    const mockSupabase = { auth: {}, storage: { from: vi.fn() }, from: vi.fn() };
    const providers = createProviders({ supabaseUrl: 'https://x.supabase.co', supabaseClient: mockSupabase });
    expect(providers.type).toBe('supabase');
  });

  it('auto-detects local when no supabaseUrl', () => {
    const dataDir = makeTempDir();
    const providers = createProviders({
      jwtSecret: 'test-secret-key-at-least-32-chars-long',
      dataDir,
    });
    expect(providers.type).toBe('local');
    providers._sqlite.close();
  });

  it('throws when supabase mode has no supabaseClient', () => {
    expect(() => createProviders({ dbProvider: 'supabase' })).toThrow('Supabase client required');
  });

  it('throws when local mode has no JWT_SECRET', () => {
    expect(() => createProviders({ dbProvider: 'local' })).toThrow('JWT_SECRET');
  });

  it('creates data and storage directories for local mode', () => {
    const dataDir = makeTempDir();
    const providers = createProviders({
      dbProvider: 'local',
      jwtSecret: 'test-secret-key-at-least-32-chars-long',
      dataDir,
    });
    expect(fs.existsSync(dataDir)).toBe(true);
    expect(fs.existsSync(path.join(dataDir, 'storage'))).toBe(true);
    expect(fs.existsSync(path.join(dataDir, 'snapasset.db'))).toBe(true);
    providers._sqlite.close();
  });

  it('uses custom dbPath when provided', () => {
    const dataDir = makeTempDir();
    const customDbPath = path.join(dataDir, 'custom.db');
    const providers = createProviders({
      dbProvider: 'local',
      jwtSecret: 'test-secret-key-at-least-32-chars-long',
      dataDir,
      dbPath: customDbPath,
    });
    expect(fs.existsSync(customDbPath)).toBe(true);
    providers._sqlite.close();
  });
});
