import React, { useState, useEffect } from 'react';
import { projectApi } from '../../services/api';
import './ProjectForm.css';

export const ProjectForm = ({ projectId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'private',
    tags: [],
    categories: [],
    template_id: null,
  });
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadTemplates();
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadTemplates = async () => {
    try {
      const response = await projectApi.getTemplates();
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadProject = async () => {
    try {
      const response = await projectApi.getProject(projectId);
      setFormData(response.data);
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (projectId) {
        await projectApi.updateProject(projectId, formData);
      } else {
        await projectApi.createProject(formData);
      }
      onSuccess?.();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const applyTemplate = (templateId) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setFormData((prev) => ({
        ...prev,
        template_id: templateId,
        settings: template.settings,
      }));
    }
  };

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <h2>{projectId ? 'Edit Project' : 'Create New Project'}</h2>

      {errors.submit && <div className="error-message">{errors.submit}</div>}

      {/* Template Selection */}
      {!projectId && templates.length > 0 && (
        <div className="form-group">
          <label>Start from Template (Optional)</label>
          <div className="template-grid">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`template-card ${
                  formData.template_id === template.id ? 'selected' : ''
                }`}
                onClick={() => applyTemplate(template.id)}
              >
                {template.thumbnail_url && (
                  <img src={template.thumbnail_url} alt={template.name} />
                )}
                <h4>{template.name}</h4>
                <p>{template.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Name */}
      <div className="form-group">
        <label htmlFor="name">Project Name *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          maxLength={100}
          placeholder="My Awesome Project"
        />
      </div>

      {/* Description */}
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          placeholder="Describe your project..."
        />
      </div>

      {/* Visibility */}
      <div className="form-group">
        <label htmlFor="visibility">Visibility</label>
        <select
          id="visibility"
          name="visibility"
          value={formData.visibility}
          onChange={handleChange}
        >
          <option value="private">Private - Only you</option>
          <option value="shared">Shared - Invited collaborators</option>
          <option value="public">Public - Everyone</option>
        </select>
      </div>

      {/* Tags */}
      <div className="form-group">
        <label>Tags</label>
        <div className="tags-input">
          <div className="tags-list">
            {formData.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
                <button type="button" onClick={() => removeTag(tag)}>
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="tag-input-wrapper">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add a tag..."
            />
            <button type="button" onClick={addTag}>
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : projectId ? 'Update Project' : 'Create Project'}
        </button>
      </div>
    </form>
  );
};