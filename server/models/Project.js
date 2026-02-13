/**
 * Project Model
 * Manages project data structure and validation
 */

export class Project {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name;
    this.description = data.description || '';
    this.owner_id = data.owner_id;
    this.template_id = data.template_id || null;
    this.status = data.status || 'active'; // active, archived, deleted
    this.visibility = data.visibility || 'private'; // private, shared, public
    this.settings = data.settings || {};
    this.tags = data.tags || [];
    this.categories = data.categories || [];
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
    this.deleted_at = data.deleted_at || null;
  }

  validate() {
    const errors = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Project name is required');
    }

    if (this.name && this.name.length > 100) {
      errors.push('Project name must be 100 characters or less');
    }

    if (!this.owner_id) {
      errors.push('Project owner is required');
    }

    if (!['active', 'archived', 'deleted'].includes(this.status)) {
      errors.push('Invalid project status');
    }

    if (!['private', 'shared', 'public'].includes(this.visibility)) {
      errors.push('Invalid project visibility');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      owner_id: this.owner_id,
      template_id: this.template_id,
      status: this.status,
      visibility: this.visibility,
      settings: this.settings,
      tags: this.tags,
      categories: this.categories,
      created_at: this.created_at,
      updated_at: this.updated_at,
      deleted_at: this.deleted_at,
    };
  }
}

export class ProjectImage {
  constructor(data) {
    this.id = data.id || null;
    this.project_id = data.project_id;
    this.image_id = data.image_id;
    this.order = data.order || 0;
    this.tags = data.tags || [];
    this.metadata = data.metadata || {};
    this.created_at = data.created_at || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      project_id: this.project_id,
      image_id: this.image_id,
      order: this.order,
      tags: this.tags,
      metadata: this.metadata,
      created_at: this.created_at,
    };
  }
}

export class ProjectCollaborator {
  constructor(data) {
    this.id = data.id || null;
    this.project_id = data.project_id;
    this.user_id = data.user_id;
    this.role = data.role || 'viewer'; // owner, editor, viewer
    this.permissions = data.permissions || [];
    this.invited_by = data.invited_by;
    this.invited_at = data.invited_at || new Date().toISOString();
    this.accepted_at = data.accepted_at || null;
  }

  toJSON() {
    return {
      id: this.id,
      project_id: this.project_id,
      user_id: this.user_id,
      role: this.role,
      permissions: this.permissions,
      invited_by: this.invited_by,
      invited_at: this.invited_at,
      accepted_at: this.accepted_at,
    };
  }
}

export class ProjectVersion {
  constructor(data) {
    this.id = data.id || null;
    this.project_id = data.project_id;
    this.version_number = data.version_number;
    this.snapshot = data.snapshot || {};
    this.changes = data.changes || [];
    this.created_by = data.created_by;
    this.created_at = data.created_at || new Date().toISOString();
    this.notes = data.notes || '';
  }

  toJSON() {
    return {
      id: this.id,
      project_id: this.project_id,
      version_number: this.version_number,
      snapshot: this.snapshot,
      changes: this.changes,
      created_by: this.created_by,
      created_at: this.created_at,
      notes: this.notes,
    };
  }
}