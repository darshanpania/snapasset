import React, { useState, useEffect } from 'react';
import { projectApi } from '../../services/api';
import './ProjectDashboard.css';

export const ProjectDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProjects();
    loadStats();
  }, [filter, searchQuery]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectApi.getProjects({
        status: filter === 'all' ? undefined : filter,
        search: searchQuery || undefined,
        page: 1,
        limit: 20,
      });
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await projectApi.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <div className="project-dashboard">
      <div className="dashboard-header">
        <h1>Project Dashboard</h1>
        <button className="btn-primary" onClick={() => window.location.href = '/projects/new'}>
          + New Project
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalProjects || 0}</div>
          <div className="stat-label">Total Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.activeProjects || 0}</div>
          <div className="stat-label">Active Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalImages || 0}</div>
          <div className="stat-label">Total Images</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.collaborations || 0}</div>
          <div className="stat-label">Collaborations</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="controls-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'active' ? 'active' : ''}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={filter === 'archived' ? 'active' : ''}
            onClick={() => setFilter('archived')}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="loading">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <p>No projects found. Create your first project to get started!</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onUpdate={loadProjects} />
          ))}
        </div>
      )}
    </div>
  );
};

const ProjectCard = ({ project, onUpdate }) => {
  return (
    <div className="project-card" onClick={() => window.location.href = `/projects/${project.id}`}>
      <div className="project-card-header">
        <h3>{project.name}</h3>
        <span className={`status-badge ${project.status}`}>{project.status}</span>
      </div>
      <p className="project-description">{project.description || 'No description'}</p>
      <div className="project-meta">
        <span>📷 {project.image_count || 0} images</span>
        <span>👥 {project.collaborator_count || 0} collaborators</span>
      </div>
      <div className="project-tags">
        {project.tags?.slice(0, 3).map((tag, i) => (
          <span key={i} className="tag">{tag}</span>
        ))}
      </div>
      <div className="project-footer">
        <small>Updated {new Date(project.updated_at).toLocaleDateString()}</small>
      </div>
    </div>
  );
};