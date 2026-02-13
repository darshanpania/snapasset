/**
 * Project Routes
 * Handles all project-related API endpoints
 */

import express from 'express';
import { ProjectService } from '../services/ProjectService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Attach ProjectService instance per request
router.use((req, res, next) => {
  req.projectService = new ProjectService(req.app.locals.supabase);
  next();
});

// Create a new project
router.post('/', async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      owner_id: req.user.id,
    };

    const project = await req.projectService.createProject(projectData);
    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all projects for user
router.get('/', async (req, res) => {
  try {
    const { status, visibility, tags, search, page = 1, limit = 20 } = req.query;

    const projects = await req.projectService.getUserProjects(req.user.id, {
      status,
      visibility,
      tags: tags ? tags.split(',') : undefined,
      search,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      data: projects.data,
      pagination: projects.pagination,
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await req.projectService.getProjectById(req.params.id, req.user.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const project = await req.projectService.updateProject(req.params.id, req.user.id, req.body);

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { permanent = false } = req.query;

    await req.projectService.deleteProject(req.params.id, req.user.id, permanent === 'true');

    res.json({
      success: true,
      message: permanent === 'true' ? 'Project permanently deleted' : 'Project moved to trash',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get project statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const stats = await req.projectService.getProjectStats(req.params.id, req.user.id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Add images to project
router.post('/:id/images', async (req, res) => {
  try {
    const { image_ids } = req.body;

    if (!Array.isArray(image_ids)) {
      return res.status(400).json({
        success: false,
        error: 'image_ids must be an array',
      });
    }

    const result = await req.projectService.addImagesToProject(
      req.params.id,
      req.user.id,
      image_ids
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Add images error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Remove images from project (POST alternative for clients that can't send DELETE body)
router.post('/:id/images/remove', async (req, res) => {
  try {
    const { image_ids } = req.body;

    if (!Array.isArray(image_ids)) {
      return res.status(400).json({
        success: false,
        error: 'image_ids must be an array',
      });
    }

    await req.projectService.removeImagesFromProject(req.params.id, req.user.id, image_ids);

    res.json({
      success: true,
      message: 'Images removed from project',
    });
  } catch (error) {
    console.error('Remove images error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Remove images from project (DELETE - kept for backward compatibility)
router.delete('/:id/images', async (req, res) => {
  try {
    const { image_ids } = req.body;

    if (!Array.isArray(image_ids)) {
      return res.status(400).json({
        success: false,
        error: 'image_ids must be an array',
      });
    }

    await req.projectService.removeImagesFromProject(req.params.id, req.user.id, image_ids);

    res.json({
      success: true,
      message: 'Images removed from project',
    });
  } catch (error) {
    console.error('Remove images error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get project images
router.get('/:id/images', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const images = await req.projectService.getProjectImages(req.params.id, req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      data: images.data,
      pagination: images.pagination,
    });
  } catch (error) {
    console.error('Get project images error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Add collaborator
router.post('/:id/collaborators', async (req, res) => {
  try {
    const { user_id, role, permissions } = req.body;

    const collaborator = await req.projectService.addCollaborator(req.params.id, req.user.id, {
      user_id,
      role,
      permissions,
    });

    res.status(201).json({
      success: true,
      data: collaborator,
    });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get collaborators
router.get('/:id/collaborators', async (req, res) => {
  try {
    const collaborators = await req.projectService.getCollaborators(req.params.id, req.user.id);

    res.json({
      success: true,
      data: collaborators,
    });
  } catch (error) {
    console.error('Get collaborators error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Remove collaborator
router.delete('/:id/collaborators/:userId', async (req, res) => {
  try {
    await req.projectService.removeCollaborator(req.params.id, req.user.id, req.params.userId);

    res.json({
      success: true,
      message: 'Collaborator removed',
    });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Create version/backup
router.post('/:id/versions', async (req, res) => {
  try {
    const { notes } = req.body;

    const version = await req.projectService.createVersion(req.params.id, req.user.id, notes);

    res.status(201).json({
      success: true,
      data: version,
    });
  } catch (error) {
    console.error('Create version error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get version history
router.get('/:id/versions', async (req, res) => {
  try {
    const versions = await req.projectService.getVersionHistory(req.params.id, req.user.id);

    res.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Restore from version
router.post('/:id/versions/:versionId/restore', async (req, res) => {
  try {
    const project = await req.projectService.restoreVersion(
      req.params.id,
      req.user.id,
      req.params.versionId
    );

    res.json({
      success: true,
      data: project,
      message: 'Project restored from version',
    });
  } catch (error) {
    console.error('Restore version error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Export project
router.get('/:id/export', async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    const exportData = await req.projectService.exportProject(req.params.id, req.user.id, format);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="project-${req.params.id}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Export project error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Import project
router.post('/import', async (req, res) => {
  try {
    const project = await req.projectService.importProject(req.user.id, req.body);

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Import project error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Bulk operations
router.post('/bulk', async (req, res) => {
  try {
    const { operation, project_ids, data } = req.body;

    if (!['delete', 'archive', 'restore', 'update'].includes(operation)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid operation',
      });
    }

    const result = await req.projectService.bulkOperation(req.user.id, operation, project_ids, data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Bulk operation error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get project analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    const analytics = await req.projectService.getAnalytics(req.params.id, req.user.id, period);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;