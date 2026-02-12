-- Additional SQL functions for analytics

-- Function to increment platform usage
CREATE OR REPLACE FUNCTION increment_platform_usage(
  p_user_id UUID,
  p_platform VARCHAR(100)
)
RETURNS void AS $$
BEGIN
  UPDATE platform_usage_stats
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id AND platform = p_platform;

  IF NOT FOUND THEN
    INSERT INTO platform_usage_stats (user_id, platform, usage_count, last_used_at)
    VALUES (p_user_id, p_platform, 1, NOW());
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get user analytics summary
CREATE OR REPLACE FUNCTION get_user_analytics_summary(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_images INTEGER,
  total_downloads INTEGER,
  total_projects INTEGER,
  total_cost NUMERIC,
  avg_daily_images NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(dua.images_generated), 0)::INTEGER,
    COALESCE(SUM(dua.images_downloaded), 0)::INTEGER,
    COALESCE(SUM(dua.projects_created), 0)::INTEGER,
    COALESCE(SUM(ct.total_cost_usd), 0),
    COALESCE(AVG(dua.images_generated), 0)
  FROM daily_usage_aggregates dua
  LEFT JOIN cost_tracking ct ON dua.user_id = ct.user_id AND dua.date = ct.date
  WHERE dua.user_id = p_user_id
    AND dua.date >= CURRENT_DATE - p_days;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate system health score
CREATE OR REPLACE FUNCTION calculate_system_health()
RETURNS TABLE (
  health_score NUMERIC,
  status VARCHAR(20),
  issues TEXT[]
) AS $$
DECLARE
  avg_response_time NUMERIC;
  error_rate NUMERIC;
  score NUMERIC := 100;
  issues_array TEXT[] := '{}';
BEGIN
  -- Get average response time from last 24 hours
  SELECT AVG(value) INTO avg_response_time
  FROM performance_metrics
  WHERE metric_type = 'api_response'
    AND created_at >= NOW() - INTERVAL '24 hours';

  -- Calculate error rate
  SELECT 
    COALESCE(
      COUNT(*) FILTER (WHERE event_type = 'error')::NUMERIC / 
      NULLIF(COUNT(*)::NUMERIC, 0),
      0
    ) INTO error_rate
  FROM analytics_events
  WHERE created_at >= NOW() - INTERVAL '24 hours';

  -- Deduct points for issues
  IF avg_response_time > 500 THEN
    score := score - 20;
    issues_array := array_append(issues_array, 'High response time');
  END IF;

  IF avg_response_time > 1000 THEN
    score := score - 30;
  END IF;

  IF error_rate > 0.05 THEN
    score := score - 25;
    issues_array := array_append(issues_array, 'High error rate');
  END IF;

  IF error_rate > 0.10 THEN
    score := score - 25;
  END IF;

  -- Determine status
  RETURN QUERY SELECT
    score,
    CASE
      WHEN score >= 90 THEN 'excellent'
      WHEN score >= 70 THEN 'good'
      WHEN score >= 50 THEN 'warning'
      ELSE 'critical'
    END,
    issues_array;
END;
$$ LANGUAGE plpgsql;

-- Function to get top performing platforms
CREATE OR REPLACE FUNCTION get_top_platforms(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  platform VARCHAR(100),
  usage_count INTEGER,
  last_used_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pus.platform,
    pus.usage_count,
    pus.last_used_at
  FROM platform_usage_stats pus
  WHERE pus.user_id = p_user_id
  ORDER BY pus.usage_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate retention rate
CREATE OR REPLACE FUNCTION calculate_retention_rate(
  p_weeks INTEGER DEFAULT 4
)
RETURNS TABLE (
  week_start DATE,
  retention_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ue.week_start_date::DATE,
    (COUNT(*) FILTER (WHERE ue.retention_cohort IN ('active', 'engaged'))::NUMERIC / 
     NULLIF(COUNT(*)::NUMERIC, 0) * 100) as rate
  FROM user_engagement ue
  WHERE ue.week_start_date >= CURRENT_DATE - (p_weeks * 7)
  GROUP BY ue.week_start_date
  ORDER BY ue.week_start_date DESC;
END;
$$ LANGUAGE plpgsql;