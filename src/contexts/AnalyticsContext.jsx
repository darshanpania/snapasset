/**
 * Analytics Context
 * Global analytics state and tracking
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSessionId } from '../utils/analytics';
import { analyticsApi } from '../services/analyticsApi';

const AnalyticsContext = createContext();

export const useAnalyticsContext = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within AnalyticsProvider');
  }
  return context;
};

export const AnalyticsProvider = ({ children }) => {
  const [sessionId] = useState(() => getSessionId());
  const [tracking, setTracking] = useState(true);
  const [realtimeStats, setRealtimeStats] = useState(null);

  useEffect(() => {
    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        trackEvent('session_resume', 'session');
      } else {
        trackEvent('session_pause', 'session');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track session start
    trackEvent('session_start', 'session');

    // Track session end on beforeunload
    const handleBeforeUnload = () => {
      trackEvent('session_end', 'session');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const trackEvent = async (eventType, category, metadata = {}) => {
    if (!tracking) return;

    try {
      await analyticsApi.trackEvent({
        event_type: eventType,
        event_category: category,
        session_id: sessionId,
        metadata,
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  };

  const value = {
    sessionId,
    tracking,
    setTracking,
    trackEvent,
    realtimeStats,
    setRealtimeStats,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};