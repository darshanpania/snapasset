import fs from 'fs';
import path from 'path';

export class LocalStorageAdapter {
  constructor(basePath) {
    this.basePath = path.resolve(basePath);
  }

  _safePath(bucket, filePath) {
    const resolved = path.resolve(this.basePath, bucket, filePath);
    if (!resolved.startsWith(this.basePath + path.sep) && resolved !== this.basePath) {
      throw new Error('Path traversal detected');
    }
    return resolved;
  }

  async upload(bucket, filePath, buffer, options = {}) {
    const fullPath = this._safePath(bucket, filePath);
    const dir = path.dirname(fullPath);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, buffer);

    return {
      path: filePath,
      url: `/storage/${encodeURIComponent(bucket)}/${filePath.split('/').map(encodeURIComponent).join('/')}`,
    };
  }

  getPublicUrl(bucket, filePath) {
    return `/storage/${encodeURIComponent(bucket)}/${filePath.split('/').map(encodeURIComponent).join('/')}`;
  }

  async delete(bucket, filePath) {
    const fullPath = this._safePath(bucket, filePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}
