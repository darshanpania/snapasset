import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const BCRYPT_ROUNDS = 12;
const TOKEN_EXPIRY = '24h';

export class LocalAuthAdapter {
  /**
   * @param {import('better-sqlite3').Database} db - better-sqlite3 database instance
   * @param {string} jwtSecret - secret key for signing JWTs
   */
  constructor(db, jwtSecret) {
    this.db = db;
    this.jwtSecret = jwtSecret;
  }

  /**
   * Register a new user.
   * @param {string} email
   * @param {string} password
   * @param {object} metadata - optional fields like display_name, avatar_url
   * @returns {Promise<object>} user object without password_hash
   */
  async register(email, password, metadata = {}) {
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const now = new Date().toISOString();
    const metadataJson = JSON.stringify(metadata);

    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, password_hash, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    try {
      stmt.run(id, email, passwordHash, metadataJson, now, now);
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        throw new Error(`User with email "${email}" already exists`);
      }
      throw err;
    }

    return this._sanitizeUser({
      id,
      email,
      metadata: metadataJson,
      created_at: now,
      updated_at: now,
    });
  }

  /**
   * Log in a user with email and password.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ token: string, user: object }>}
   */
  async login(email, password) {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!row) {
      throw new Error('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign({ sub: row.id, email: row.email }, this.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: TOKEN_EXPIRY,
    });

    return {
      token,
      user: this._sanitizeUser(row),
    };
  }

  /**
   * Verify a JWT token and return the associated user.
   * @param {string} token
   * @returns {Promise<object>} user object without password_hash
   */
  async verifyToken(token) {
    const decoded = jwt.verify(token, this.jwtSecret);

    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.sub);
    if (!row) {
      throw new Error('User not found');
    }

    return this._sanitizeUser(row);
  }

  /**
   * Remove password_hash from a user object.
   * @param {object} user
   * @returns {object}
   */
  _sanitizeUser(user) {
    const { password_hash, metadata, ...sanitized } = user;
    const parsed = typeof metadata === 'string' ? JSON.parse(metadata) : metadata || {};
    return {
      ...sanitized,
      ...parsed,
      metadata: parsed,
    };
  }
}
