/**
 * Analytics API Client
 * Handles all analytics-related API calls
 */

import apiClient from './api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const analyticsApi = {
  /**
   * Get user dashboard analytics
   */
  getDashboard: async (period = '30d') => {
    return apiClient.get(`/analytics/dashboard?period=${period}`);
  },

  /**
   * Get usage timeline
   */
  getTimeline: async (period = '30d', granularity = 'day') => {
    return apiClient.get(`/analytics/timeline?period=${period}&granularity=${granularity}`);
  },

  /**
   * Get platform breakdown
   */
  getPlatforms: async (period = '30d') => {
    return apiClient.get(`/analytics/platforms?period=${period}`);
  },

  /**
   * Get engagement metrics
   */
  getEngagement: async (weeks = 12) => {
    return apiClient.get(`/analytics/engagement?weeks=${weeks}`);
  },

  /**
   * Get cost analytics
   */
  getCosts: async (period = '30d') => {
    return apiClient.get(`/analytics/costs?period=${period}`);
  },

  /**
   * Get performance metrics
   */
  getPerformance: async (type = null, hours = 24) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    params.append('hours', hours);
    return apiClient.get(`/analytics/performance?${params.toString()}`);
  },

  /**
   * Track custom event
   */
  trackEvent: async (eventData) => {
    return apiClient.post('/analytics/track', eventData);
  },

  /**
   * Export analytics data
   */
  exportAnalytics: async (period = '30d', format = 'json') => {
    const response = await fetch(
      `${API_BASE}/analytics/export?period=${period}&format=${format}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return await response.blob();
  },

  /**
   * Get admin dashboard (requires admin role)
   */
  getAdminDashboard: async (period = '30d') => {
    return apiClient.get(`/analytics/admin/dashboard?period=${period}`);
  },

  /**
   * Connect to realtime analytics stream
   */
  connectRealtime: (onMessage, onError) => {
    const token = localStorage.getItem('token');
    const eventSource = new EventSource(
      `${API_BASE}/analytics/realtime`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Failed to parse realtime data:', error);
      }
    };

    eventSource.onerror = (error) => {
      onError?.(error);
      eventSource.close();
    };

    return eventSource;
  },
};

export default analyticsApi;