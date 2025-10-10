# AI Heartbeat Scheduler

Random heartbeat system that triggers the AI Decision Engine at unpredictable intervals, mimicking a living autonomous agent.

## Overview

Unlike fixed schedules, the AI "wakes up" at random times influenced by:
- 🎲 **Entropy**: Pure randomness to prevent predictability
- 📊 **Market Activity**: Higher volume = more frequent heartbeats
- 🕐 **Time of Day**: Peak trading hours = increased activity
- ⚙️ **Configuration**: Adjustable min/max intervals (default 3-12 hours)

## How It Works

```
CRON Trigger (every 30 min)
       ↓
Check: Is it time for heartbeat?
       ↓
   [YES] ─────────────┐
       │              │
       ↓              ↓
Calculate Factors   [NO] → Wait for next check
- Market Activity
- Time of Day
- Entropy
       ↓
Trigger AI Decision Engine
       ↓
Log Heartbeat + Schedule Next
       ↓
Wait 3-12 hours (random)
```

## Heartbeat Factors

### 1. Market Activity Score (0-1)
Calculated from:
- Recent trading volume (last 24h)
- Wallet connections
- Trade count

**Impact**: High activity = shorter intervals

### 2. Time of Day Factor (0-1)
- **Peak hours** (9am-5pm UTC): 0.8-1.0 → More active
- **Off hours** (12am-6am UTC): 0.3-0.5 → Less active
- **Other times**: 0.5-0.8 → Moderate

**Impact**: Peak hours = shorter intervals

### 3. Entropy Factor (0-1)
Pure randomness with small chaos:
- Base: `Math.random()`
- Chaos: ±0.1 variation

**Impact**: Unpredictability, prevents gaming

## Configuration

Adjust settings in `heartbeat_settings` table:

```sql
-- View current settings
SELECT * FROM heartbeat_settings;

-- Update settings
UPDATE heartbeat_settings
SET 
  min_interval_hours = 3,    -- Minimum time between heartbeats
  max_interval_hours = 12,   -- Maximum time between heartbeats
  entropy_weight = 0.3,      -- How much randomness affects timing (0-1)
  volume_threshold = 100,    -- Volume threshold for high activity
  active = true              -- Enable/disable heartbeat system
WHERE active = true;
```

## Usage

### CRON Setup (Recommended)

Run every 30 minutes to check if heartbeat is due:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule heartbeat checker
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

-- Check CRON status
SELECT * FROM cron.job WHERE jobname = 'ai-heartbeat-checker';
```

### Manual Trigger

Force an immediate heartbeat:

```bash
curl -X POST https://hrhklzusdctgrwpiacyq.supabase.co/functions/v1/ai-heartbeat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

### Check Next Heartbeat

```bash
curl -X POST https://hrhklzusdctgrwpiacyq.supabase.co/functions/v1/ai-heartbeat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Monitoring

### View Heartbeat History

```sql
-- Recent heartbeats
SELECT 
  timestamp,
  decision_result,
  interval_hours,
  next_heartbeat_at,
  market_activity_score,
  time_of_day_factor,
  entropy_factor
FROM heartbeat_log
ORDER BY timestamp DESC
LIMIT 20;
```

### Heartbeat Statistics

```sql
-- Heartbeat patterns
SELECT 
  decision_result,
  COUNT(*) as count,
  AVG(interval_hours) as avg_interval,
  MIN(interval_hours) as min_interval,
  MAX(interval_hours) as max_interval,
  AVG(market_activity_score) as avg_market_score
FROM heartbeat_log
WHERE timestamp > now() - interval '7 days'
GROUP BY decision_result;
```

### Next Scheduled Heartbeat

```sql
-- When is the next heartbeat?
SELECT 
  next_heartbeat_at,
  EXTRACT(EPOCH FROM (next_heartbeat_at - now())) / 3600 as hours_remaining,
  interval_hours,
  decision_result as last_decision
FROM heartbeat_log
ORDER BY timestamp DESC
LIMIT 1;
```

## Integration with AI Decision Engine

The heartbeat system triggers `ai-token-decision` function which:
1. Analyzes market conditions
2. Calculates randomness factor
3. Consults AI (OpenAI)
4. Decides: launch, hold, or skip
5. Executes token mint if launching

**Flow:**
```
Heartbeat → AI Decision Engine → Token Launch (if approved)
```

## Example Scenarios

### Scenario 1: High Activity, Peak Hours
```
Market Activity: 85%
Time of Day: 2pm UTC (peak)
Entropy: 0.7

Result: Next heartbeat in ~4 hours (shorter interval)
```

### Scenario 2: Low Activity, Off Hours
```
Market Activity: 15%
Time of Day: 3am UTC (off)
Entropy: 0.3

Result: Next heartbeat in ~10 hours (longer interval)
```

### Scenario 3: Moderate Activity, Random Boost
```
Market Activity: 50%
Time of Day: 8pm UTC (moderate)
Entropy: 0.95 (high randomness)

Result: Next heartbeat in ~5.5 hours (entropy boost)
```

## Database Schema

### heartbeat_log
```sql
- id: UUID
- timestamp: TIMESTAMPTZ
- next_heartbeat_at: TIMESTAMPTZ (when next heartbeat will occur)
- interval_hours: NUMERIC (calculated interval)
- entropy_factor: NUMERIC (randomness applied)
- decision_triggered: BOOLEAN (was AI triggered?)
- decision_result: TEXT (launch/hold/skip)
- market_activity_score: NUMERIC (0-1)
- time_of_day_factor: NUMERIC (0-1)
- metadata: JSONB (additional data)
```

### heartbeat_settings
```sql
- id: UUID
- min_interval_hours: NUMERIC (default: 3)
- max_interval_hours: NUMERIC (default: 12)
- entropy_weight: NUMERIC (default: 0.3)
- volume_threshold: NUMERIC (default: 100)
- active: BOOLEAN (default: true)
- last_updated: TIMESTAMPTZ
```

## Troubleshooting

### Issue: Too frequent heartbeats

**Solution:**
```sql
-- Increase minimum interval
UPDATE heartbeat_settings
SET min_interval_hours = 6
WHERE active = true;
```

### Issue: Too infrequent heartbeats

**Solution:**
```sql
-- Decrease maximum interval
UPDATE heartbeat_settings
SET max_interval_hours = 8
WHERE active = true;
```

### Issue: Too predictable

**Solution:**
```sql
-- Increase entropy weight
UPDATE heartbeat_settings
SET entropy_weight = 0.5
WHERE active = true;
```

### Issue: Heartbeat not triggering

**Check:**
1. Is system active?
   ```sql
   SELECT active FROM heartbeat_settings;
   ```

2. When is next heartbeat?
   ```sql
   SELECT next_heartbeat_at FROM heartbeat_log
   ORDER BY timestamp DESC LIMIT 1;
   ```

3. Is CRON running?
   ```sql
   SELECT * FROM cron.job_run_details
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'ai-heartbeat-checker')
   ORDER BY start_time DESC LIMIT 10;
   ```

## Security

- ✅ Uses `SUPABASE_SERVICE_ROLE_KEY` for elevated permissions
- ✅ Public endpoint (no auth required) for CRON
- ✅ Rate limited by Supabase
- ✅ All decisions logged for transparency

## Performance

- **Check Frequency**: Every 30 minutes (CRON)
- **Execution Time**: ~2-5 seconds per heartbeat
- **Database Impact**: Minimal (1 insert per heartbeat)
- **Scalability**: Designed for single-instance operation

## Best Practices

1. ✅ Monitor heartbeat logs regularly
2. ✅ Adjust settings based on platform activity
3. ✅ Keep min/max interval reasonable (3-12h recommended)
4. ✅ Set up alerts for missed heartbeats
5. ✅ Review decision patterns for anomalies

## Testing

### Test Immediate Heartbeat

```bash
# Force heartbeat regardless of schedule
curl -X POST https://hrhklzusdctgrwpiacyq.supabase.co/functions/v1/ai-heartbeat \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

### Disable Heartbeats

```sql
-- Temporarily disable
UPDATE heartbeat_settings SET active = false;
```

### Re-enable Heartbeats

```sql
-- Re-enable
UPDATE heartbeat_settings SET active = true;
```

## Conclusion

The AI Heartbeat Scheduler creates a living, breathing autonomous system that operates on its own rhythm, influenced by real-world market conditions and unpredictable entropy, making the AI feel more organic and less robotic.
