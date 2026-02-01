/**
 * Analytics Utilities
 * Helper functions for analytics data processing
 */

/**
 * Format bytes to human-readable size
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format number with abbreviation (K, M, B)
 */
export const formatNumber = (num) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num?.toString();
};

/**
 * Calculate percentage change
 */
export const calculatePercentageChange = (oldValue, newValue) => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

/**
 * Get trend direction
 */
export const getTrendDirection = (change) => {
  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
};

/**
 * Format currency
 */
export const formatCurrency = (amount, currency = 'USD', decimals = 2) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
};

/**
 * Generate date range
 */
export const generateDateRange = (days) => {
  const dates = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
};

/**
 * Fill missing dates in timeline data
 */
export const fillMissingDates = (data, days) => {
  const dateRange = generateDateRange(days);
  const dataMap = new Map(data.map((item) => [item.date, item]));

  return dateRange.map((date) => {
    if (dataMap.has(date)) {
      return dataMap.get(date);
    }
    return {
      date,
      images: 0,
      downloads: 0,
      projects: 0,
      apiCalls: 0,
    };
  });
};

/**
 * Calculate growth rate
 */
export const calculateGrowthRate = (data, metric) => {
  if (!data || data.length < 2) return 0;

  const first = data[0][metric] || 0;
  const last = data[data.length - 1][metric] || 0;

  return calculatePercentageChange(first, last);
};

/**
 * Get color for metric value
 */
export const getMetricColor = (value, thresholds) => {
  if (value >= thresholds.excellent) return '#10b981';
  if (value >= thresholds.good) return '#3b82f6';
  if (value >= thresholds.warning) return '#f59e0b';
  return '#ef4444';
};

/**
 * Parse period string to days
 */
export const parsePeriod = (period) => {
  const match = period.match(/(\d+)([dhwmy])/);
  if (!match) return 30;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'd': return value;
    case 'w': return value * 7;
    case 'm': return value * 30;
    case 'y': return value * 365;
    case 'h': return Math.ceil(value / 24);
    default: return 30;
  }
};

/**
 * Aggregate data by period
 */
export const aggregateByPeriod = (data, period = 'day') => {
  if (period === 'day') return data;

  const aggregated = {};

  data.forEach((item) => {
    const date = new Date(item.date);
    let key;

    if (period === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else if (period === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!aggregated[key]) {
      aggregated[key] = {
        date: key,
        images: 0,
        downloads: 0,
        projects: 0,
        apiCalls: 0,
      };
    }

    aggregated[key].images += item.images || 0;
    aggregated[key].downloads += item.downloads || 0;
    aggregated[key].projects += item.projects || 0;
    aggregated[key].apiCalls += item.apiCalls || 0;
  });

  return Object.values(aggregated);
};

/**
 * Calculate moving average
 */
export const calculateMovingAverage = (data, metric, window = 7) => {
  const result = [];

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const average = slice.reduce((sum, item) => sum + (item[metric] || 0), 0) / slice.length;
    
    result.push({
      ...data[i],
      [`${metric}_ma`]: Math.round(average),
    });
  }

  return result;
};

/**
 * Export data to CSV
 */
export const exportToCSV = (data, filename = 'analytics') => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) => headers.map((header) => row[header]).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate session ID
 */
export const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get or create session ID
 */
export const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }

  return sessionId;
};