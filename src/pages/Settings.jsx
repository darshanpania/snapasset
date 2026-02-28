import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Settings.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function Settings() {
  const { user, signOut, isLocalMode } = useAuth()
  const navigate = useNavigate()
  const [apiKeyStatus, setApiKeyStatus] = useState({ hasKey: false, source: null, maskedKey: null })
  const [newKey, setNewKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [config, setConfig] = useState({ hasServerApiKey: false, chatgptAuthEnabled: false })

  const getToken = () => localStorage.getItem('snapasset_token')

  const authFetch = async (path, options = {}) => {
    const token = getToken()
    const headers = { 'Content-Type': 'application/json', ...options.headers }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${API_URL}${path}`, { ...options, headers })
    return res.json()
  }

  useEffect(() => {
    loadApiKeyStatus()
    loadConfig()
  }, [])

  const loadApiKeyStatus = async () => {
    try {
      const data = await authFetch('/api/settings/api-key')
      setApiKeyStatus(data)
    } catch (err) {
      console.error('Failed to load API key status:', err)
    }
  }

  const loadConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/api/config`)
      const data = await res.json()
      setConfig(data)
    } catch (err) {
      console.error('Failed to load config:', err)
    }
  }

  const handleSaveKey = async () => {
    if (!newKey.trim()) return
    setError(null)
    setSuccess(null)
    setSaving(true)
    try {
      const data = await authFetch('/api/settings/api-key', {
        method: 'PUT',
        body: JSON.stringify({ apiKey: newKey.trim() }),
      })
      if (data.error) throw new Error(data.error)
      setApiKeyStatus({ hasKey: true, source: data.source, maskedKey: data.maskedKey })
      setNewKey('')
      setSuccess('API key saved successfully')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteKey = async () => {
    setError(null)
    setSuccess(null)
    try {
      const data = await authFetch('/api/settings/api-key', { method: 'DELETE' })
      if (data.error) throw new Error(data.error)
      setApiKeyStatus({ hasKey: false, source: null, maskedKey: null })
      setSuccess('API key removed')
    } catch (err) {
      setError(err.message)
    }
  }

  const getSourceBadge = () => {
    if (!apiKeyStatus.hasKey) {
      return config.hasServerApiKey
        ? <span className="badge badge-default">Server Default</span>
        : <span className="badge badge-warning">Not Configured</span>
    }
    if (apiKeyStatus.source === 'chatgpt') return <span className="badge badge-chatgpt">ChatGPT</span>
    return <span className="badge badge-manual">Manual</span>
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <button onClick={() => navigate('/')} className="back-button">Back to Home</button>
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
          <button onClick={() => { signOut(); navigate('/auth/login') }} className="btn-logout-settings">
            Sign Out
          </button>
        </section>
      </div>
    </div>
  )
}

export default Settings
