# Analytics Dashboard Documentation

Comprehensive guide to the SnapAsset Analytics Dashboard.

## Overview

The analytics system provides:
- **User Analytics**: Personal usage statistics and insights
- **Performance Monitoring**: System performance metrics
- **Cost Tracking**: API cost analysis and optimization
- **Engagement Metrics**: User retention and engagement analysis
- **Admin Dashboard**: System-wide analytics for administrators
- **Real-time Updates**: Live activity tracking via Server-Sent Events
- **Export Capabilities**: Download data in JSON, CSV, or PDF format

## Architecture

```
User Action → Analytics Middleware → Event Tracking → Database
                                            ↓
                                    Aggregation Jobs
                                            ↓
                              Daily/Weekly Summaries
                                            ↓
                                  Analytics Dashboard
                                            ↓
                              Charts & Visualizations
```

## Database Schema

### Tables

#### 1. `analytics_events`
Stores all user events and actions.

```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES auth.users
session_id        VARCHAR(255)
event_type        VARCHAR(50)  -- image_generated, page_view, etc.
event_category    VARCHAR(50)  -- generation, project, user, system
event_action      VARCHAR(100)
event_label       VARCHAR(255)
event_value       NUMERIC
metadata          JSONB
ip_address        INET
user_agent        TEXT
referrer          TEXT
platform          VARCHAR(100)
created_at        TIMESTAMP
```

#### 2. `user_usage_stats`
Aggregated user-level statistics.

```sql
id                           UUID PRIMARY KEY
user_id                      UUID UNIQUE REFERENCES auth.users
total_images_generated       INTEGER
total_images_downloaded      INTEGER
total_projects_created       INTEGER
storage_used_bytes          BIGINT
total_api_calls             INTEGER
total_active_time_seconds   INTEGER
last_active_at              TIMESTAMP
created_at                  TIMESTAMP
updated_at                  TIMESTAMP
```

#### 3. `daily_usage_aggregates`
Daily aggregated usage per user.

```sql
id                    UUID PRIMARY KEY
user_id               UUID REFERENCES auth.users
date                  DATE
images_generated      INTEGER
images_downloaded     INTEGER
projects_created      INTEGER
api_calls             INTEGER
active_time_seconds   INTEGER
unique_sessions       INTEGER
created_at            TIMESTAMP
```

#### 4. `platform_usage_stats`
Track platform-specific usage.

```sql
id             UUID PRIMARY KEY
user_id        UUID REFERENCES auth.users
platform       VARCHAR(100)
usage_count    INTEGER
last_used_at   TIMESTAMP
created_at     TIMESTAMP
updated_at     TIMESTAMP
```

#### 5. `cost_tracking`
API cost tracking.

```sql
id                  UUID PRIMARY KEY
user_id             UUID REFERENCES auth.users
date                DATE
service_provider    VARCHAR(50)
api_calls           INTEGER
total_cost_usd      NUMERIC(10, 4)
tokens_used         INTEGER
images_generated    INTEGER
metadata            JSONB
created_at          TIMESTAMP
```

#### 6. `performance_metrics`
System performance tracking.

```sql
id            UUID PRIMARY KEY
metric_type   VARCHAR(50)
metric_name   VARCHAR(100)
value         NUMERIC
unit          VARCHAR(20)
tags          JSONB
created_at    TIMESTAMP
```

#### 7. `user_engagement`
User engagement and retention.

```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES auth.users
week_start_date   DATE
days_active       INTEGER
sessions_count    INTEGER
total_actions     INTEGER
features_used     TEXT[]
retention_cohort  VARCHAR(20)
created_at        TIMESTAMP
```

#### 8. `system_metrics`
System-wide metrics for admin.

```sql
id                       UUID PRIMARY KEY
metric_date              DATE UNIQUE
total_users              INTEGER
active_users             INTEGER
new_users                INTEGER
total_images             INTEGER
total_projects           INTEGER
total_api_calls          INTEGER
average_response_time_ms NUMERIC
error_rate               NUMERIC
storage_used_gb          NUMERIC
total_cost_usd           NUMERIC
metadata                 JSONB
created_at               TIMESTAMP
```

## API Endpoints

### User Analytics

#### GET `/api/analytics/dashboard`
Get user dashboard analytics.

**Query Parameters:**
- `period` - Time period (7d, 30d, 90d, 1y, all)

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_images_generated": 150,
      "total_images_downloaded": 120,
      "storage_used_mb": 45.2,
      "total_api_calls": 300
    },
    "dailyUsage": [...],
    "platformUsage": [...],
    "costAnalysis": {...},
    "trends": {...}
  }
}
```

#### GET `/api/analytics/timeline`
Get usage timeline data.

**Query Parameters:**
- `period` - Time period
- `granularity` - day, week, month

#### GET `/api/analytics/platforms`
Get platform usage breakdown.

#### GET `/api/analytics/engagement`
Get user engagement metrics.

**Query Parameters:**
- `weeks` - Number of weeks (default: 12)

#### GET `/api/analytics/costs`
Get cost analytics.

#### GET `/api/analytics/performance`
Get performance metrics.

**Query Parameters:**
- `type` - Metric type filter
- `hours` - Time range in hours

#### POST `/api/analytics/track`
Track a custom event.

**Body:**
```json
{
  "event_type": "custom_action",
  "event_category": "user",
  "event_action": "clicked_button",
  "metadata": {}
}
```

#### GET `/api/analytics/export`
Export analytics data.

**Query Parameters:**
- `format` - json, csv, pdf
- `period` - Time period

#### GET `/api/analytics/realtime`
Server-Sent Events stream for real-time updates.

### Admin Analytics

#### GET `/api/analytics/admin/dashboard`
Get system-wide analytics (admin only).

**Query Parameters:**
- `period` - Time period

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 1000,
      "activeUsers": 350
    },
    "systemMetrics": [...],
    "topUsers": [...],
    "retention": {...}
  }
}
```

## Frontend Components

### AnalyticsDashboard

Main analytics dashboard component.

```jsx
import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard';

function App() {
  return <AnalyticsDashboard />;
}
```

**Features:**
- Overview tab with key metrics
- Usage tab with detailed charts
- Costs tab with cost analysis
- Engagement tab with retention metrics
- Performance tab with system health
- Real-time updates
- Export functionality

### AdminDashboard

Admin dashboard for system-wide analytics.

```jsx
import { AdminDashboard } from './components/Analytics/AdminDashboard';

function AdminPanel() {
  return <AdminDashboard />;
}
```

### Individual Components

#### StatCard
Display key metric with trend.

```jsx
<StatCard
  title="Images Generated"
  value={150}
  change={12.5}
  trend="up"
  icon="🖼️"
/>
```

#### UsageChart
Line/Area chart for usage timeline.

```jsx
<UsageChart data={dailyUsage} detailed={true} />
```

#### PlatformChart
Pie chart for platform distribution.

```jsx
<PlatformChart data={platformUsage} />
```

#### CostAnalytics
Cost analysis with recommendations.

```jsx
<CostAnalytics data={costAnalysis} period="30d" />
```

#### EngagementMetrics
User engagement and retention.

```jsx
<EngagementMetrics userId={user.id} />
```

#### PerformanceMonitor
System performance metrics.

```jsx
<PerformanceMonitor />
```

#### RealtimeUpdates
Live activity display.

```jsx
<RealtimeUpdates />
```

## Usage

### Tracking Events

Use the `useAnalytics` hook:

```jsx
import { useAnalytics } from '../hooks/useAnalytics';

function MyComponent() {
  const analytics = useAnalytics();

  const handleImageGenerate = () => {
    analytics.trackImageGeneration('instagram', '1080x1080', 'png');
  };

  const handlePageView = () => {
    analytics.trackPageView('Dashboard');
  };

  return (
    <button onClick={handleImageGenerate}>Generate Image</button>
  );
}
```

### Automatic Tracking

Use the middleware for automatic API tracking:

```javascript
// In server/index.js
import { analyticsMiddleware } from './middleware/analytics.js';

app.use(analyticsMiddleware);
```

### Real-time Updates

Connect to real-time stream:

```jsx
import { useEffect, useState } from 'react';
import { analyticsApi } from '../services/analyticsApi';

function RealtimeComponent() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const eventSource = analyticsApi.connectRealtime(
      (data) => setStats(data),
      (error) => console.error(error)
    );

    return () => eventSource.close();
  }, []);

  return <div>{JSON.stringify(stats)}</div>;
}
```

## Configuration

### Environment Variables

```env
# Analytics Configuration
VITE_ANALYTICS_ENABLED=true
VITE_ANALYTICS_SAMPLE_RATE=1.0  # 1.0 = 100% sampling

# Real-time Updates
VITE_REALTIME_ENABLED=true
VITE_REALTIME_INTERVAL=5000  # Update interval in ms
```

### Database Aggregation

Schedule aggregation jobs:

```sql
-- Run daily at midnight
SELECT cron.schedule(
  'aggregate-daily-usage',
  '0 0 * * *',
  $$SELECT aggregate_daily_usage()$$
);

-- Run weekly on Sunday
SELECT cron.schedule(
  'calculate-retention',
  '0 0 * * 0',
  $$SELECT calculate_retention_cohorts()$$
);
```

## Features

### 1. Usage Analytics

**Tracks:**
- Images generated
- Images downloaded
- Projects created
- API calls
- Active time
- Session count

**Visualizations:**
- Line charts for trends
- Area charts for cumulative data
- Activity heatmap (GitHub-style)

### 2. Platform Analytics

**Tracks:**
- Most used platforms
- Usage distribution
- Platform trends over time

**Visualizations:**
- Pie chart for distribution
- Bar chart for comparison
- Top platforms list

### 3. Cost Analytics

**Tracks:**
- Total costs per period
- Cost per image
- Cost by provider
- Cost trends

**Features:**
- Cost optimization recommendations
- Provider comparison
- Budget alerts (future)

### 4. Engagement Metrics

**Tracks:**
- Days active per week
- Session frequency
- Feature usage
- Retention cohorts:
  - **Active**: 5+ days/week
  - **Engaged**: 2-4 days/week
  - **At Risk**: 1 day/week
  - **Churned**: 0 days/week

### 5. Performance Monitoring

**Tracks:**
- API response times
- Error rates
- Request volume
- System health

**Metrics:**
- Average response time
- P50, P95, P99 percentiles
- Min/Max values
- Request count

### 6. Real-time Updates

**Features:**
- Live event counter
- Last hour activity
- Connection status indicator
- Auto-reconnect on disconnect

### 7. Admin Dashboard

**System Metrics:**
- Total users
- Active users
- New user signups
- Total images/projects
- System costs
- Storage usage

**User Insights:**
- Top users by activity
- User retention breakdown
- Churn analysis
- Growth trends

### 8. Export Functionality

**Formats:**
- **JSON**: Complete data export
- **CSV**: Spreadsheet-compatible
- **PDF**: Formatted report

**Includes:**
- Overview statistics
- Timeline data
- Platform breakdown
- Cost analysis
- Charts (PDF only)

## Event Types

### User Events
- `session_start` - User session begins
- `session_end` - User session ends
- `page_view` - Page navigation
- `image_generated` - Image created
- `image_downloaded` - Image downloaded
- `project_created` - New project
- `project_updated` - Project modified
- `project_deleted` - Project removed

### System Events
- `api_call` - API request made
- `error` - Error occurred
- `timing` - Performance timing

## Tracking Implementation

### Automatic Tracking

The `analyticsMiddleware` automatically tracks:
- All API requests
- Response times
- Error rates
- User sessions

### Manual Tracking

Use the `useAnalytics` hook:

```jsx
const { trackPageView, trackAction } = useAnalytics();

// Track page view
trackPageView('Dashboard');

// Track custom action
trackAction('button_click', 'user', 'export_button');

// Track with value
trackAction('purchase', 'commerce', 'premium_plan', 29.99);
```

### Server-side Tracking

```javascript
import { trackEvent } from './middleware/analytics.js';

// Use as middleware
router.post('/images', trackEvent('image_generated', 'generation'), handler);

// Or manually
analyticsService.trackEvent({
  user_id: userId,
  event_type: 'custom_event',
  event_category: 'category',
  metadata: { key: 'value' }
});
```

## Performance Optimization

### Indexing

All analytics tables have indexes on:
- `user_id` for user-specific queries
- `created_at` for time-based queries
- `event_type` for filtering
- `date` for aggregates

### Aggregation

Daily aggregation reduces query load:
- Events aggregated nightly
- Reduces table size
- Faster dashboard queries

### Caching

Implement caching for:
- Dashboard data (5 minutes)
- Platform stats (15 minutes)
- System metrics (30 minutes)

## Security

### Row Level Security (RLS)

All analytics tables have RLS:
- Users can only view their own data
- Admins can view system metrics
- No cross-user data leakage

### Data Privacy

- IP addresses hashed before storage
- No PII in event metadata
- Data retention policies (90 days for events)
- GDPR compliance ready

## Best Practices

### 1. Event Naming

Use consistent naming:
```javascript
// Good
event_type: 'image_generated'
event_category: 'generation'

// Avoid
event_type: 'imgGen'
event_category: 'misc'
```

### 2. Metadata

Include useful context:
```javascript
metadata: {
  platform: 'instagram',
  size: '1080x1080',
  format: 'png',
  processing_time: 1250
}
```

### 3. Sampling

For high-volume events, use sampling:
```javascript
if (Math.random() < 0.1) { // 10% sample
  trackEvent(...);
}
```

### 4. Batch Updates

Batch analytics updates for performance:
```javascript
// Collect events
const events = [];
events.push(event1, event2, event3);

// Batch insert
await supabase.from('analytics_events').insert(events);
```

## Monitoring & Alerts

### Set Up Alerts

1. **High Error Rate**
   - Trigger: Error rate > 5%
   - Action: Notify admins

2. **Slow Response Times**
   - Trigger: P95 > 1000ms
   - Action: Investigate performance

3. **High Costs**
   - Trigger: Daily cost > $X
   - Action: Review usage patterns

4. **Low Engagement**
   - Trigger: Active users < 30%
   - Action: Send re-engagement emails

## Troubleshooting

### Issue: Dashboard Not Loading

**Possible Causes:**
- Missing analytics data
- Database connection issue
- RLS policy blocking access

**Solutions:**
1. Check browser console for errors
2. Verify user is authenticated
3. Check database has data
4. Verify RLS policies

### Issue: Real-time Updates Not Working

**Possible Causes:**
- SSE connection blocked
- CORS issues
- Token expired

**Solutions:**
1. Check browser supports EventSource
2. Verify CORS headers
3. Check authentication token
4. Look for firewall/proxy blocking SSE

### Issue: Export Fails

**Possible Causes:**
- Too much data
- Format not supported
- Permission denied

**Solutions:**
1. Reduce time period
2. Try different format
3. Check user permissions
4. Review server logs

## Performance Benchmarks

### Target Metrics

- Dashboard load time: < 2 seconds
- Chart render time: < 500ms
- Real-time update latency: < 1 second
- Export generation: < 5 seconds

### Optimization Tips

1. **Limit data points**: Show max 90 days on charts
2. **Lazy load charts**: Load charts as user scrolls
3. **Debounce filters**: Wait for user to finish typing
4. **Cache API responses**: Use React Query or SWR
5. **Virtualize lists**: For long activity lists

## Future Enhancements

- [ ] Predictive analytics with ML
- [ ] Custom dashboard builder
- [ ] Scheduled email reports
- [ ] Goal tracking and alerts
- [ ] Comparison with previous periods
- [ ] Funnel analysis
- [ ] A/B testing integration
- [ ] Cohort analysis
- [ ] Custom event definitions
- [ ] Data warehouse integration

## Support

For issues or questions:
1. Check this documentation
2. Review API endpoint responses
3. Check browser console for errors
4. Create an issue with details

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Maintained by**: Darshan Pania