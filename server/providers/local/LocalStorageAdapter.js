import fs from 'fs';
import path from 'path';

export class LocalStorageAdapter {
  constructor(basePath) {
    this.basePath = basePath;
  }

  async upload(bucket, filePath, buffer, options = {}) {
    const fullPath = path.join(this.basePath, bucket, filePath);
    const dir = path.dirname(fullPath);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, buffer);

    return {
      path: filePath,
      url: `/storage/${bucket}/${filePath}`,
    };
  }

  getPublicUrl(bucket, filePath) {
    return `/storage/${bucket}/${filePath}`;
  }

  async delete(bucket, filePath) {
    const fullPath = path.join(this.basePath, bucket, filePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}
