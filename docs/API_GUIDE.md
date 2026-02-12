# SnapAsset API Guide

Complete guide to using the SnapAsset API.

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Job Lifecycle](#job-lifecycle)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Authentication

### Bearer Token (JWT)

All API requests require authentication using JWT tokens from Supabase:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/api/jobs
```

### API Key

Alternatively, use an API key for service-to-service communication:

```bash
curl -H "X-API-Key: YOUR_API_KEY" \
     http://localhost:3001/api/jobs
```

## Rate Limiting

### Limits

- **General API**: 100 requests per 15 minutes
- **Job Creation**: 20 jobs per hour

### Headers

Every response includes rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### Handling Rate Limits

```javascript
const response = await fetch('/api/jobs', { method: 'POST', body });

if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  console.log(`Rate limited. Retry after ${retryAfter} seconds`);
  // Wait and retry
}
```

## Job Lifecycle

### States

1. **waiting** - Job is queued
2. **active** - Job is being processed
3. **completed** - Job finished successfully
4. **failed** - Job failed (will retry)
5. **delayed** - Job is delayed for retry

### Lifecycle Flow

```
Create Job → waiting → active → completed
                         │
                         └→ failed → delayed → active
                                     │
                                     └→ failed (max retries)
```

### Progress Tracking

Jobs report progress from 0-100%:

- 0-10%: Starting
- 10-30%: Generating with DALL-E
- 30-40%: Downloading image
- 40-50%: Saving to database
- 50-100%: Processing platforms

## API Reference

### Create Job

```http
POST /api/jobs
```

**Request:**

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "prompt": "A beautiful sunset over mountains",
  "platforms": ["instagram-post", "twitter-post"],
  "options": {
    "quality": "hd",
    "style": "vivid"
  }
}
```

**Response:**

```json
{
  "jobId": "gen-1640000000-abc123",
  "status": "queued",
  "message": "Job created successfully",
  "estimatedTime": "30 seconds"
}
```

### Get Job Status

```http
GET /api/jobs/:jobId
```

**Response:**

```json
{
  "jobId": "gen-1640000000-abc123",
  "status": "active",
  "progress": 65,
  "data": {
    "userId": "...",
    "prompt": "A beautiful sunset over mountains",
    "platforms": ["instagram-post", "twitter-post"]
  },
  "logs": [
    "Starting DALL-E image generation...",
    "Image generated successfully",
    "Processing Instagram Post..."
  ],
  "createdAt": "2024-01-24T10:00:00Z",
  "processedAt": "2024-01-24T10:00:05Z"
}
```

### Completed Job Response

```json
{
  "jobId": "gen-1640000000-abc123",
  "status": "completed",
  "progress": 100,
  "result": {
    "success": true,
    "generationId": "uuid-here",
    "images": [
      {
        "platform": "Instagram Post",
        "url": "https://storage.supabase.co/...",
        "width": 1080,
        "height": 1080,
        "size": 245000
      },
      {
        "platform": "Twitter Post",
        "url": "https://storage.supabase.co/...",
        "width": 1200,
        "height": 675,
        "size": 189000
      }
    ],
    "revisedPrompt": "A beautiful sunset over mountains..."
  },
  "finishedAt": "2024-01-24T10:00:35Z"
}
```

### Real-time Updates (SSE)

```javascript
const eventSource = new EventSource(
  `http://localhost:3001/api/sse/jobs/${jobId}`
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'connected':
      console.log('Connected to job updates');
      break;
      
    case 'progress':
      console.log(`Progress: ${data.progress}%`);
      updateProgressBar(data.progress);
      break;
      
    case 'done':
      console.log('Job completed!', data.result);
      displayImages(data.result.images);
      eventSource.close();
      break;
  }
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  eventSource.close();
};
```

### List Jobs

```http
GET /api/jobs?status=active&limit=10
```

**Query Parameters:**
- `status` - Filter by status (waiting, active, completed, failed)
- `limit` - Number of jobs to return (default: 20)

**Response:**

```json
{
  "jobs": [
    {
      "jobId": "gen-1640000000-abc123",
      "status": "active",
      "progress": 45,
      "createdAt": "2024-01-24T10:00:00Z"
    }
  ],
  "count": 1,
  "status": "active"
}
```

### Retry Failed Job

```http
POST /api/jobs/:jobId/retry
```

**Response:**

```json
{
  "jobId": "gen-1640000000-abc123",
  "status": "retrying",
  "message": "Job has been queued for retry"
}
```

### Cancel Job

```http
DELETE /api/jobs/:jobId/cancel
```

**Response:**

```json
{
  "jobId": "gen-1640000000-abc123",
  "status": "cancelled",
  "message": "Job cancelled successfully"
}
```

### Queue Statistics

```http
GET /api/queue/stats
```

**Response:**

```json
{
  "waiting": 5,
  "active": 2,
  "completed": 150,
  "failed": 3,
  "delayed": 0,
  "total": 160,
  "timestamp": "2024-01-24T10:00:00Z"
}
```

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Invalid request",
  "message": "Missing required field: prompt",
  "code": "INVALID_REQUEST",
  "timestamp": "2024-01-24T10:00:00Z"
}
```

### HTTP Status Codes

| Status | Meaning |
|--------|----------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `INVALID_REQUEST` | Missing or invalid data | Check request body |
| `UNAUTHORIZED` | Invalid token | Refresh authentication |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |
| `JOB_LIMIT_EXCEEDED` | Too many jobs | Wait for jobs to complete |
| `JOB_NOT_FOUND` | Job doesn't exist | Check job ID |
| `INTERNAL_ERROR` | Server error | Retry or contact support |

### Handling Errors

```javascript
try {
  const response = await fetch('/api/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(jobData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    switch (error.code) {
      case 'RATE_LIMIT_EXCEEDED':
        // Wait and retry
        await sleep(error.retryAfter * 1000);
        return createJob(jobData);
        
      case 'UNAUTHORIZED':
        // Refresh token
        await refreshAuth();
        return createJob(jobData);
        
      default:
        throw new Error(error.message);
    }
  }
  
  return await response.json();
} catch (error) {
  console.error('Failed to create job:', error);
  throw error;
}
```

## Best Practices

### 1. Use Real-time Updates

Prefer SSE over polling for job status:

```javascript
// Good: Real-time updates
const eventSource = new EventSource(`/api/sse/jobs/${jobId}`);
eventSource.onmessage = handleUpdate;

// Bad: Polling
const interval = setInterval(async () => {
  const status = await fetch(`/api/jobs/${jobId}`);
  // ...
}, 1000);
```

### 2. Handle Rate Limits Gracefully

```javascript
class ApiClient {
  async request(url, options) {
    let retries = 3;
    
    while (retries > 0) {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        await sleep(retryAfter * 1000);
        retries--;
        continue;
      }
      
      return response;
    }
    
    throw new Error('Max retries exceeded');
  }
}
```

### 3. Validate Before Creating Jobs

```javascript
function validateJobData(data) {
  if (!data.userId) {
    throw new Error('userId is required');
  }
  
  if (!data.prompt || data.prompt.length < 10) {
    throw new Error('prompt must be at least 10 characters');
  }
  
  if (!data.platforms || data.platforms.length === 0) {
    throw new Error('At least one platform is required');
  }
  
  const validPlatforms = [
    'instagram-post', 'instagram-story',
    'twitter-post', 'facebook-post'
  ];
  
  for (const platform of data.platforms) {
    if (!validPlatforms.includes(platform)) {
      throw new Error(`Invalid platform: ${platform}`);
    }
  }
}
```

### 4. Clean Up Completed Jobs

Regularly clean old jobs to keep the queue performant:

```javascript
// Clean jobs older than 24 hours
await fetch('/api/queue/clean', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grace: 86400000, // 24 hours in ms
    status: 'completed'
  })
});
```

### 5. Monitor Queue Health

```javascript
setInterval(async () => {
  const stats = await fetch('/api/queue/stats').then(r => r.json());
  
  // Alert if too many failed jobs
  if (stats.failed > 10) {
    console.warn('High number of failed jobs:', stats.failed);
  }
  
  // Alert if queue is backed up
  if (stats.waiting > 100) {
    console.warn('Queue is backed up:', stats.waiting);
  }
}, 60000); // Check every minute
```

### 6. Use Exponential Backoff

```javascript
async function createJobWithRetry(data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await createJob(data);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, i) * 1000;
      await sleep(delay);
    }
  }
}
```

### 7. Implement Timeout

```javascript
function createJobWithTimeout(data, timeout = 60000) {
  return Promise.race([
    createJob(data),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ]);
}
```

## SDK Example

Simple JavaScript SDK:

```javascript
class SnapAssetClient {
  constructor(apiUrl, token) {
    this.apiUrl = apiUrl;
    this.token = token;
  }
  
  async createJob(data) {
    const response = await fetch(`${this.apiUrl}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(await response.text());
    }
    
    return response.json();
  }
  
  async getJob(jobId) {
    const response = await fetch(`${this.apiUrl}/api/jobs/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    
    return response.json();
  }
  
  streamJob(jobId, onUpdate, onComplete, onError) {
    const eventSource = new EventSource(
      `${this.apiUrl}/api/sse/jobs/${jobId}`
    );
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'progress') {
        onUpdate(data);
      } else if (data.type === 'done') {
        onComplete(data.result);
        eventSource.close();
      }
    };
    
    eventSource.onerror = (error) => {
      onError(error);
      eventSource.close();
    };
    
    return eventSource;
  }
}

// Usage
const client = new SnapAssetClient('http://localhost:3001', 'your-token');

const { jobId } = await client.createJob({
  userId: 'user-123',
  prompt: 'A beautiful sunset',
  platforms: ['instagram-post']
});

client.streamJob(
  jobId,
  (data) => console.log(`Progress: ${data.progress}%`),
  (result) => console.log('Completed!', result),
  (error) => console.error('Error:', error)
);
```

## Support

- API Documentation: http://localhost:3001/api-docs
- GitHub Issues: https://github.com/darshanpania/snapasset/issues
- Email: support@snapasset.com