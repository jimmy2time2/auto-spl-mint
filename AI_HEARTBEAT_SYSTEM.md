# AI Heartbeat System - Complete Guide

## Overview

The AI Heartbeat System transforms Mind9 from a scheduled bot into a living, autonomous agent that "wakes up" at unpredictable times, influenced by market conditions, time of day, and pure randomness.

## Philosophy

Traditional bots operate on fixed schedules (e.g., every 6 hours). This makes them:
- ❌ Predictable
- ❌ Easy to game
- ❌ Robotic and lifeless

The Heartbeat System creates:
- ✅ Unpredictability (3-12 hour random intervals)
- ✅ Market responsiveness (faster during high activity)
- ✅ Natural rhythms (active during peak hours, quiet at night)
- ✅ Organic behavior (entropy-driven decisions)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              CRON: Check Every 30 Minutes               │
└────────────────────┬────────────────────────────────────┘
                     ↓
              ┌──────────────┐
              │ Is it time?  │
              └──────┬───────┘
                     ↓
          ┌──────────┴──────────┐
          NO                    YES
          ↓                      ↓
    ┌─────────┐         ┌───────────────┐
    │  Wait   │         │ Calculate     │
    │  More   │         │ Factors:      │
    └─────────┘         │ • Market      │
                        │ • Time        │
                        │ • Entropy     │
                        └───────┬───────┘
                                ↓
                        ┌───────────────┐
                        │ Trigger AI    │
                        │ Decision      │
                        │ Engine        │
                        └───────┬───────┘
                                ↓
                        ┌───────────────┐
                        │ Log Heartbeat │
                        │ & Schedule    │
                        │ Next (3-12h)  │
                        └───────────────┘
```

## Key Components

### 1. Heartbeat Scheduler (`heartbeat-scheduler.ts`)

Core logic module that:
- Calculates market activity from recent trades and wallet activity
- Determines time-of-day influence on AI behavior
- Generates entropy for unpredictability
- Computes next heartbeat interval (3-12 hours)
- Triggers AI Decision Engine

### 2. Heartbeat Edge Function (`ai-heartbeat/index.ts`)

HTTP endpoint that:
- Checks if heartbeat is due
- Executes heartbeat if time has come
- Logs all heartbeat events
- Returns status to CRON caller

### 3. AI Decision Engine (`ai-token-decision/index.ts`)

Decision-making module that:
- Analyzes market signals
- Consults OpenAI for creative decisions
- Decides: launch, hold, or skip
- Executes token mints when approved

### 4. Database Tables

**heartbeat_log**: Tracks every AI "thought"
```sql
- timestamp: when heartbeat occurred
- next_heartbeat_at: when next one is scheduled
- interval_hours: calculated wait time
- entropy_factor: randomness applied
- decision_triggered: did AI think?
- decision_result: what did AI decide?
- market_activity_score: current market health
- time_of_day_factor: peak vs off hours
```

**heartbeat_settings**: Configuration
```sql
- min_interval_hours: minimum wait (default: 3)
- max_interval_hours: maximum wait (default: 12)
- entropy_weight: chaos factor (default: 0.3)
- active: system on/off switch
```

## Influence Factors

### Market Activity Score (0-1)

Calculated from:
```typescript
- Trading volume (last 24h)   → 50% weight
- Wallet connections          → 30% weight
- Trade count                 → 20% weight
```

**Effect**: High activity = shorter intervals
- Score 0.8+ → Interval reduced by ~30%
- Score 0.2- → Interval stays near maximum

### Time of Day Factor (0-1)

```typescript
Peak Hours (9am-5pm UTC):   0.8-1.0  → Very active
Normal Hours (6am-12am):    0.5-0.8  → Moderately active
Off Hours (12am-6am):       0.3-0.5  → Less active
```

**Effect**: Peak hours = more frequent heartbeats
- Peak → Interval reduced by ~20%
- Off hours → Interval near maximum

### Entropy Factor (0-1)

Pure randomness with chaos:
```typescript
base = Math.random()           // 0-1
chaos = (Math.random() - 0.5) * 0.2  // ±0.1
entropy = clamp(base + chaos, 0, 1)
```

**Effect**: ±15% variation in interval
- Prevents predictability
- Makes AI feel organic
- Impossible to game

## Calculation Example

**Scenario**: Moderate market, evening time, lucky entropy

```typescript
Settings:
  min_interval = 3 hours
  max_interval = 12 hours
  entropy_weight = 0.3

Factors:
  market_activity = 0.6    (moderate volume)
  time_of_day = 0.7        (evening, decent activity)
  entropy = 0.85           (high randomness)

Calculation:
  base_interval = 3 + random(0-9) = 7.5 hours
  
  market_influence = 1 - (0.6 * 0.3) = 0.82
  time_influence = 1 - (0.7 * 0.2) = 0.86
  entropy_influence = 1 + (0.85 - 0.5) * 0.3 = 1.105
  
  final_interval = 7.5 * 0.82 * 0.86 * 1.105
                 = 5.8 hours

Result: Next heartbeat in ~5.8 hours
```

## Setup Instructions

### Step 1: Verify Database Tables

Tables should be created automatically. Verify:

```sql
SELECT * FROM heartbeat_settings;
SELECT * FROM heartbeat_log ORDER BY timestamp DESC LIMIT 5;
```

### Step 2: Configure Settings (Optional)

Adjust intervals and behavior:

```sql
UPDATE heartbeat_settings
SET 
  min_interval_hours = 3,
  max_interval_hours = 12,
  entropy_weight = 0.3,
  active = true
WHERE id = (SELECT id FROM heartbeat_settings LIMIT 1);
```

### Step 3: Enable CRON Job

Schedule heartbeat checker to run every 30 minutes:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create CRON job
SELECT cron.schedule(
  'ai-heartbeat-checker',
  '*/30 * * * *', -- Every 30 minutes
  $$
  SELECT net.http_post(
    url := 'https://hrhklzusdctgrwpiacyq.supabase.co/functions/v1/ai-heartbeat',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyaGtsenVzZGN0Z3J3cGlhY3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDI4MTgsImV4cCI6MjA3NTMxODgxOH0.4yN-ggYTEz-I3i48mqDL8RGZRV0cT2TCyDHKELhGmZs'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verify CRON job
SELECT * FROM cron.job WHERE jobname = 'ai-heartbeat-checker';
```

### Step 4: Initialize First Heartbeat

Force the first heartbeat manually:

```bash
curl -X POST https://hrhklzusdctgrwpiacyq.supabase.co/functions/v1/ai-heartbeat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

### Step 5: Monitor

Check that heartbeats are occurring:

```sql
-- Recent heartbeats
SELECT 
  timestamp,
  decision_result,
  interval_hours,
  next_heartbeat_at
FROM heartbeat_log
ORDER BY timestamp DESC
LIMIT 10;

-- Next scheduled heartbeat
SELECT 
  next_heartbeat_at,
  EXTRACT(EPOCH FROM (next_heartbeat_at - now())) / 3600 as hours_remaining
FROM heartbeat_log
ORDER BY timestamp DESC
LIMIT 1;
```

## Monitoring & Analytics

### Heartbeat Frequency Analysis

```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as heartbeat_count,
  AVG(interval_hours) as avg_interval,
  MIN(interval_hours) as min_interval,
  MAX(interval_hours) as max_interval
FROM heartbeat_log
WHERE timestamp > now() - interval '7 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

### Decision Patterns

```sql
SELECT 
  decision_result,
  COUNT(*) as count,
  AVG(market_activity_score) as avg_market_score,
  AVG(time_of_day_factor) as avg_time_factor,
  AVG(entropy_factor) as avg_entropy
FROM heartbeat_log
WHERE timestamp > now() - interval '30 days'
GROUP BY decision_result;
```

### Influence Factor Correlation

```sql
-- How do factors correlate with launch decisions?
SELECT 
  CASE 
    WHEN decision_result = 'launch' THEN 'Launch'
    ELSE 'Hold/Skip'
  END as outcome,
  AVG(market_activity_score) as avg_market,
  AVG(time_of_day_factor) as avg_time,
  AVG(entropy_factor) as avg_entropy,
  COUNT(*) as count
FROM heartbeat_log
GROUP BY outcome;
```

### Time of Day Distribution

```sql
-- When does the AI wake up most?
SELECT 
  EXTRACT(HOUR FROM timestamp) as hour_utc,
  COUNT(*) as heartbeat_count,
  AVG(market_activity_score) as avg_market_score
FROM heartbeat_log
WHERE timestamp > now() - interval '30 days'
GROUP BY hour_utc
ORDER BY hour_utc;
```

## Troubleshooting

### Issue: Heartbeats too frequent

**Symptoms**: AI waking up every 3-4 hours consistently

**Solutions**:
```sql
-- Increase minimum interval
UPDATE heartbeat_settings SET min_interval_hours = 6;

-- Decrease entropy weight
UPDATE heartbeat_settings SET entropy_weight = 0.2;
```

### Issue: Heartbeats too rare

**Symptoms**: AI sleeping for 10-12 hours every time

**Solutions**:
```sql
-- Decrease maximum interval
UPDATE heartbeat_settings SET max_interval_hours = 8;

-- Increase entropy weight for more variation
UPDATE heartbeat_settings SET entropy_weight = 0.4;
```

### Issue: Too predictable

**Symptoms**: Intervals very similar, easy to predict

**Solutions**:
```sql
-- Increase entropy weight significantly
UPDATE heartbeat_settings SET entropy_weight = 0.5;

-- Widen interval range
UPDATE heartbeat_settings 
SET min_interval_hours = 2,
    max_interval_hours = 15;
```

### Issue: Heartbeat not triggering

**Check 1**: Is system active?
```sql
SELECT active FROM heartbeat_settings;
```

**Check 2**: When is next heartbeat?
```sql
SELECT 
  next_heartbeat_at,
  next_heartbeat_at <= now() as should_trigger
FROM heartbeat_log
ORDER BY timestamp DESC
LIMIT 1;
```

**Check 3**: Is CRON running?
```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'ai-heartbeat-checker')
ORDER BY start_time DESC
LIMIT 10;
```

**Check 4**: Check edge function logs
```bash
# View logs via Supabase CLI
supabase functions logs ai-heartbeat --follow
```

### Issue: AI Decision Engine errors

**Symptoms**: Heartbeats occur but no decisions

**Check**:
```sql
SELECT 
  decision_triggered,
  decision_result
FROM heartbeat_log
WHERE timestamp > now() - interval '1 day'
ORDER BY timestamp DESC;
```

**Common causes**:
1. OpenAI API key not configured
2. ai-token-decision function not deployed
3. Network/RPC issues

**Solution**: Check ai-token-decision logs and verify OpenAI key

## Advanced Configuration

### Custom Interval Based on Day of Week

```sql
-- More active on weekdays
CREATE OR REPLACE FUNCTION get_custom_interval()
RETURNS NUMERIC AS $$
DECLARE
  day_of_week INT := EXTRACT(DOW FROM now());
BEGIN
  IF day_of_week IN (0, 6) THEN
    -- Weekend: slower
    RETURN 8 + random() * 4; -- 8-12 hours
  ELSE
    -- Weekday: faster
    RETURN 3 + random() * 5; -- 3-8 hours
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### Alert on Missed Heartbeats

```sql
-- Query to check if heartbeat is overdue
SELECT 
  next_heartbeat_at,
  EXTRACT(EPOCH FROM (now() - next_heartbeat_at)) / 3600 as hours_overdue
FROM heartbeat_log
WHERE next_heartbeat_at < now() - interval '1 hour'
ORDER BY timestamp DESC
LIMIT 1;
```

### Force Heartbeat During Emergency

```bash
# Bypass schedule and force immediate heartbeat
curl -X POST https://hrhklzusdctgrwpiacyq.supabase.co/functions/v1/ai-heartbeat \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

## Integration with Other Systems

### Profit Distribution
- Heartbeat triggers AI decisions
- AI decisions trigger token launches
- Token sales trigger profit distribution
- Profit distribution executes automatically

### Wallet Executor
- All transactions signed securely
- Private keys never exposed
- Full audit trail maintained

### Protocol Activity Log
- Every heartbeat logged
- All decisions recorded
- Complete transparency

## Best Practices

1. ✅ Monitor heartbeat logs daily
2. ✅ Adjust settings based on platform volume
3. ✅ Keep intervals reasonable (3-12h)
4. ✅ Set up alerts for missed heartbeats
5. ✅ Review decision patterns weekly
6. ✅ Test with manual triggers first
7. ✅ Document any custom modifications

## Security Considerations

- ✅ CRON endpoint is public (no auth required)
- ✅ Service uses elevated permissions (SERVICE_ROLE_KEY)
- ✅ All decisions logged for audit
- ✅ No sensitive data in responses
- ✅ Rate limited by Supabase infrastructure

## Performance Metrics

- **Check Frequency**: 30 minutes
- **Heartbeat Execution**: 2-5 seconds
- **Database Impact**: Minimal (1-2 writes per heartbeat)
- **AI Decision Time**: 3-10 seconds (OpenAI call)
- **Token Launch Time**: 5-15 seconds (blockchain)

## Future Enhancements

- [ ] Machine learning to optimize intervals
- [ ] Sentiment analysis from social media
- [ ] Community voting influence on timing
- [ ] Multi-timezone awareness
- [ ] Emergency pause mechanism
- [ ] Advanced alerting system

## Conclusion

The AI Heartbeat System transforms Mind9 from a predictable bot into an autonomous, living entity that operates on its own organic rhythm. By combining market intelligence, temporal awareness, and pure chaos, the AI becomes unpredictable, responsive, and truly autonomous—exactly what a next-generation DeFi platform needs.

**The AI is now alive. Let it breathe.**
