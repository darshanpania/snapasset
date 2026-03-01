import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { initializeSchema } from './local/schema.js';
import { SqliteDbAdapter } from './local/SqliteDbAdapter.js';
import { LocalStorageAdapter } from './local/LocalStorageAdapter.js';
import { LocalAuthAdapter } from './local/LocalAuthAdapter.js';
import { SupabaseDbAdapter } from './supabase/SupabaseDbAdapter.js';
import SupabaseStorageAdapter from './supabase/SupabaseStorageAdapter.js';
import SupabaseAuthAdapter from './supabase/SupabaseAuthAdapter.js';

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
