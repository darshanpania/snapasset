# Analytics API Documentation

Complete API reference for SnapAsset Analytics.

## Base URL

```
https://api.snapasset.app/analytics
```

## Authentication

All endpoints require JWT authentication:

```http
Authorization: Bearer {token}
```

## Endpoints

### User Analytics

---

#### GET /dashboard

Get comprehensive dashboard analytics for the authenticated user.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| period | string | 30d | Time period (7d, 30d, 90d, 6m, 1y, all) |

**Response:**

```json
{
  "success": true,
  "data": {
    "overview": {
      "total_images_generated": 150,
      "total_images_downloaded": 120,
      "total_projects_created": 8,
      "storage_used_bytes": 47185920,
      "storage_used_mb": "45.00",
      "storage_used_gb": "0.04",
      "total_api_calls": 300,
      "total_active_time_seconds": 7200,
      "total_active_time_hours": "2.00",
      "last_active_at": "2026-02-01T10:30:00Z"
    },
    "dailyUsage": [
      {
        "date": "2026-01-01",
        "images_generated": 5,
        "images_downloaded": 4,
        "projects_created": 1,
        "api_calls": 15,
        "unique_sessions": 2
      }
    ],
    "platformUsage": [
      {
        "platform": "instagram",
        "usage_count": 45,
        "last_used_at": "2026-02-01T10:00:00Z"
      }
    ],
    "costAnalysis": {
      "totalCost": "12.5000",
      "averageCostPerDay": "0.4167",
      "costByProvider": [
        {
          "provider": "openai",
          "cost": 8.5,
          "calls": 100,
          "images": 75
        }
      ],
      "timeline": [...]
    },
    "trends": {
      "imagesGenerated": {
        "value": 80,
        "change": "12.5",
        "trend": "up"
      }
    },
    "period": {
      "days": 30,
      "startDate": "2026-01-01T00:00:00Z",
      "endDate": "2026-02-01T00:00:00Z"
    }
  }
}
```

---

#### GET /timeline

Get usage timeline data.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| period | string | 30d | Time period |
| granularity | string | day | day, week, month |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "date": "2026-01-01",
      "images": 5,
      "downloads": 4,
      "projects": 1,
      "apiCalls": 15,
      "sessions": 2
    }
  ]
}
```

---

#### GET /platforms

Get platform usage breakdown.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "platform": "instagram",
      "count": 45
    },
    {
      "platform": "facebook",
      "count": 30
    }
  ]
}
```

---

#### GET /engagement

Get user engagement metrics.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| weeks | number | 12 | Number of weeks |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "week_start_date": "2026-01-20",
      "days_active": 5,
      "sessions_count": 12,
      "total_actions": 45,
      "retention_cohort": "active"
    }
  ]
}
```

---

#### GET /costs

Get cost analytics.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalCost": "12.5000",
    "averageCostPerDay": "0.4167",
    "costByProvider": [...],
    "timeline": [...]
  }
}
```

---

#### GET /performance

Get performance metrics.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| type | string | null | Filter by metric type |
| hours | number | 24 | Time range in hours |

**Response:**

```json
{
  "success": true,
  "data": {
    "average": "250.50",
    "min": 45,
    "max": 1250,
    "p50": 200,
    "p95": 850,
    "p99": 1100,
    "count": 5000,
    "unit": "ms"
  }
}
```

---

#### POST /track

Track a custom analytics event.

**Request Body:**

```json
{
  "event_type": "custom_action",
  "event_category": "user",
  "event_action": "clicked_button",
  "event_label": "export_data",
  "event_value": 1,
  "platform": "web",
  "metadata": {
    "button_id": "export-btn",
    "page": "dashboard"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "event-uuid",
    "created_at": "2026-02-01T10:30:00Z"
  }
}
```

---

#### GET /export

Export analytics data.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| format | string | json | json, csv, pdf |
| period | string | 30d | Time period |

**Response:**

Downloads file in requested format.

---

#### GET /realtime

Server-Sent Events stream for real-time analytics.

**Connection:**

```javascript
const eventSource = new EventSource(
  '/api/analytics/realtime',
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};
```

**Event Data:**

```json
{
  "lastHour": {
    "image_generated": 5,
    "image_downloaded": 3,
    "api_call": 25
  },
  "recentEvents": [...],
  "timestamp": "2026-02-01T10:30:00Z"
}
```

---

### Admin Analytics

#### GET /admin/dashboard

Get system-wide analytics (admin only).

**Authorization**: Requires admin role

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| period | string | 30d | Time period |

**Response:**

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 1000,
      "activeUsers": 350,
      "period": "30 days"
    },
    "systemMetrics": [
      {
        "metric_date": "2026-02-01",
        "total_users": 1000,
        "active_users": 350,
        "new_users": 25,
        "total_images": 15000,
        "total_projects": 1200,
        "average_response_time_ms": 250,
        "error_rate": 0.02,
        "storage_used_gb": 125.5,
        "total_cost_usd": 450.25
      }
    ],
    "topUsers": [
      {
        "user_id": "uuid",
        "email": "user@example.com",
        "total_images_generated": 500,
        "total_projects_created": 25,
        "this_month_cost_usd": 15.50
      }
    ],
    "retention": {
      "breakdown": {
        "active": 200,
        "engaged": 100,
        "at_risk": 30,
        "churned": 20
      },
      "percentages": {
        "active": "57.1",
        "engaged": "28.6",
        "at_risk": "8.6",
        "churned": "5.7"
      },
      "total": 350
    }
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Invalid period format"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": "Admin access required"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Failed to load analytics data"
}
```

## Rate Limits

- Dashboard: 60 requests/minute
- Track event: 1000 requests/minute
- Export: 10 requests/hour
- Real-time: 1 connection per user

## Code Examples

### JavaScript/React

```javascript
import { analyticsApi } from './services/analyticsApi';

// Get dashboard
const dashboard = await analyticsApi.getDashboard('30d');

// Track event
await analyticsApi.trackEvent({
  event_type: 'button_click',
  event_category: 'user',
  metadata: { button: 'export' }
});

// Export data
const blob = await analyticsApi.exportAnalytics('30d', 'csv');

// Real-time connection
const eventSource = analyticsApi.connectRealtime(
  (data) => console.log('Update:', data),
  (error) => console.error('Error:', error)
);
```

### cURL

```bash
# Get dashboard
curl -H "Authorization: Bearer {token}" \
  https://api.snapasset.app/analytics/dashboard?period=30d

# Track event
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"custom","event_category":"test"}' \
  https://api.snapasset.app/analytics/track

# Export
curl -H "Authorization: Bearer {token}" \
  https://api.snapasset.app/analytics/export?format=csv \
  -o analytics.csv
```

---

**Need help?** Check the main [Analytics Documentation](./ANALYTICS.md)