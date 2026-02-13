/**
 * Analytics Middleware
 * Automatically tracks API requests and user actions
 */

import { AnalyticsService } from '../services/AnalyticsService.js';

/**
 * Track API requests
 */
export const analyticsMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Track response
  res.on('finish', async () => {
    try {
      const responseTime = Date.now() - startTime;
      const analyticsService = new AnalyticsService(req.app.locals.supabase);

      // Track API call event
      if (req.user) {
        await analyticsService.trackEvent({
          user_id: req.user.id,
          session_id: req.sessionID || req.get('x-session-id'),
          event_type: 'api_call',
          event_category: 'api',
          event_action: `${req.method} ${req.path}`,
          event_value: responseTime,
          metadata: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            responseTime,
          },
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
        });
      }

      // Track performance metric
      await analyticsService.trackPerformance({
        metric_type: 'api_response',
        metric_name: `${req.method} ${req.path}`,
        value: responseTime,
        unit: 'ms',
        tags: {
          method: req.method,
          statusCode: res.statusCode,
        },
      });
    } catch (error) {
      // Don't fail the request if analytics tracking fails
      console.error('Analytics tracking error:', error);
    }
  });

  next();
};

/**
 * Track specific events
 */
export const trackEvent = (eventType, category = null) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        const analyticsService = new AnalyticsService(req.app.locals.supabase);
        
        await analyticsService.trackEvent({
          user_id: req.user.id,
          session_id: req.sessionID || req.get('x-session-id'),
          event_type: eventType,
          event_category: category,
          event_action: req.method,
          event_label: req.path,
          metadata: req.body || {},
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
        });
      }
    } catch (error) {
      console.error('Event tracking error:', error);
    }
    next();
  };
};

/**
 * Track image generation
 */
export const trackImageGeneration = async (req, res, next) => {
  try {
    if (req.user && res.locals.imageData) {
      const analyticsService = new AnalyticsService(req.app.locals.supabase);
      
      await analyticsService.trackEvent({
        user_id: req.user.id,
        session_id: req.sessionID,
        event_type: 'image_generated',
        event_category: 'generation',
        event_action: 'create',
        platform: res.locals.imageData.platform,
        metadata: {
          platform: res.locals.imageData.platform,
          size: res.locals.imageData.size,
          format: res.locals.imageData.format,
        },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
      });

      // Track platform usage
      if (res.locals.imageData.platform) {
        await analyticsService.trackPlatformUsage(
          req.user.id,
          res.locals.imageData.platform
        );
      }
    }
  } catch (error) {
    console.error('Image generation tracking error:', error);
  }
  next();
};

/**
 * Track cost
 */
export const trackCost = (provider) => {
  return async (req, res, next) => {
    try {
      if (req.user && res.locals.costData) {
        const { data, error } = await req.app.locals.supabase
          .from('cost_tracking')
          .upsert(
            {
              user_id: req.user.id,
              date: new Date().toISOString().split('T')[0],
              service_provider: provider,
              api_calls: 1,
              total_cost_usd: res.locals.costData.cost || 0,
              tokens_used: res.locals.costData.tokens || 0,
              images_generated: res.locals.costData.images || 0,
            },
            {
              onConflict: 'user_id,date,service_provider',
            }
          );

        if (error) console.error('Cost tracking error:', error);
      }
    } catch (error) {
      console.error('Cost tracking error:', error);
    }
    next();
  };
};

export default router;