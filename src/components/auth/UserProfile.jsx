import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import './UserProfile.css'

const UserProfile = () => {
  const { user, updateProfile, signOut } = useAuth()
  const navigate = useNavigate()
  
  const [fullName, setFullName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '')
      setAvatar(user.user_metadata?.avatar_url || '')
    }
  }, [user])

  const handleSave = async () => {
    setError('')
    setSuccess('')
    setIsSaving(true)

    const { error: updateError } = await updateProfile({
      full_name: fullName,
      avatar_url: avatar
    })

    setIsSaving(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth/login')
  }

  if (!user) {
    return null
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>👤 My Profile</h1>
          <button onClick={() => navigate('/')} className="btn-back">
            ← Back to Home
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span>✅</span>
            <p>{success}</p>
          </div>
        )}

        <div className="profile-content">
          <div className="profile-avatar">
            <img 
              src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || user.email)}&background=667eea&color=fff&size=200`}
              alt="Profile"
              className="avatar-img"
            />
            {isEditing && (
              <div className="avatar-edit">
                <label htmlFor="avatar-url">Avatar URL</label>
                <input
                  id="avatar-url"
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
                <small>Or leave empty for auto-generated avatar</small>
              </div>
            )}
          </div>

          <div className="profile-info">
            <div className="info-group">
              <label>Email</label>
              <div className="info-value">
                <span>{user.email}</span>
                {user.email_confirmed_at && (
                  <span className="badge badge-verified">✓ Verified</span>
                )}
              </div>
            </div>

            <div className="info-group">
              <label>Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="info-value">
                  {fullName || <span className="text-muted">Not set</span>}
                </div>
              )}
            </div>

            <div className="info-group">
              <label>User ID</label>
              <div className="info-value">
                <code>{user.id}</code>
              </div>
            </div>

            <div className="info-group">
              <label>Account Created</label>
              <div className="info-value">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            <div className="info-group">
              <label>Last Sign In</label>
              <div className="info-value">
                {user.last_sign_in_at ? (
                  new Date(user.last_sign_in_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                ) : (
                  <span className="text-muted">N/A</span>
                )}
              </div>
            </div>
          </div>

          <div className="profile-actions">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setFullName(user.user_metadata?.full_name || '')
                    setAvatar(user.user_metadata?.avatar_url || '')
                    setError('')
                  }}
                  className="btn btn-secondary"
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleSignOut}
                  className="btn btn-danger"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile