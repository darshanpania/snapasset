import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectService } from '../server/services/ProjectService.js';
import { Project } from '../server/models/Project.js';

describe('ProjectService', () => {
  let projectService;
  let mockSupabase;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({ select: vi.fn() })),
        select: vi.fn(() => ({ eq: vi.fn(), or: vi.fn() })),
        update: vi.fn(() => ({ eq: vi.fn(), select: vi.fn() })),
        delete: vi.fn(() => ({ eq: vi.fn() })),
      })),
    };

    projectService = new ProjectService(mockSupabase);
  });

  describe('createProject', () => {
    it('should create a valid project', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A test project',
        owner_id: 'user-123',
        visibility: 'private',
      };

      const mockResponse = {
        data: [{ id: 'project-123', ...projectData }],
        error: null,
      };

      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve(mockResponse)),
        })),
      }));

      const result = await projectService.createProject(projectData);

      expect(result).toEqual(mockResponse.data[0]);
    });

    it('should reject invalid project data', async () => {
      const invalidData = {
        name: '', // Empty name
        owner_id: 'user-123',
      };

      await expect(projectService.createProject(invalidData)).rejects.toThrow();
    });
  });

  describe('Project validation', () => {
    it('should validate project name', () => {
      const project = new Project({
        name: 'Valid Name',
        owner_id: 'user-123',
      });

      const validation = project.validate();
      expect(validation.isValid).toBe(true);
    });

    it('should reject long project names', () => {
      const project = new Project({
        name: 'a'.repeat(101), // 101 characters
        owner_id: 'user-123',
      });

      const validation = project.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Project name must be 100 characters or less');
    });

    it('should validate visibility values', () => {
      const project = new Project({
        name: 'Test',
        owner_id: 'user-123',
        visibility: 'invalid',
      });

      const validation = project.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid project visibility');
    });
  });
});