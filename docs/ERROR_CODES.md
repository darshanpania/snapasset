# SnapAsset API Error Codes

Complete reference for all error codes returned by the API.

## Error Response Format

All errors follow this format:

```json
{
  "error": "Error name",
  "message": "Human-readable error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-24T10:00:00Z"
}
```

## Client Errors (4xx)

### 400 Bad Request

#### INVALID_REQUEST

**Description:** The request is missing required fields or contains invalid data.

**Example:**
```json
{
  "error": "Invalid request",
  "message": "Missing required field: prompt",
  "code": "INVALID_REQUEST",
  "timestamp": "2024-01-24T10:00:00Z"
}
```

**Resolution:** Check request body and ensure all required fields are present and valid.

**Required Fields for Job Creation:**
- `userId` (string, UUID format)
- `prompt` (string, min 10 characters)
- `platforms` (array, min 1 item)

#### VALIDATION_ERROR

**Description:** Request data failed validation.

**Common Causes:**
- Invalid platform ID
- Prompt too short (< 10 characters)
- Invalid user ID format
- Unsupported image options

**Example:**
```json
{
  "error": "Validation error",
  "message": "Invalid platform: unknown-platform",
  "code": "VALIDATION_ERROR",
  "timestamp": "2024-01-24T10:00:00Z"
}
```

**Valid Platforms:**
- `instagram-post`, `instagram-story`
- `twitter-post`, `twitter-header`
- `facebook-post`, `facebook-cover`
- `linkedin-post`
- `youtube-thumbnail`

### 401 Unauthorized

#### UNAUTHORIZED

**Description:** Authentication token is missing or invalid.

**Example:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "code": "UNAUTHORIZED",
  "timestamp": "2024-01-24T10:00:00Z"
}
```

**Resolution:**
1. Check Authorization header is present
2. Verify token hasn't expired
3. Refresh token if expired
4. Re-authenticate if refresh fails

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### 403 Forbidden

#### FORBIDDEN

**Description:** User doesn't have permission for this action.

**Example:**
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource",
  "code": "FORBIDDEN",
  "timestamp": "2024-01-24T10:00:00Z"
}
```

**Resolution:** Verify user has required permissions.

### 404 Not Found

#### NOT_FOUND

**Description:** Requested resource doesn't exist.

**Example:**
```json
{
  "error": "Not found",
  "message": "Route GET /api/unknown not found",
  "code": "NOT_FOUND",
  "timestamp": "2024-01-24T10:00:00Z"
}
```

**Resolution:** Check the endpoint URL and HTTP method.

#### JOB_NOT_FOUND

**Description:** Job with specified ID doesn't exist.

**Example:**
```json
{
  "error": "Job not found",
  "message": "No job found with ID: abc123",
  "code": "JOB_NOT_FOUND",
  "timestamp": "2024-01-24T10:00:00Z"
}
```

**Common Causes:**
- Invalid job ID
- Job was cleaned up (>24 hours old)
- Job was cancelled

### 429 Too Many Requests

#### RATE_LIMIT_EXCEEDED

**Description:** General API rate limit exceeded.

**Example:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60,
  "timestamp": "2024-01-24T10:00:00Z"
}
```

**Limits:**
- 100 requests per 15 minutes per IP

**Resolution:**
1. Wait for `retryAfter` seconds
2. Implement exponential backoff
3. Cache responses when possible

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640000900
Retry-After: 60
```

#### JOB_LIMIT_EXCEEDED

**Description:** Job creation limit exceeded.

**Example:**
```json
{
  "error": "Job creation limit exceeded",
  "message": "You have reached the maximum number of jobs per hour (20)",
  "code": "JOB_LIMIT_EXCEEDED",
  "retryAfter": 1800,
  "limit": 20,
  "remaining": 0,
  "timestamp": "2024-01-24T10:00:00Z"
}
```

**Limits:**
- 20 jobs per hour per user

**Resolution:**
1. Wait for current jobs to complete
2. Wait for rate limit window to reset
3. Batch multiple platforms in single job

## Server Errors (5xx)

### 500 Internal Server Error

#### INTERNAL_ERROR

**Description:** An unexpected error occurred on the server.

**Example:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred",
  "code": "INTERNAL_ERROR",
  "timestamp": "2024-01-24T10:00:00Z"
}
```

**Resolution:**
1. Retry the request
2. Check system status
3. Contact support if persists

**Common Causes:**
- OpenAI API down
- Supabase unavailable
- Redis connection lost
- Out of memory

#### OPENAI_ERROR

**Description:** Error communicating with OpenAI API.

**Example:**
```json
{
  "error": "Image generation failed",
  "message": "OpenAI API error: Rate limit exceeded",
  "code": "OPENAI_ERROR",
  "timestamp": "2024-01-24T10:00:00Z"
}
```

**Resolution:**
1. Job will automatically retry
2. Check OpenAI status page
3. Verify API key is valid

#### STORAGE_ERROR

**Description:** Error uploading to Supabase Storage.

**Example:**
```json
{
  "error": "Upload failed",
  "message": "Failed to upload image to storage",
  "code": "STORAGE_ERROR",
  "timestamp": "2024-01-24T10:00:00Z"
}
```

**Resolution:**
1. Job will automatically retry
2. Check Supabase status
3. Verify storage bucket exists

#### QUEUE_ERROR

**Description:** Error with job queue system.

**Example:**
```json
{
  "error": "Queue error",
  "message": "Failed to add job to queue",
  "code": "QUEUE_ERROR",
  "timestamp": "2024-01-24T10:00:00Z"
}
```

**Resolution:**
1. Check Redis connection
2. Verify Redis has available memory
3. Restart worker if needed

### 503 Service Unavailable

#### SERVICE_UNAVAILABLE

**Description:** Required service is not available.

**Example:**
```json
{
  "error": "Service unavailable",
  "message": "Supabase not configured",
  "code": "SERVICE_UNAVAILABLE",
  "timestamp": "2024-01-24T10:00:00Z"
}
```

**Common Causes:**
- Supabase not configured
- Redis not available
- OpenAI API key missing

**Resolution:**
1. Check environment variables
2. Verify service configuration
3. Restart server if needed

## Job-Specific Errors

### Job Failed

When a job fails, the failure reason is included:

```json
{
  "jobId": "gen-123",
  "status": "failed",
  "failedReason": "Image generation failed: OpenAI API timeout",
  "attempts": 3,
  "maxAttempts": 3
}
```

**Common Failure Reasons:**

| Reason | Cause | Retry? |
|--------|-------|--------|
| OpenAI timeout | API slow/down | Yes (auto) |
| Storage upload failed | Supabase issue | Yes (auto) |
| Invalid prompt | Violates content policy | No |
| Out of memory | Image too large | No |
| Network error | Connection issue | Yes (auto) |

## Error Handling Examples

### JavaScript/TypeScript

```typescript
interface ApiError {
  error: string;
  message: string;
  code: string;
  timestamp: string;
  retryAfter?: number;
}

async function handleApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (error.response) {
      const apiError: ApiError = error.response.data;
      
      switch (apiError.code) {
        case 'RATE_LIMIT_EXCEEDED':
        case 'JOB_LIMIT_EXCEEDED':
          console.log(`Rate limited. Retry after ${apiError.retryAfter}s`);
          await sleep(apiError.retryAfter! * 1000);
          return handleApiCall(apiCall); // Retry
          
        case 'UNAUTHORIZED':
          await refreshAuthentication();
          return handleApiCall(apiCall); // Retry with new token
          
        case 'INTERNAL_ERROR':
        case 'QUEUE_ERROR':
          // Retry with exponential backoff
          await sleep(5000);
          return handleApiCall(apiCall);
          
        default:
          throw new Error(apiError.message);
      }
    }
    
    throw error;
  }
}
```

### Python

```python
import time
import requests

class ApiError(Exception):
    def __init__(self, code, message, retry_after=None):
        self.code = code
        self.message = message
        self.retry_after = retry_after
        super().__init__(message)

def api_call_with_retry(func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return func()
        except ApiError as e:
            if e.code in ['RATE_LIMIT_EXCEEDED', 'JOB_LIMIT_EXCEEDED']:
                if e.retry_after:
                    time.sleep(e.retry_after)
                    continue
            
            if e.code == 'INTERNAL_ERROR' and attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
                continue
            
            raise
    
    raise ApiError('MAX_RETRIES', 'Maximum retries exceeded')
```

## Monitoring & Alerts

### Set Up Alerts

```javascript
const THRESHOLDS = {
  failedJobs: 10,
  queueLength: 100,
  processingTime: 60000, // 1 minute
};

async function checkHealth() {
  const stats = await fetch('/api/queue/stats').then(r => r.json());
  
  if (stats.failed > THRESHOLDS.failedJobs) {
    sendAlert('High number of failed jobs', stats);
  }
  
  if (stats.waiting > THRESHOLDS.queueLength) {
    sendAlert('Queue is backed up', stats);
  }
}

setInterval(checkHealth, 60000); // Check every minute
```

## Support

If you encounter an error not listed here:

1. Check the [API Documentation](http://localhost:3001/api-docs)
2. Review server logs
3. Search [GitHub Issues](https://github.com/darshanpania/snapasset/issues)
4. Create a new issue with:
   - Error code
   - Full error response
   - Request details
   - Steps to reproduce