import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function deriveKey() {
  const secret = process.env.KEY_ENCRYPTION_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('No encryption secret configured (KEY_ENCRYPTION_SECRET or JWT_SECRET)');
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptApiKey(plaintext) {
  if (!plaintext) return null;
  const key = deriveKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptApiKey(stored) {
  if (!stored) return null;
  const parts = stored.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted key format');
  const [ivB64, authTagB64, ciphertextB64] = parts;
  const key = deriveKey();
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const ciphertext = Buffer.from(ciphertextB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext) + decipher.final('utf8');
}

export function maskApiKey(key) {
  if (!key) return null;
  if (key.length <= 8) return '****';
  return key.slice(0, 5) + '...' + key.slice(-4);
}
