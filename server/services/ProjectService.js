/**
 * Project Service
 * Business logic for project management
 */

import { Project, ProjectImage, ProjectCollaborator, ProjectVersion } from '../models/Project.js';

export class ProjectService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async createProject(projectData) {
    const project = new Project(projectData);
    const validation = project.validate();

    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const { data, error } = await this.supabase.from('projects').insert([project.toJSON()]).select();

    if (error) throw error;

    return data[0];
  }

  async getUserProjects(userId, filters = {}) {
    let query = this.supabase
      .from('projects')
      .select('*, project_images(count)', { count: 'exact' })
      .or(`owner_id.eq.${userId},collaborators.user_id.eq.${userId}`);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.visibility) {
      query = query.eq('visibility', filters.visibility);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('updated_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getProjectById(projectId, userId) {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*, project_images(*), collaborators(*)')
      .eq('id', projectId)
      .single();

    if (error) throw error;

    // Check if user has access
    if (
      data.owner_id !== userId &&
      !data.collaborators.some((c) => c.user_id === userId)
    ) {
      throw new Error('Access denied');
    }

    return data;
  }

  async updateProject(projectId, userId, updates) {
    // Check permissions
    const project = await this.getProjectById(projectId, userId);

    if (!this.canEdit(project, userId)) {
      throw new Error('Permission denied');
    }

    const { data, error } = await this.supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select();

    if (error) throw error;

    return data[0];
  }

  async deleteProject(projectId, userId, permanent = false) {
    const project = await this.getProjectById(projectId, userId);

    if (project.owner_id !== userId) {
      throw new Error('Only project owner can delete');
    }

    if (permanent) {
      const { error } = await this.supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
    } else {
      const { error } = await this.supabase
        .from('projects')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString(),
        })
        .eq('id', projectId);
      if (error) throw error;
    }

    return true;
  }

  async getProjectStats(projectId, userId) {
    const project = await this.getProjectById(projectId, userId);

    const { count: imageCount } = await this.supabase
      .from('project_images')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    const { count: collaboratorCount } = await this.supabase
      .from('project_collaborators')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    const { count: versionCount } = await this.supabase
      .from('project_versions')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    return {
      images: imageCount || 0,
      collaborators: collaboratorCount || 0,
      versions: versionCount || 0,
      created_at: project.created_at,
      updated_at: project.updated_at,
    };
  }

  async addImagesToProject(projectId, userId, imageIds) {
    const project = await this.getProjectById(projectId, userId);

    if (!this.canEdit(project, userId)) {
      throw new Error('Permission denied');
    }

    const projectImages = imageIds.map((imageId, index) => ({
      project_id: projectId,
      image_id: imageId,
      order: index,
    }));

    const { data, error } = await this.supabase
      .from('project_images')
      .insert(projectImages)
      .select();

    if (error) throw error;

    return data;
  }

  async removeImagesFromProject(projectId, userId, imageIds) {
    const project = await this.getProjectById(projectId, userId);

    if (!this.canEdit(project, userId)) {
      throw new Error('Permission denied');
    }

    const { error } = await this.supabase
      .from('project_images')
      .delete()
      .eq('project_id', projectId)
      .in('image_id', imageIds);

    if (error) throw error;

    return true;
  }

  async getProjectImages(projectId, userId, options = {}) {
    await this.getProjectById(projectId, userId); // Check access

    const page = options.page || 1;
    const limit = options.limit || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await this.supabase
      .from('project_images')
      .select('*, images(*)', { count: 'exact' })
      .eq('project_id', projectId)
      .order('order', { ascending: true })
      .range(from, to);

    if (error) throw error;

    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async addCollaborator(projectId, userId, collaboratorData) {
    const project = await this.getProjectById(projectId, userId);

    if (project.owner_id !== userId) {
      throw new Error('Only project owner can add collaborators');
    }

    const collaborator = new ProjectCollaborator({
      ...collaboratorData,
      project_id: projectId,
      invited_by: userId,
    });

    const { data, error } = await this.supabase
      .from('project_collaborators')
      .insert([collaborator.toJSON()])
      .select();

    if (error) throw error;

    return data[0];
  }

  async getCollaborators(projectId, userId) {
    await this.getProjectById(projectId, userId); // Check access

    const { data, error } = await this.supabase
      .from('project_collaborators')
      .select('*, users(id, email, name)')
      .eq('project_id', projectId);

    if (error) throw error;

    return data;
  }

  async removeCollaborator(projectId, userId, collaboratorUserId) {
    const project = await this.getProjectById(projectId, userId);

    if (project.owner_id !== userId) {
      throw new Error('Only project owner can remove collaborators');
    }

    const { error } = await this.supabase
      .from('project_collaborators')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', collaboratorUserId);

    if (error) throw error;

    return true;
  }

  async createVersion(projectId, userId, notes = '') {
    const project = await this.getProjectById(projectId, userId);

    if (!this.canEdit(project, userId)) {
      throw new Error('Permission denied');
    }

    // Get current project state
    const { data: images } = await this.supabase
      .from('project_images')
      .select('*')
      .eq('project_id', projectId);

    // Get latest version number
    const { data: versions } = await this.supabase
      .from('project_versions')
      .select('version_number')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1);

    const versionNumber = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

    const version = new ProjectVersion({
      project_id: projectId,
      version_number: versionNumber,
      snapshot: {
        project,
        images,
      },
      created_by: userId,
      notes,
    });

    const { data, error } = await this.supabase
      .from('project_versions')
      .insert([version.toJSON()])
      .select();

    if (error) throw error;

    return data[0];
  }

  async getVersionHistory(projectId, userId) {
    await this.getProjectById(projectId, userId); // Check access

    const { data, error } = await this.supabase
      .from('project_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false });

    if (error) throw error;

    return data;
  }

  async restoreVersion(projectId, userId, versionId) {
    const project = await this.getProjectById(projectId, userId);

    if (!this.canEdit(project, userId)) {
      throw new Error('Permission denied');
    }

    const { data: version, error: versionError } = await this.supabase
      .from('project_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (versionError) throw versionError;

    // Restore project data
    const { data: updatedProject, error: updateError } = await this.supabase
      .from('projects')
      .update(version.snapshot.project)
      .eq('id', projectId)
      .select();

    if (updateError) throw updateError;

    // Restore images
    await this.supabase.from('project_images').delete().eq('project_id', projectId);

    if (version.snapshot.images && version.snapshot.images.length > 0) {
      await this.supabase.from('project_images').insert(version.snapshot.images);
    }

    return updatedProject[0];
  }

  async exportProject(projectId, userId, format = 'json') {
    const project = await this.getProjectById(projectId, userId);
    const images = await this.getProjectImages(projectId, userId, { limit: 1000 });
    const collaborators = await this.getCollaborators(projectId, userId);
    const versions = await this.getVersionHistory(projectId, userId);

    return {
      project,
      images: images.data,
      collaborators,
      versions,
      exported_at: new Date().toISOString(),
      format,
    };
  }

  async importProject(userId, importData) {
    const projectData = {
      ...importData.project,
      owner_id: userId,
      id: undefined, // Generate new ID
    };

    const project = await this.createProject(projectData);

    // Import images if available
    if (importData.images && importData.images.length > 0) {
      const imageIds = importData.images.map((img) => img.image_id);
      await this.addImagesToProject(project.id, userId, imageIds);
    }

    return project;
  }

  async bulkOperation(userId, operation, projectIds, data = {}) {
    const results = {
      success: [],
      failed: [],
    };

    for (const projectId of projectIds) {
      try {
        switch (operation) {
          case 'delete':
            await this.deleteProject(projectId, userId, false);
            break;
          case 'archive':
            await this.updateProject(projectId, userId, { status: 'archived' });
            break;
          case 'restore':
            await this.updateProject(projectId, userId, { status: 'active', deleted_at: null });
            break;
          case 'update':
            await this.updateProject(projectId, userId, data);
            break;
        }
        results.success.push(projectId);
      } catch (error) {
        results.failed.push({ projectId, error: error.message });
      }
    }

    return results;
  }

  async getAnalytics(projectId, userId, period = '30d') {
    await this.getProjectById(projectId, userId); // Check access

    // Calculate date range
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get image creation timeline
    const { data: imageTimeline } = await this.supabase
      .from('project_images')
      .select('created_at')
      .eq('project_id', projectId)
      .gte('created_at', startDate.toISOString());

    // Get collaborator activity
    const { data: collaboratorActivity } = await this.supabase
      .from('project_collaborators')
      .select('*')
      .eq('project_id', projectId);

    // Get version history count
    const { count: versionCount } = await this.supabase
      .from('project_versions')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .gte('created_at', startDate.toISOString());

    return {
      period,
      images_added: imageTimeline ? imageTimeline.length : 0,
      collaborators: collaboratorActivity ? collaboratorActivity.length : 0,
      versions_created: versionCount || 0,
      timeline: imageTimeline || [],
    };
  }

  canEdit(project, userId) {
    if (project.owner_id === userId) return true;

    const collaborator = project.collaborators?.find((c) => c.user_id === userId);
    return collaborator && ['owner', 'editor'].includes(collaborator.role);
  }

  canView(project, userId) {
    if (project.visibility === 'public') return true;
    if (project.owner_id === userId) return true;

    return project.collaborators?.some((c) => c.user_id === userId);
  }
}