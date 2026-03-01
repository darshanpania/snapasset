import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isLocalMode } from '../services/supabase';

const AuthContext = createContext({});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper for local API calls
const localApi = async (path, options = {}) => {
  const token = localStorage.getItem('snapasset_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLocalMode) {
      // Local mode: check for token from URL (ChatGPT OAuth callback) or localStorage
      const initLocal = async () => {
        try {
          // Check for token in URL (from ChatGPT OAuth redirect)
          const urlParams = new URLSearchParams(window.location.search);
          const urlToken = urlParams.get('token');
          if (urlToken) {
            localStorage.setItem('snapasset_token', urlToken);
            // Clean the URL
            window.history.replaceState({}, '', window.location.pathname);
          }

          const token = localStorage.getItem('snapasset_token');
          if (token) {
            const data = await localApi('/api/auth/me');
            setUser(data.user);
            setSession({ access_token: token });
          }
        } catch (err) {
          console.error('Local session error:', err);
          localStorage.removeItem('snapasset_token');
        } finally {
          setLoading(false);
        }
      };
      initLocal();
    } else {
      // Supabase mode: get initial session
      const initSession = async () => {
        try {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();
          if (error) throw error;
          setSession(session);
          setUser(session?.user ?? null);
        } catch (error) {
          console.error('Error getting session:', error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };

      initSession();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setError(null);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const signUp = async (email, password, metadata = {}) => {
    try {
      setLoading(true);
      setError(null);

      if (isLocalMode) {
        const data = await localApi('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        // Auto sign-in after registration
        const loginData = await localApi('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem('snapasset_token', loginData.token);
        setUser(loginData.user || data.user);
        setSession({ access_token: loginData.token });
        return { data: loginData, error: null };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      setError(error.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      if (isLocalMode) {
        const data = await localApi('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem('snapasset_token', data.token);
        setUser(data.user);
        setSession({ access_token: data.token });
        return { data, error: null };
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithMagicLink = async (email) => {
    if (isLocalMode) {
      setError('Magic link is not available in local mode. Use email/password.');
      return { data: null, error: new Error('Not available in local mode') };
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      setError(error.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider) => {
    if (isLocalMode) {
      setError('OAuth is not available in local mode. Use email/password.');
      return { data: null, error: new Error('Not available in local mode') };
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      setError(error.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isLocalMode) {
        localStorage.removeItem('snapasset_token');
      } else {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }

      setUser(null);
      setSession(null);
      return { error: null };
    } catch (error) {
      setError(error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (isLocalMode) {
      setError('Profile updates not available in local mode');
      return { data: null, error: new Error('Not available in local mode') };
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.auth.updateUser({ data: updates });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      setError(error.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    if (isLocalMode) {
      setError('Password reset not available in local mode');
      return { data: null, error: new Error('Not available in local mode') };
    }
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      setError(error.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    isLocalMode,
    signUp,
    signIn,
    signInWithMagicLink,
    signInWithProvider,
    signOut,
    updateProfile,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
