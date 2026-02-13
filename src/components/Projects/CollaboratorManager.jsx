import React, { useState, useEffect } from 'react';
import { projectApi } from '../../services/api';
import './CollaboratorManager.css';

export const CollaboratorManager = ({ projectId }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'viewer',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCollaborators();
  }, [projectId]);

  const loadCollaborators = async () => {
    try {
      const response = await projectApi.getCollaborators(projectId);
      setCollaborators(response.data || []);
    } catch (error) {
      console.error('Failed to load collaborators:', error);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await projectApi.addCollaborator(projectId, inviteForm);
      setInviteForm({ email: '', role: 'viewer' });
      setShowInvite(false);
      loadCollaborators();
    } catch (error) {
      alert('Failed to invite collaborator: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) return;

    try {
      await projectApi.removeCollaborator(projectId, userId);
      loadCollaborators();
    } catch (error) {
      alert('Failed to remove collaborator: ' + error.message);
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      owner: '#10b981',
      editor: '#3b82f6',
      viewer: '#6b7280',
    };
    return <span className="role-badge" style={{ background: colors[role] }}>{role}</span>;
  };

  return (
    <div className="collaborator-manager">
      <div className="manager-header">
        <h3>Collaborators ({collaborators.length})</h3>
        <button onClick={() => setShowInvite(!showInvite)} className="btn-primary">
          + Invite
        </button>
      </div>

      {showInvite && (
        <form onSubmit={handleInvite} className="invite-form">
          <input
            type="email"
            placeholder="Email address"
            value={inviteForm.email}
            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
            required
          />
          <select
            value={inviteForm.role}
            onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="owner">Owner</option>
          </select>
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
      )}

      <div className="collaborators-list">
        {collaborators.map((collab) => (
          <div key={collab.id} className="collaborator-item">
            <div className="collaborator-info">
              <div className="avatar">{collab.user?.name?.[0] || '?'}</div>
              <div>
                <div className="name">{collab.user?.name || collab.user?.email}</div>
                <div className="email">{collab.user?.email}</div>
              </div>
            </div>
            <div className="collaborator-actions">
              {getRoleBadge(collab.role)}
              {collab.role !== 'owner' && (
                <button
                  onClick={() => handleRemove(collab.user_id)}
                  className="btn-remove"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};