# Analytics Integration Guide

Step-by-step guide to integrate analytics into your SnapAsset application.

## Quick Start

### 1. Run Database Migrations

```bash
# Run analytics migration
psql $DATABASE_URL -f server/database/migrations/002_create_analytics.sql

# Run helper functions
psql $DATABASE_URL -f server/database/functions.sql
```

### 2. Update Server Configuration

Add analytics routes to your Express server:

```javascript
// server/index.js
import analyticsRoutes from './routes/analytics.js';
import { analyticsMiddleware } from './middleware/analytics.js';

// Apply analytics middleware globally
app.use(analyticsMiddleware);

// Add analytics routes
app.use('/api/analytics', analyticsRoutes);
```

### 3. Add Analytics Context to Frontend

Wrap your app with the AnalyticsProvider:

```jsx
// src/main.jsx or src/App.jsx
import { AnalyticsProvider } from './contexts/AnalyticsContext';

function App() {
  return (
    <AnalyticsProvider>
      {/* Your app components */}
    </AnalyticsProvider>
  );
}
```

### 4. Add Analytics Dashboard Route

```jsx
import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard';
import { AdminDashboard } from './components/Analytics/AdminDashboard';

// In your router
<Route path="/analytics" element={<AnalyticsDashboard />} />
<Route path="/admin/analytics" element={<AdminDashboard />} />
```

### 5. Install Dependencies

```bash
# Client
npm install recharts jspdf jspdf-autotable date-fns

# Server
cd server
npm install compression express-rate-limit
```

## Tracking Events

### Automatic Tracking

The `analyticsMiddleware` automatically tracks:
- All API requests
- Response times
- Error rates

No additional code needed!

### Manual Event Tracking

#### In React Components

```jsx
import { useAnalytics } from '../hooks/useAnalytics';

function ImageGenerator() {
  const analytics = useAnalytics();

  const handleGenerate = async (platform, size) => {
    try {
      const image = await generateImage(platform, size);
      
      // Track successful generation
      analytics.trackImageGeneration(platform, size, 'png', {
        prompt_length: promptText.length,
        generation_time: Date.now() - startTime
      });
      
      return image;
    } catch (error) {
      // Track error
      analytics.trackError(error.message, error.stack, {
        platform,
        size
      });
    }
  };

  return <button onClick={() => handleGenerate('instagram', '1080x1080')}>Generate</button>;
}
```

#### Page View Tracking

```jsx
import { usePageTracking } from '../hooks/useAnalytics';

function Dashboard() {
  // Automatically track page view
  usePageTracking('Dashboard', { section: 'main' });

  return <div>Dashboard Content</div>;
}
```

#### Custom Events

```jsx
const analytics = useAnalytics();

// Track button click
analytics.trackAction('button_click', 'ui', 'export_button', 1, {
  location: 'header',
  format: 'pdf'
});

// Track form submission
analytics.trackAction('form_submit', 'user', 'settings_form', 1, {
  fields_changed: 3
});

// Track timing
analytics.trackTiming('api', 'image_generation', 1250, 'instagram_post');
```

### Server-side Tracking

#### Route-level Tracking

```javascript
import { trackEvent } from './middleware/analytics.js';

// Track specific route
router.post('/images',
  authMiddleware,
  trackEvent('image_generated', 'generation'),
  async (req, res) => {
    // Your handler
  }
);
```

#### Service-level Tracking

```javascript
import { AnalyticsService } from './services/AnalyticsService.js';

const analyticsService = new AnalyticsService(supabase);

// Track custom event
await analyticsService.trackEvent({
  user_id: userId,
  session_id: sessionId,
  event_type: 'batch_operation_completed',
  event_category: 'bulk',
  event_value: processedCount,
  metadata: {
    operation: 'delete',
    count: processedCount,
    duration: Date.now() - startTime
  }
});
```

## Displaying Analytics

### Full Dashboard

```jsx
import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard';

function AnalyticsPage() {
  return (
    <div>
      <AnalyticsDashboard />
    </div>
  );
}
```

### Individual Components

```jsx
import { StatCard } from './components/Analytics/StatCard';
import { UsageChart } from './components/Analytics/UsageChart';
import { PlatformChart } from './components/Analytics/PlatformChart';

function CustomDashboard({ data }) {
  return (
    <div>
      <StatCard
        title="Images Generated"
        value={data.totalImages}
        change={12.5}
        trend="up"
        icon="🖼️"
      />
      
      <UsageChart data={data.timeline} />
      
      <PlatformChart data={data.platforms} />
    </div>
  );
}
```

### Real-time Updates

```jsx
import { RealtimeUpdates } from './components/Analytics/RealtimeUpdates';

function LiveDashboard() {
  return (
    <div>
      <RealtimeUpdates />
      {/* Other components */}
    </div>
  );
}
```

## Data Aggregation

### Schedule Aggregation Jobs

Use pg_cron or a scheduled task:

```sql
-- Daily aggregation at midnight
SELECT cron.schedule(
  'aggregate-daily-usage',
  '0 0 * * *',
  $$SELECT aggregate_daily_usage()$$
);

-- Weekly retention calculation
SELECT cron.schedule(
  'calculate-retention',
  '0 0 * * 0',
  $$SELECT calculate_retention_cohorts()$$
);
```

Or use a Node.js script:

```javascript
import cron from 'node-cron';

// Run daily at midnight
cron.schedule('0 0 * * *', async () => {
  await supabase.rpc('aggregate_daily_usage');
  console.log('Daily aggregation completed');
});
```

## Testing

### Seed Test Data

```bash
cd server
node scripts/seedAnalytics.js
```

This generates:
- 300 sample events over 30 days
- Platform usage data
- Daily aggregates

### Run Tests

```bash
npm test tests/analytics.test.js
```

## Performance Optimization

### 1. Enable Query Caching

```javascript
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsDashboard />
    </QueryClientProvider>
  );
}
```

### 2. Implement Data Sampling

For high-traffic applications:

```javascript
const SAMPLE_RATE = 0.1; // Track 10% of events

if (Math.random() < SAMPLE_RATE) {
  await analyticsService.trackEvent(eventData);
}
```

### 3. Batch Event Insertion

```javascript
const eventQueue = [];

// Add to queue
eventQueue.push(event);

// Flush every 10 seconds or 100 events
if (eventQueue.length >= 100 || timeElapsed > 10000) {
  await supabase.from('analytics_events').insert(eventQueue);
  eventQueue.length = 0;
}
```

## Security Considerations

### 1. Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many analytics requests'
});

app.use('/api/analytics', analyticsLimiter);
```

### 2. Data Sanitization

```javascript
// Remove PII from metadata
const sanitizeMetadata = (metadata) => {
  const sanitized = { ...metadata };
  delete sanitized.email;
  delete sanitized.phone;
  delete sanitized.address;
  return sanitized;
};
```

### 3. IP Hashing

```javascript
import crypto from 'crypto';

const hashIP = (ip) => {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
};
```

## Troubleshooting

### Dashboard Shows No Data

**Check:**
1. Database migrations completed
2. User has generated some events
3. RLS policies allow access
4. API authentication working

**Solution:**
```bash
# Seed test data
node server/scripts/seedAnalytics.js

# Check RLS policies
psql $DATABASE_URL -c "SELECT * FROM analytics_events WHERE user_id = 'your-user-id' LIMIT 5;"
```

### Real-time Updates Not Working

**Check:**
1. Browser supports EventSource
2. CORS configured for SSE
3. Server supports streaming responses

**Solution:**
```javascript
// Add CORS headers for SSE
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
```

### Export Fails

**Check:**
1. jsPDF library installed
2. Sufficient data to export
3. Browser allows downloads

**Solution:**
```bash
npm install jspdf jspdf-autotable
```

## Best Practices

### 1. Event Naming Convention

```
{object}_{action}

Examples:
- image_generated
- project_created
- user_logged_in
- setting_updated
```

### 2. Categories

```
- generation: Image generation events
- project: Project management events
- user: User account events
- system: System-level events
- commerce: Purchase/billing events
```

### 3. Metadata Structure

```json
{
  "metadata": {
    "context": "where action happened",
    "details": "specific information",
    "timing": "performance data",
    "user_data": "non-PII user info"
  }
}
```

### 4. Error Handling

```javascript
try {
  await analytics.trackEvent(...);
} catch (error) {
  // Never fail the main operation due to analytics
  console.error('Analytics error:', error);
}
```

## Examples

### Complete Integration Example

```jsx
import React from 'react';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { useAnalytics, usePageTracking } from './hooks/useAnalytics';
import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard';

function App() {
  return (
    <AnalyticsProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
        </Routes>
      </Router>
    </AnalyticsProvider>
  );
}

function Home() {
  const analytics = useAnalytics();
  usePageTracking('Home');

  const handleAction = () => {
    analytics.trackAction('button_click', 'ui', 'cta_button');
  };

  return <button onClick={handleAction}>Get Started</button>;
}

export default App;
```

## Monitoring

### Set Up Alerts

Create a monitoring script:

```javascript
// server/scripts/monitorAnalytics.js
import { createClient } from '@supabase/supabase-js';

const checkSystemHealth = async () => {
  const { data } = await supabase.rpc('calculate_system_health');
  
  if (data.status === 'critical') {
    // Send alert (email, Slack, etc.)
    console.error('CRITICAL: System health issues detected!');
    console.error('Issues:', data.issues);
  }
};

// Run every 5 minutes
setInterval(checkSystemHealth, 5 * 60 * 1000);
```

### Dashboard Monitoring

Add health check endpoint:

```javascript
app.get('/api/health', async (req, res) => {
  const health = await supabase.rpc('calculate_system_health');
  
  res.json({
    status: health.data.status,
    score: health.data.health_score,
    issues: health.data.issues,
    timestamp: new Date().toISOString()
  });
});
```

---

**Ready to implement?** Follow this guide step by step, and you'll have a fully functional analytics system!

**Need help?** Check:
- [Analytics Documentation](./ANALYTICS.md)
- [API Documentation](./ANALYTICS_API.md)
- GitHub issues