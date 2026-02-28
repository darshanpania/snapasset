// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { LocalStorageAdapter } from './LocalStorageAdapter.js';

describe('LocalStorageAdapter', () => {
  let adapter;
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapasset-test-'));
    adapter = new LocalStorageAdapter(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('upload', () => {
    it('creates file on disk and returns URL', async () => {
      const bucket = 'images';
      const filePath = 'photo.png';
      const buffer = Buffer.from('fake-image-data');

      const result = await adapter.upload(bucket, filePath, buffer);

      // File should exist on disk
      const fullPath = path.join(tmpDir, bucket, filePath);
      expect(fs.existsSync(fullPath)).toBe(true);
      expect(fs.readFileSync(fullPath)).toEqual(buffer);

      // Result should contain path and URL
      expect(result).toEqual({
        path: filePath,
        url: `/storage/${bucket}/${filePath}`,
      });
    });

    it('creates nested directories automatically', async () => {
      const bucket = 'assets';
      const filePath = 'users/123/avatars/profile.jpg';
      const buffer = Buffer.from('avatar-data');

      const result = await adapter.upload(bucket, filePath, buffer);

      const fullPath = path.join(tmpDir, bucket, filePath);
      expect(fs.existsSync(fullPath)).toBe(true);
      expect(fs.readFileSync(fullPath)).toEqual(buffer);

      expect(result).toEqual({
        path: filePath,
        url: `/storage/${bucket}/${filePath}`,
      });
    });

    it('accepts options without error', async () => {
      const bucket = 'images';
      const filePath = 'test.png';
      const buffer = Buffer.from('data');

      const result = await adapter.upload(bucket, filePath, buffer, {
        contentType: 'image/png',
      });

      expect(result.path).toBe(filePath);
      expect(result.url).toBe(`/storage/${bucket}/${filePath}`);
    });
  });

  describe('getPublicUrl', () => {
    it('returns correct path', () => {
      const url = adapter.getPublicUrl('images', 'photo.png');
      expect(url).toBe('/storage/images/photo.png');
    });

    it('handles nested file paths', () => {
      const url = adapter.getPublicUrl('assets', 'users/123/avatar.jpg');
      expect(url).toBe('/storage/assets/users/123/avatar.jpg');
    });
  });

  describe('delete', () => {
    it('removes file from disk', async () => {
      const bucket = 'images';
      const filePath = 'to-delete.png';
      const buffer = Buffer.from('delete-me');

      // First upload a file
      await adapter.upload(bucket, filePath, buffer);
      const fullPath = path.join(tmpDir, bucket, filePath);
      expect(fs.existsSync(fullPath)).toBe(true);

      // Then delete it
      await adapter.delete(bucket, filePath);
      expect(fs.existsSync(fullPath)).toBe(false);
    });

    it('does not throw if file does not exist', async () => {
      await expect(
        adapter.delete('images', 'nonexistent.png')
      ).resolves.not.toThrow();
    });
  });
});
