import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import { LocalAuthAdapter } from './LocalAuthAdapter.js';
import { initializeSchema as initSchema } from './schema.js';

const JWT_SECRET = 'test-secret-key-for-testing';

describe('LocalAuthAdapter', () => {
  let db;
  let adapter;

  beforeEach(() => {
    db = new Database(':memory:');
    initSchema(db);
    adapter = new LocalAuthAdapter(db, JWT_SECRET);
  });

  afterEach(() => {
    db.close();
  });

  describe('register', () => {
    it('creates a user and returns user object without password_hash', async () => {
      const user = await adapter.register('alice@example.com', 'securePassword1!', {
        display_name: 'Alice',
      });

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe('alice@example.com');
      expect(user.display_name).toBe('Alice');
      expect(user.created_at).toBeDefined();
      expect(user.updated_at).toBeDefined();
      // Must NOT contain password_hash
      expect(user.password_hash).toBeUndefined();
      expect(user).not.toHaveProperty('password_hash');

      // Verify user is persisted in the database
      const row = db.prepare('SELECT * FROM users WHERE email = ?').get('alice@example.com');
      expect(row).toBeDefined();
      expect(row.password_hash).toBeDefined();
      expect(row.password_hash).not.toBe('securePassword1!'); // should be hashed
    });

    it('rejects duplicate emails', async () => {
      await adapter.register('dup@example.com', 'password1');
      await expect(adapter.register('dup@example.com', 'password2')).rejects.toThrow();
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await adapter.register('bob@example.com', 'correctPassword', {
        display_name: 'Bob',
      });
    });

    it('returns a JWT token and user on valid credentials', async () => {
      const result = await adapter.login('bob@example.com', 'correctPassword');

      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('bob@example.com');
      expect(result.user.display_name).toBe('Bob');
      expect(result.user).not.toHaveProperty('password_hash');

      // Verify token structure
      const decoded = jwt.verify(result.token, JWT_SECRET);
      expect(decoded.sub).toBe(result.user.id);
      expect(decoded.email).toBe('bob@example.com');
      expect(decoded.exp).toBeDefined();
    });

    it('rejects invalid password', async () => {
      await expect(adapter.login('bob@example.com', 'wrongPassword')).rejects.toThrow(
        /invalid/i
      );
    });

    it('rejects unknown email', async () => {
      await expect(adapter.login('unknown@example.com', 'anyPassword')).rejects.toThrow(
        /invalid/i
      );
    });
  });

  describe('verifyToken', () => {
    let registeredUser;
    let token;

    beforeEach(async () => {
      registeredUser = await adapter.register('carol@example.com', 'tokenTest1!', {
        display_name: 'Carol',
      });
      const loginResult = await adapter.login('carol@example.com', 'tokenTest1!');
      token = loginResult.token;
    });

    it('returns user from a valid token', async () => {
      const user = await adapter.verifyToken(token);

      expect(user).toBeDefined();
      expect(user.id).toBe(registeredUser.id);
      expect(user.email).toBe('carol@example.com');
      expect(user.display_name).toBe('Carol');
      expect(user).not.toHaveProperty('password_hash');
    });

    it('rejects an invalid token', async () => {
      await expect(adapter.verifyToken('not-a-valid-token')).rejects.toThrow();
    });
  });
});
