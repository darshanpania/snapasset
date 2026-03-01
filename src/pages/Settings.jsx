import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Settings.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function Settings() {
  const { user, signOut, isLocalMode } = useAuth();
  const navigate = useNavigate();
  const [apiKeyStatus, setApiKeyStatus] = useState({
    hasKey: false,
    source: null,
    maskedKey: null,
  });
  const [newKey, setNewKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [config, setConfig] = useState({ hasServerApiKey: false, chatgptAuthEnabled: false });
  const [connecting, setConnecting] = useState(false);

  const getToken = () => localStorage.getItem('snapasset_token');

  const authFetch = async (path, options = {}) => {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    return res.json();
  };

  useEffect(() => {
    loadApiKeyStatus();
    loadConfig();

    // Handle ChatGPT OAuth callback results
    const params = new URLSearchParams(window.location.search);
    if (params.get('chatgpt_linked') === '1') {
      setSuccess('ChatGPT subscription connected! Your API key has been provisioned.');
      loadApiKeyStatus();
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('chatgpt_error')) {
      const errCode = params.get('chatgpt_error');
      const messages = {
        no_api_key: 'Could not provision an API key from your ChatGPT subscription.',
        needs_platform_setup:
          'Your OpenAI account needs API platform setup. Visit platform.openai.com to complete onboarding, then try again.',
        invalid_state: 'Session expired. Please try again.',
        missing_code: 'Authorization was not completed.',
        callback_failed: 'Something went wrong. Please try again.',
      };
      setError(messages[errCode] || 'Failed to connect ChatGPT subscription. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const loadApiKeyStatus = async () => {
    try {
      const data = await authFetch('/api/settings/api-key');
      setApiKeyStatus(data);
    } catch (err) {
      console.error('Failed to load API key status:', err);
    }
  };

  const loadConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/api/config`);
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  };

  const handleSaveKey = async () => {
    if (!newKey.trim()) return;
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const data = await authFetch('/api/settings/api-key', {
        method: 'PUT',
        body: JSON.stringify({ apiKey: newKey.trim() }),
      });
      if (data.error) throw new Error(data.error);
      setApiKeyStatus({ hasKey: true, source: data.source, maskedKey: data.maskedKey });
      setNewKey('');
      setSuccess('API key saved successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKey = async () => {
    setError(null);
    setSuccess(null);
    try {
      const data = await authFetch('/api/settings/api-key', { method: 'DELETE' });
      if (data.error) throw new Error(data.error);
      setApiKeyStatus({ hasKey: false, source: null, maskedKey: null });
      setSuccess('API key removed');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConnectChatGPT = async () => {
    setError(null);
    setConnecting(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/chatgpt/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userToken: getToken() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      window.location.href = data.authorizationUrl;
    } catch (err) {
      setError(err.message);
      setConnecting(false);
    }
  };

  const getSourceBadge = () => {
    if (!apiKeyStatus.hasKey) {
      return config.hasServerApiKey ? (
        <span className="badge badge-default">Server Default</span>
      ) : (
        <span className="badge badge-warning">Not Configured</span>
      );
    }
    if (apiKeyStatus.source === 'chatgpt')
      return <span className="badge badge-chatgpt">ChatGPT</span>;
    return <span className="badge badge-manual">Manual</span>;
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <button onClick={() => navigate('/')} className="back-button">
            Back to Home
          </button>
          <h1>Settings</h1>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <section className="settings-section">
          <h2>OpenAI API Key</h2>
          <p className="section-desc">
            Your API key is used for image generation. It's encrypted at rest and never shared.
          </p>

          <div className="key-status">
            <div className="key-status-row">
              <span className="label">Status:</span>
              {getSourceBadge()}
            </div>
            {apiKeyStatus.maskedKey && (
              <div className="key-status-row">
                <span className="label">Key:</span>
                <code className="masked-key">{apiKeyStatus.maskedKey}</code>
              </div>
            )}
          </div>

          <div className="key-input-group">
            <input
              type="password"
              placeholder="sk-..."
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="key-input"
            />
            <button
              onClick={handleSaveKey}
              disabled={saving || !newKey.trim()}
              className="btn-primary"
            >
              {saving ? 'Saving...' : apiKeyStatus.hasKey ? 'Update Key' : 'Save Key'}
            </button>
          </div>

          {apiKeyStatus.hasKey && (
            <button onClick={handleDeleteKey} className="btn-danger">
              Remove Key
            </button>
          )}

          {!apiKeyStatus.hasKey && config.hasServerApiKey && (
            <p className="hint">
              A server-wide API key is configured. You can use it without setting your own key.
            </p>
          )}

          {config.chatgptAuthEnabled && (
            <>
              <div className="key-divider">
                <span>or</span>
              </div>
              <button
                onClick={handleConnectChatGPT}
                disabled={connecting}
                className="btn-chatgpt-connect"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"
                    fill="#10a37f"
                  />
                </svg>
                {connecting ? 'Connecting...' : 'Connect ChatGPT Subscription'}
              </button>
              <p className="hint">
                Use your ChatGPT Plus/Pro subscription to automatically provision an API key.
              </p>
            </>
          )}
        </section>

        <section className="settings-section">
          <h2>Account</h2>
          <div className="account-info">
            <div className="account-row">
              <span className="label">Email:</span>
              <span>{user?.email || 'Not signed in'}</span>
            </div>
            <div className="account-row">
              <span className="label">Mode:</span>
              <span>{isLocalMode ? 'Local' : 'Supabase'}</span>
            </div>
          </div>
          <button
            onClick={() => {
              signOut();
              navigate('/auth/login');
            }}
            className="btn-logout-settings"
          >
            Sign Out
          </button>
        </section>
      </div>
    </div>
  );
}

export default Settings;
