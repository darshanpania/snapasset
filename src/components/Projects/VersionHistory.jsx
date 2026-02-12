import React, { useState, useEffect } from 'react';
import { projectApi } from '../../services/api';
import './VersionHistory.css';

export const VersionHistory = ({ projectId }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadVersions();
  }, [projectId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const response = await projectApi.getVersionHistory(projectId);
      setVersions(response.data || []);
    } catch (error) {
      console.error('Failed to load version history:', error);
    } finally {
      setLoading(false);
    }
  };

  const createVersion = async () => {
    try {
      setCreating(true);
      await projectApi.createVersion(projectId, notes);
      setNotes('');
      loadVersions();
    } catch (error) {
      alert('Failed to create version: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const restoreVersion = async (versionId) => {
    if (!confirm('Are you sure you want to restore this version? This will overwrite the current project state.')) {
      return;
    }

    try {
      await projectApi.restoreVersion(projectId, versionId);
      alert('Version restored successfully!');
      window.location.reload();
    } catch (error) {
      alert('Failed to restore version: ' + error.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading version history...</div>;
  }

  return (
    <div className="version-history">
      <div className="history-header">
        <h3>Version History</h3>
        <div className="create-version">
          <input
            type="text"
            placeholder="Version notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button onClick={createVersion} disabled={creating} className="btn-primary">
            {creating ? 'Creating...' : '+ Create Backup'}
          </button>
        </div>
      </div>

      <div className="versions-list">
        {versions.length === 0 ? (
          <div className="empty-state">No versions created yet</div>
        ) : (
          versions.map((version) => (
            <div key={version.id} className="version-item">
              <div className="version-info">
                <div className="version-number">v{version.version_number}</div>
                <div className="version-details">
                  <div className="version-date">
                    {new Date(version.created_at).toLocaleString()}
                  </div>
                  {version.notes && <div className="version-notes">{version.notes}</div>}
                  <div className="version-stats">
                    {version.snapshot?.images?.length || 0} images
                  </div>
                </div>
              </div>
              <button
                onClick={() => restoreVersion(version.id)}
                className="btn-restore"
              >
                Restore
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};