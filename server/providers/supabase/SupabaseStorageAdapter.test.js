import SupabaseStorageAdapter from './SupabaseStorageAdapter.js'

describe('SupabaseStorageAdapter', () => {
  let adapter
  let mockSupabaseClient

  beforeEach(() => {
    mockSupabaseClient = {
      storage: {
        from: vi.fn(),
      },
    }
    adapter = new SupabaseStorageAdapter(mockSupabaseClient)
  })

  describe('upload', () => {
    it('calls supabase storage upload and returns path and url', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'images/test.png' },
        error: null,
      })
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.supabase.co/bucket/images/test.png' },
      })

      mockSupabaseClient.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })

      const buffer = Buffer.from('fake-image-data')
      const result = await adapter.upload('my-bucket', 'images/test.png', buffer, {
        contentType: 'image/jpeg',
        cacheControl: '7200',
      })

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('my-bucket')
      expect(mockUpload).toHaveBeenCalledWith('images/test.png', buffer, {
        contentType: 'image/jpeg',
        cacheControl: '7200',
        upsert: true,
      })
      expect(mockGetPublicUrl).toHaveBeenCalledWith('images/test.png')
      expect(result).toEqual({
        path: 'images/test.png',
        url: 'https://storage.supabase.co/bucket/images/test.png',
      })
    })

    it('uses default contentType and cacheControl when options not provided', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: { path: 'images/default.png' },
        error: null,
      })
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.supabase.co/bucket/images/default.png' },
      })

      mockSupabaseClient.storage.from.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })

      const buffer = Buffer.from('fake-image-data')
      await adapter.upload('my-bucket', 'images/default.png', buffer)

      expect(mockUpload).toHaveBeenCalledWith('images/default.png', buffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true,
      })
    })

    it('throws when supabase upload returns an error', async () => {
      const mockUpload = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      })

      mockSupabaseClient.storage.from.mockReturnValue({
        upload: mockUpload,
      })

      const buffer = Buffer.from('fake-image-data')
      await expect(adapter.upload('my-bucket', 'images/test.png', buffer))
        .rejects.toThrow('Upload failed')
    })
  })

  describe('getPublicUrl', () => {
    it('returns supabase public URL string', () => {
      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.supabase.co/bucket/images/photo.png' },
      })

      mockSupabaseClient.storage.from.mockReturnValue({
        getPublicUrl: mockGetPublicUrl,
      })

      const url = adapter.getPublicUrl('my-bucket', 'images/photo.png')

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('my-bucket')
      expect(mockGetPublicUrl).toHaveBeenCalledWith('images/photo.png')
      expect(url).toBe('https://storage.supabase.co/bucket/images/photo.png')
    })
  })

  describe('delete', () => {
    it('calls supabase storage remove with file path array', async () => {
      const mockRemove = vi.fn().mockResolvedValue({
        data: {},
        error: null,
      })

      mockSupabaseClient.storage.from.mockReturnValue({
        remove: mockRemove,
      })

      await adapter.delete('my-bucket', 'images/old.png')

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('my-bucket')
      expect(mockRemove).toHaveBeenCalledWith(['images/old.png'])
    })

    it('throws when supabase remove returns an error', async () => {
      const mockRemove = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' },
      })

      mockSupabaseClient.storage.from.mockReturnValue({
        remove: mockRemove,
      })

      await expect(adapter.delete('my-bucket', 'images/old.png'))
        .rejects.toThrow('Delete failed')
    })
  })
})
