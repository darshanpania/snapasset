import React, { useState } from 'react';
import { analyticsApi } from '../../services/analyticsApi';
import { exportToCSV } from '../../utils/analytics';
import './ExportMenu.css';

export const ExportMenu = ({ period, data }) => {
  const [exporting, setExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = async (format) => {
    try {
      setExporting(true);
      setShowMenu(false);

      if (format === 'csv' && data) {
        // Export current view data as CSV
        exportToCSV(data.dailyUsage || data.timeline || [], 'analytics');
      } else if (format === 'json' || format === 'pdf') {
        // Export via API
        const blob = await analyticsApi.exportAnalytics(period, format);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="export-menu">
      <button
        className="export-btn"
        onClick={() => setShowMenu(!showMenu)}
        disabled={exporting}
      >
        {exporting ? 'Exporting...' : '📥 Export'}
      </button>

      {showMenu && (
        <div className="export-dropdown">
          <button onClick={() => handleExport('json')}>
            <span className="format-icon">📝</span>
            <span>
              <strong>JSON</strong>
              <small>Complete data export</small>
            </span>
          </button>
          <button onClick={() => handleExport('csv')}>
            <span className="format-icon">📊</span>
            <span>
              <strong>CSV</strong>
              <small>Spreadsheet format</small>
            </span>
          </button>
          <button onClick={() => handleExport('pdf')}>
            <span className="format-icon">📄</span>
            <span>
              <strong>PDF</strong>
              <small>Printable report</small>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};