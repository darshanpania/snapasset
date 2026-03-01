/**
 * Thin wrapper around Supabase auth that exposes a verifyToken interface
 * matching the same contract as LocalAuthAdapter.
 */
export default class SupabaseAuthAdapter {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async verifyToken(token) {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new Error('Invalid token');
    }

    return data.user;
  }
}
