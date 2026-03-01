/**
 * SupabaseStorageAdapter - wraps Supabase storage behind a consistent interface.
 */
export default class SupabaseStorageAdapter {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async upload(bucket, filePath, buffer, options = {}) {
    const { data, error } = await this.supabase.storage.from(bucket).upload(filePath, buffer, {
      contentType: options.contentType || 'image/png',
      cacheControl: options.cacheControl || '3600',
      upsert: true,
    });

    if (error) {
      throw new Error(error.message);
    }

    const url = this.getPublicUrl(bucket, filePath);

    return { path: data.path, url };
  }

  getPublicUrl(bucket, filePath) {
    const { data } = this.supabase.storage.from(bucket).getPublicUrl(filePath);

    return data.publicUrl;
  }

  async delete(bucket, filePath) {
    const { error } = await this.supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      throw new Error(error.message);
    }
  }
}
