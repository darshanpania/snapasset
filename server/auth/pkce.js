import crypto from 'crypto';

function toBase64Url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generateCodeVerifier() {
  return toBase64Url(crypto.randomBytes(64));
}

export function createCodeChallenge(codeVerifier) {
  return toBase64Url(crypto.createHash('sha256').update(codeVerifier).digest());
}

export function generatePkcePair() {
  const codeVerifier = generateCodeVerifier();
  return { codeVerifier, codeChallenge: createCodeChallenge(codeVerifier) };
}

export function generateState() {
  return toBase64Url(crypto.randomBytes(32));
}
