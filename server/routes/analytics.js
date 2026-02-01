/**
 * Analytics Routes
 * API endpoints for analytics data
 */

import express from 'express';
import { AnalyticsService } from '../services/AnalyticsService.js';
import { authMiddleware } from '../middleware/auth.js';
import { analyticsMiddleware } from '../middleware/analytics.js';
import { isAdmin } from '../middleware/admin.js';

const router = express.Router();

// Apply authentication middleware
router.use(authMiddleware);

/**
 * @route GET /api/analytics/dashboard
 * @desc Get user dashboard analytics
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const analyticsService = new AnalyticsService(req.app.locals.supabase);

    const dashboard = await analyticsService.getUserDashboard(req.user.id, period);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route GET /api/analytics/timeline
 * @desc Get usage timeline data
 */
router.get('/timeline', async (req, res) => {
  try {
    const { period = '30d', granularity = 'day' } = req.query;
    const analyticsService = new AnalyticsService(req.app.locals.supabase);

    const timeline = await analyticsService.getUsageTimeline(
      req.user.id,
      period,
      granularity
    );

    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route GET /api/analytics/platforms
 * @desc Get platform usage breakdown
 */
router.get('/platforms', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const analyticsService = new AnalyticsService(req.app.locals.supabase);

    const platforms = await analyticsService.getPlatformBreakdown(req.user.id, period);

    res.json({
      success: true,
      data: platforms,
    });
  } catch (error) {
    console.error('Get platforms error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route GET /api/analytics/engagement
 * @desc Get user engagement metrics
 */
router.get('/engagement', async (req, res) => {
  try {
    const { weeks = 12 } = req.query;
    const analyticsService = new AnalyticsService(req.app.locals.supabase);

    const engagement = await analyticsService.getUserEngagement(
      req.user.id,
      parseInt(weeks)
    );

    res.json({
      success: true,
      data: engagement,
    });
  } catch (error) {
    console.error('Get engagement error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route GET /api/analytics/costs
 * @desc Get cost analytics
 */
router.get('/costs', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const analyticsService = new AnalyticsService(req.app.locals.supabase);

    const costs = await analyticsService.getCostAnalytics(req.user.id, period);

    res.json({
      success: true,
      data: costs,
    });
  } catch (error) {
    console.error('Get costs error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route GET /api/analytics/performance
 * @desc Get performance metrics
 */
router.get('/performance', async (req, res) => {
  try {
    const { type, hours = 24 } = req.query;
    const analyticsService = new AnalyticsService(req.app.locals.supabase);

    const metrics = await analyticsService.getPerformanceMetrics(type, parseInt(hours));

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route POST /api/analytics/track
 * @desc Track a custom analytics event
 */
router.post('/track', async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      user_id: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    };

    const analyticsService = new AnalyticsService(req.app.locals.supabase);
    const event = await analyticsService.trackEvent(eventData);

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Track event error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route GET /api/analytics/export
 * @desc Export analytics data
 */
router.get('/export', async (req, res) => {
  try {
    const { format = 'json', period = '30d' } = req.query;
    const analyticsService = new AnalyticsService(req.app.locals.supabase);

    const exportData = await analyticsService.exportAnalytics(req.user.id, format, period);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${Date.now()}.csv"`);
      res.send(exportData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${Date.now()}.json"`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route GET /api/analytics/realtime
 * @desc Get real-time analytics via Server-Sent Events
 */
router.get('/realtime', async (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const analyticsService = new AnalyticsService(req.app.locals.supabase);

  // Send initial data
  const sendUpdate = async () => {
    try {
      const stats = await analyticsService.getRealtimeStats(req.user.id);
      res.write(`data: ${JSON.stringify(stats)}\n\n`);
    } catch (error) {
      console.error('Realtime update error:', error);
    }
  };

  // Send updates every 5 seconds
  const interval = setInterval(sendUpdate, 5000);

  // Send initial update
  sendUpdate();

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

/**
 * @route GET /api/analytics/admin/dashboard
 * @desc Get admin dashboard (system-wide analytics)
 * @access Admin only
 */
router.get('/admin/dashboard', isAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const analyticsService = new AnalyticsService(req.app.locals.supabase);

    const adminDashboard = await analyticsService.getAdminDashboard(period);

    res.json({
      success: true,
      data: adminDashboard,
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;