# Project Management Feature Documentation

Comprehensive guide to using the project management features in SnapAsset.

## Overview

The project management system allows users to:
- Organize images into projects
- Collaborate with team members
- Track version history
- Manage project settings and metadata
- Analyze project metrics

## Features

### 1. Project Creation

#### Basic Project

```javascript
const project = await projectApi.createProject({
  name: 'My Project',
  description: 'A project for my website assets',
  visibility: 'private', // private, shared, public
  tags: ['website', 'marketing'],
  categories: ['web-design']
});
```

#### From Template

```javascript
// Get available templates
const templates = await projectApi.getTemplates();

// Create project from template
const project = await projectApi.createProject({
  name: 'Social Media Campaign',
  template_id: templates[0].id
});
```

### 2. Image Organization

#### Add Images

```javascript
await projectApi.addImagesToProject(projectId, [
  'image-id-1',
  'image-id-2',
  'image-id-3'
]);
```

#### Get Project Images

```javascript
const response = await projectApi.getProjectImages(projectId, {
  page: 1,
  limit: 50
});

console.log(response.data); // Array of images
console.log(response.pagination); // Pagination info
```

#### Remove Images

```javascript
await projectApi.removeImagesFromProject(projectId, [
  'image-id-1',
  'image-id-2'
]);
```

### 3. Collaboration

#### Add Collaborator

```javascript
await projectApi.addCollaborator(projectId, {
  user_id: 'user-id',
  role: 'editor', // owner, editor, viewer
  permissions: ['read', 'write', 'delete']
});
```

#### Roles and Permissions

- **Owner**: Full control, can delete project
- **Editor**: Can modify project and images
- **Viewer**: Can only view project

#### Get Collaborators

```javascript
const collaborators = await projectApi.getCollaborators(projectId);
```

#### Remove Collaborator

```javascript
await projectApi.removeCollaborator(projectId, userId);
```

### 4. Version History & Backups

#### Create Version

```javascript
const version = await projectApi.createVersion(projectId, 
  'Added new social media assets'
);
```

#### Get Version History

```javascript
const versions = await projectApi.getVersionHistory(projectId);
```

#### Restore Version

```javascript
await projectApi.restoreVersion(projectId, versionId);
```

### 5. Bulk Operations

#### Bulk Delete

```javascript
const result = await projectApi.bulkOperation('delete', [
  'project-id-1',
  'project-id-2'
]);

console.log(result.success); // Successfully deleted
console.log(result.failed);  // Failed deletions
```

#### Bulk Archive

```javascript
await projectApi.bulkOperation('archive', projectIds);
```

#### Bulk Update

```javascript
await projectApi.bulkOperation('update', projectIds, {
  tags: ['archived', '2024'],
  status: 'archived'
});
```

### 6. Import & Export

#### Export Project

```javascript
const exportData = await projectApi.exportProject(projectId, 'json');

// Save to file
const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `project-${projectId}.json`;
a.click();
```

#### Import Project

```javascript
const importData = JSON.parse(fileContent);
const newProject = await projectApi.importProject(importData);
```

### 7. Analytics

#### Get Project Analytics

```javascript
const analytics = await projectApi.getAnalytics(projectId, '30d');

console.log(analytics.images_added);      // Images added in period
console.log(analytics.collaborators);     // Number of collaborators
console.log(analytics.versions_created);  // Versions created
console.log(analytics.timeline);          // Activity timeline
```

#### Dashboard Statistics

```javascript
const stats = await projectApi.getDashboardStats();

console.log(stats.totalProjects);
console.log(stats.activeProjects);
console.log(stats.totalImages);
console.log(stats.collaborations);
```

### 8. Search & Filtering

#### Search Projects

```javascript
const results = await projectApi.getProjects({
  search: 'marketing',
  status: 'active',
  tags: ['website', 'social-media'],
  page: 1,
  limit: 20
});
```

#### Filter Options

- `status`: active, archived, deleted
- `visibility`: private, shared, public
- `tags`: Array of tags
- `search`: Search in name and description

## UI Components

### ProjectDashboard

Main dashboard displaying all projects with statistics.

```jsx
import { ProjectDashboard } from './components/Projects/ProjectDashboard';

function App() {
  return <ProjectDashboard />;
}
```

### ProjectForm

Form for creating and editing projects.

```jsx
import { ProjectForm } from './components/Projects/ProjectForm';

function CreateProject() {
  return (
    <ProjectForm
      onSuccess={() => navigate('/projects')}
      onCancel={() => navigate('/projects')}
    />
  );
}
```

### CollaboratorManager

Manage project collaborators.

```jsx
import { CollaboratorManager } from './components/Projects/CollaboratorManager';

function ProjectSettings({ projectId }) {
  return <CollaboratorManager projectId={projectId} />;
}
```

### VersionHistory

View and manage project versions.

```jsx
import { VersionHistory } from './components/Projects/VersionHistory';

function ProjectHistory({ projectId }) {
  return <VersionHistory projectId={projectId} />;
}
```

## Database Schema

### Tables

#### projects
```sql
id                UUID PRIMARY KEY
name              VARCHAR(100)
description       TEXT
owner_id          UUID REFERENCES auth.users
template_id       UUID REFERENCES project_templates
status            VARCHAR(20) -- active, archived, deleted
visibility        VARCHAR(20) -- private, shared, public
settings          JSONB
tags              TEXT[]
categories        TEXT[]
created_at        TIMESTAMP
updated_at        TIMESTAMP
deleted_at        TIMESTAMP
```

#### project_images
```sql
id                UUID PRIMARY KEY
project_id        UUID REFERENCES projects
image_id          UUID
order             INTEGER
tags              TEXT[]
metadata          JSONB
created_at        TIMESTAMP
```

#### project_collaborators
```sql
id                UUID PRIMARY KEY
project_id        UUID REFERENCES projects
user_id           UUID REFERENCES auth.users
role              VARCHAR(20) -- owner, editor, viewer
permissions       TEXT[]
invited_by        UUID REFERENCES auth.users
invited_at        TIMESTAMP
accepted_at       TIMESTAMP
```

#### project_versions
```sql
id                UUID PRIMARY KEY
project_id        UUID REFERENCES projects
version_number    INTEGER
snapshot          JSONB
changes           JSONB
created_by        UUID REFERENCES auth.users
created_at        TIMESTAMP
notes             TEXT
```

## API Endpoints

### Projects

- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/stats` - Get project statistics

### Images

- `POST /api/projects/:id/images` - Add images
- `GET /api/projects/:id/images` - Get project images
- `DELETE /api/projects/:id/images` - Remove images

### Collaborators

- `POST /api/projects/:id/collaborators` - Add collaborator
- `GET /api/projects/:id/collaborators` - Get collaborators
- `DELETE /api/projects/:id/collaborators/:userId` - Remove collaborator

### Versions

- `POST /api/projects/:id/versions` - Create version
- `GET /api/projects/:id/versions` - Get version history
- `POST /api/projects/:id/versions/:versionId/restore` - Restore version

### Import/Export

- `GET /api/projects/:id/export` - Export project
- `POST /api/projects/import` - Import project

### Bulk Operations

- `POST /api/projects/bulk` - Bulk operations

### Analytics

- `GET /api/projects/:id/analytics` - Get project analytics

## Security

### Row Level Security (RLS)

All tables have RLS enabled:
- Users can only see their own projects
- Collaborators can access shared projects
- Public projects are visible to all

### Authentication

All API endpoints require authentication:
```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

## Best Practices

### 1. Regular Backups

Create versions before major changes:
```javascript
await projectApi.createVersion(projectId, 'Before bulk image update');
// Make changes
```

### 2. Use Tags Effectively

Organize projects with consistent tags:
```javascript
// Good
tags: ['client-name', 'project-type', 'year']

// Avoid
tags: ['misc', 'stuff', 'things']
```

### 3. Manage Collaborators

Grant minimum necessary permissions:
```javascript
// For clients - view only
role: 'viewer'

// For team members - edit
role: 'editor'

// For project managers - full control
role: 'owner'
```

### 4. Archive Old Projects

Keep active projects manageable:
```javascript
await projectApi.bulkOperation('archive', oldProjectIds);
```