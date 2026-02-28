const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

export class OAuthStateStore {
  constructor(ttlMs = DEFAULT_TTL_MS) {
    this.store = new Map();
    this.ttlMs = ttlMs;
    this._cleanupInterval = setInterval(() => this._cleanup(), 60_000);
  }

  set(state, data) {
    this.store.set(state, { ...data, expiresAt: Date.now() + this.ttlMs });
  }

  consume(state) {
    const record = this.store.get(state);
    if (!record) return null;
    this.store.delete(state);
    if (record.expiresAt < Date.now()) return null;
    return record;
  }

  _cleanup() {
    const now = Date.now();
    for (const [key, val] of this.store) {
      if (val.expiresAt < now) this.store.delete(key);
    }
  }

  destroy() {
    clearInterval(this._cleanupInterval);
    this.store.clear();
  }
}
