/**
 * Analytics Aggregation Utilities
 * Helper functions for aggregating analytics data
 */

/**
 * Aggregate events by time period
 */
export const aggregateByTimePeriod = (events, period = 'day') => {
  const aggregated = new Map();

  events.forEach((event) => {
    const date = new Date(event.created_at);
    let key;

    switch (period) {
      case 'hour':
        key = `${date.toISOString().split('T')[0]} ${date.getHours()}:00`;
        break;
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    if (!aggregated.has(key)) {
      aggregated.set(key, {
        date: key,
        count: 0,
        events: [],
      });
    }

    const entry = aggregated.get(key);
    entry.count++;
    entry.events.push(event);
  });

  return Array.from(aggregated.values());
};

/**
 * Calculate percentiles
 */
export const calculatePercentiles = (values) => {
  if (!values || values.length === 0) {
    return { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const getPercentile = (p) => {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  };

  return {
    p50: getPercentile(50),
    p75: getPercentile(75),
    p90: getPercentile(90),
    p95: getPercentile(95),
    p99: getPercentile(99),
  };
};

/**
 * Calculate rolling average
 */
export const calculateRollingAverage = (data, metric, window = 7) => {
  return data.map((item, index) => {
    const start = Math.max(0, index - window + 1);
    const slice = data.slice(start, index + 1);
    const average = slice.reduce((sum, d) => sum + (d[metric] || 0), 0) / slice.length;
    
    return {
      ...item,
      [`${metric}_avg`]: Math.round(average),
    };
  });
};

/**
 * Group data by field
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key] || 'unknown';
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Calculate growth rate
 */
export const calculateGrowthRate = (oldValue, newValue) => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

/**
 * Get date range array
 */
export const getDateRange = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(new Date(current).toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

/**
 * Fill missing dates with zero values
 */
export const fillMissingDates = (data, startDate, endDate, defaultValue = 0) => {
  const dateRange = getDateRange(startDate, endDate);
  const dataMap = new Map(data.map((item) => [item.date, item]));

  return dateRange.map((date) => {
    if (dataMap.has(date)) {
      return dataMap.get(date);
    }
    return {
      date,
      value: defaultValue,
    };
  });
};