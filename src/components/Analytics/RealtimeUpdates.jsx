import React, { useState, useEffect, useRef } from 'react';
import './RealtimeUpdates.css';

export const RealtimeUpdates = () => {
  const [stats, setStats] = useState(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    connectToRealtime();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const connectToRealtime = () => {
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const eventSource = new EventSource(
      `${apiUrl}/analytics/realtime`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setStats(data);
      } catch (error) {
        console.error('Failed to parse realtime data:', error);
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
      eventSource.close();
      
      // Reconnect after 5 seconds
      setTimeout(() => {
        connectToRealtime();
      }, 5000);
    };

    eventSourceRef.current = eventSource;
  };

  if (!stats) {
    return null;
  }

  const { lastHour } = stats;
  const totalEvents = Object.values(lastHour).reduce((sum, count) => sum + count, 0);

  return (
    <div className="realtime-updates">
      <div className="realtime-header">
        <div className="realtime-title">
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
          <span>Live Activity (Last Hour)</span>
        </div>
        <span className="event-count">{totalEvents} events</span>
      </div>
      <div className="realtime-events">
        {Object.entries(lastHour).map(([type, count]) => (
          <div key={type} className="realtime-event">
            <span className="event-type">{type.replace('_', ' ')}</span>
            <span className="event-count-badge">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};