/**
 * useAnalytics Hook
 * Custom React hook for analytics tracking
 */

import { useEffect, useCallback } from 'react';
import { analyticsApi } from '../services/analyticsApi';

export const useAnalytics = () => {
  /**
   * Track page view
   */
  const trackPageView = useCallback((pageName, metadata = {}) => {
    analyticsApi.trackEvent({
      event_type: 'page_view',
      event_category: 'navigation',
      event_action: 'view',
      event_label: pageName,
      metadata,
    }).catch((error) => {
      console.error('Failed to track page view:', error);
    });
  }, []);

  /**
   * Track user action
   */
  const trackAction = useCallback((action, category, label = '', value = 0, metadata = {}) => {
    analyticsApi.trackEvent({
      event_type: action,
      event_category: category,
      event_action: action,
      event_label: label,
      event_value: value,
      metadata,
    }).catch((error) => {
      console.error('Failed to track action:', error);
    });
  }, []);

  /**
   * Track image generation
   */
  const trackImageGeneration = useCallback((platform, size, format, metadata = {}) => {
    analyticsApi.trackEvent({
      event_type: 'image_generated',
      event_category: 'generation',
      event_action: 'create',
      platform,
      metadata: {
        platform,
        size,
        format,
        ...metadata,
      },
    }).catch((error) => {
      console.error('Failed to track image generation:', error);
    });
  }, []);

  /**
   * Track image download
   */
  const trackImageDownload = useCallback((imageId, platform, metadata = {}) => {
    analyticsApi.trackEvent({
      event_type: 'image_downloaded',
      event_category: 'generation',
      event_action: 'download',
      event_label: imageId,
      platform,
      metadata,
    }).catch((error) => {
      console.error('Failed to track download:', error);
    });
  }, []);

  /**
   * Track project action
   */
  const trackProjectAction = useCallback((action, projectId, metadata = {}) => {
    analyticsApi.trackEvent({
      event_type: `project_${action}`,
      event_category: 'project',
      event_action: action,
      event_label: projectId,
      metadata,
    }).catch((error) => {
      console.error('Failed to track project action:', error);
    });
  }, []);

  /**
   * Track error
   */
  const trackError = useCallback((errorMessage, errorStack, metadata = {}) => {
    analyticsApi.trackEvent({
      event_type: 'error',
      event_category: 'system',
      event_action: 'error_occurred',
      event_label: errorMessage,
      metadata: {
        message: errorMessage,
        stack: errorStack,
        ...metadata,
      },
    }).catch((error) => {
      console.error('Failed to track error:', error);
    });
  }, []);

  /**
   * Track timing
   */
  const trackTiming = useCallback((category, variable, time, label = '') => {
    analyticsApi.trackEvent({
      event_type: 'timing',
      event_category: category,
      event_action: variable,
      event_label: label,
      event_value: time,
      metadata: {
        timing: time,
      },
    }).catch((error) => {
      console.error('Failed to track timing:', error);
    });
  }, []);

  return {
    trackPageView,
    trackAction,
    trackImageGeneration,
    trackImageDownload,
    trackProjectAction,
    trackError,
    trackTiming,
  };
};

/**
 * Hook to track component mount time
 */
export const useComponentTiming = (componentName) => {
  const { trackTiming } = useAnalytics();

  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const mountTime = performance.now() - startTime;
      trackTiming('component', 'mount_time', Math.round(mountTime), componentName);
    };
  }, [componentName, trackTiming]);
};

/**
 * Hook to track page views automatically
 */
export const usePageTracking = (pageName, metadata = {}) => {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView(pageName, metadata);
  }, [pageName, trackPageView]);
};