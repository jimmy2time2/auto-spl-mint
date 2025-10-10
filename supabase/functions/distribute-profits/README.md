# Profit Distribution Service

Automated profit distribution module that splits token sale profits across the 4-wallet economy system.

## Distribution Rules

Every profit event is automatically split as follows:

| Wallet | Percentage | Purpose |
|--------|-----------|---------|
| AI Wallet | 80% | Reinvestment for autonomous operations |
| System/DAO Wallet | 15% | Treasury for governance and protocol |
| Lucky Wallet | 3% | Community rewards and incentives |
| Creator Wallet | 2% | Original token creator compensation |

## How It Works

```
Profit Event Created (profit_events table)
         ↓
Profit Distribution Service Runs
         ↓
Calculate Splits (80/15/3/2)
         ↓
Execute Transfers via Wallet Executor
         ↓
Log to wallet_activity_log
         ↓
Update protocol_activity
```

## Usage

### Manual Trigger

Process all unprocessed profit events:

```bash
curl -X POST https://hrhklzusdctgrwpiacyq.supabase.co/functions/v1/distribute-profits \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Process with Retry

Process new events and retry failed distributions:

```bash
curl -X POST https://hrhklzusdctgrwpiacyq.supabase.co/functions/v1/distribute-profits \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"retry_failed": true, "limit": 100}'
```

## CRON Scheduling

To run automatically every hour:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule profit distribution every hour
SELECT cron.schedule(
  'distribute-profits-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://hrhklzusdctgrwpiacyq.supabase.co/functions/v1/distribute-profits',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyaGtsenVzZGN0Z3J3cGlhY3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDI4MTgsImV4cCI6MjA3NTMxODgxOH0.4yN-ggYTEz-I3i48mqDL8RGZRV0cT2TCyDHKELhGmZs'
    ),
    body := jsonb_build_object(
      'retry_failed', true,
      'limit', 100
    )
  );
  $$
);

-- Check CRON job status
SELECT * FROM cron.job WHERE jobname = 'distribute-profits-hourly';
```

## Database Trigger Option

Alternatively, use a database trigger for instant processing:

```sql
-- Create function to trigger profit distribution
CREATE OR REPLACE FUNCTION trigger_profit_distribution()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://hrhklzusdctgrwpiacyq.supabase.co/functions/v1/distribute-profits',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY'
    ),
    body := jsonb_build_object('limit', 1)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profit_events table
CREATE TRIGGER on_profit_event_created
  AFTER INSERT ON public.profit_events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_profit_distribution();
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `retry_failed` | boolean | `false` | Retry failed distributions from last 24h |
| `limit` | number | `50` | Maximum events to process in one run |

## Error Handling

The service includes robust error handling:

1. **Transaction-Level Failures**: If one wallet transfer fails, others continue
2. **Event Processing**: Failures are logged but don't block other events
3. **Retry Mechanism**: Failed distributions can be retried with `retry_failed: true`
4. **Idempotency**: Already processed events are skipped based on `wallet_activity_log`

## Monitoring

### View Distribution Status

```sql
-- Recent distributions
SELECT 
  timestamp,
  description,
  metadata->>'profit_event_id' as event_id,
  metadata->>'total_distributed' as distributed,
  metadata->>'success' as success
FROM protocol_activity
WHERE activity_type = 'profit_distribution'
ORDER BY timestamp DESC
LIMIT 20;
```

### Check Failed Distributions

```sql
-- Failed distributions in last 24 hours
SELECT 
  timestamp,
  metadata->>'profit_event_id' as event_id,
  metadata->'failed_count' as failed_transfers,
  metadata->'transactions' as details
FROM protocol_activity
WHERE activity_type = 'profit_distribution'
  AND (metadata->>'success')::boolean = false
  AND timestamp > now() - interval '24 hours'
ORDER BY timestamp DESC;
```

### Wallet Activity Audit

```sql
-- Profit distributions by wallet
SELECT 
  wallet_address,
  COUNT(*) as distribution_count,
  SUM(amount) as total_received,
  MAX(timestamp) as last_distribution
FROM wallet_activity_log
WHERE activity_type = 'profit_distribution'
GROUP BY wallet_address
ORDER BY total_received DESC;
```

## Integration with Existing Systems

The profit distribution service works alongside:

- **profit_events**: Source of profit data
- **wallet-executor**: Secure transaction signing
- **wallet_activity_log**: Activity tracking
- **protocol_activity**: Transparency logging

## Troubleshooting

### Issue: Distributions not processing

**Check:**
1. Are there unprocessed events in `profit_events`?
2. Is the CRON job active?
3. Check edge function logs for errors

```sql
-- Check for unprocessed events
SELECT COUNT(*) FROM profit_events pe
WHERE NOT EXISTS (
  SELECT 1 FROM wallet_activity_log wal
  WHERE wal.transaction_hash = pe.transaction_hash
  AND wal.activity_type = 'profit_distribution'
);
```

### Issue: Partial failures

**Check:**
- Wallet executor logs
- Solana RPC connection status
- Wallet balances (insufficient funds?)

**Solution:**
Run with `retry_failed: true` to reprocess failed transfers.

### Issue: Duplicate distributions

**Cause:** Transaction hash matching prevents this, but if hashes are missing:

**Solution:**
Ensure all `profit_events` have unique `transaction_hash` values or IDs.

## Security

- ✅ Uses `SUPABASE_SERVICE_ROLE_KEY` for elevated permissions
- ✅ All transfers go through secure wallet executor
- ✅ Private keys never exposed in logs or responses
- ✅ Idempotency prevents duplicate distributions
- ✅ Failed transactions logged for audit trail

## Performance

- Processes up to 50 events per invocation (configurable)
- 100ms delay between events to avoid rate limits
- Failed events can be retried separately
- Horizontal scaling via multiple CRON schedules if needed

## Testing

Test with a sample profit event:

```sql
-- Insert a test profit event
INSERT INTO profit_events (
  token_id,
  sale_amount,
  dao_amount,
  creator_amount,
  lucky_amount,
  reinvestment_amount,
  transaction_hash
) VALUES (
  (SELECT id FROM tokens LIMIT 1),
  100, -- 100 SOL total
  15,  -- 15% = 15 SOL
  2,   -- 2% = 2 SOL
  3,   -- 3% = 3 SOL
  80,  -- 80% = 80 SOL
  'TEST_' || gen_random_uuid()
);

-- Then trigger distribution
-- curl -X POST ...
```

## Next Steps

1. ✅ Test with dev profit events
2. ✅ Enable CRON scheduling
3. ✅ Monitor first distributions
4. ✅ Set up alerts for failures
5. ✅ Enable production mode
