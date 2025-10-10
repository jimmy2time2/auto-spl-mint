# AI Token Decision Engine

Autonomous AI agent that decides when to launch new tokens on the Mind9 platform.

## Overview

This edge function runs an AI-powered decision engine that:
1. Analyzes market signals (engagement, volume, holder activity)
2. Applies randomness factors for unpredictability
3. Uses OpenAI to make creative decisions
4. Logs all decisions to `token_decision_log` table
5. Executes token mints via the wallet executor (when approved)

## Decision Flow

```
Every 6-18 hours (randomized):
  ↓
Fetch Market Signals
  ↓
Calculate Randomness Factor (0-1)
  ↓
AI Makes Decision (launch/hold/skip)
  ↓
Log Decision to Database
  ↓
If LAUNCH + not dev_mode:
  → Execute Token Mint
  → Update decision log
```

## Usage

### Manual Trigger (Testing)
```bash
curl -X POST https://your-project.supabase.co/functions/v1/ai-token-decision \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"dev_mode": true}'
```

### CRON Scheduling (Production)

To run automatically every 6-18 hours, set up a CRON job in Supabase:

```sql
-- Run every 12 hours (adjust as needed)
SELECT cron.schedule(
  'ai-token-decision-engine',
  '0 */12 * * *', -- Every 12 hours
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/ai-token-decision',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"dev_mode": false, "force_execute": false}'::jsonb
  ) as request_id;
  $$
);
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dev_mode` | boolean | `false` | If true, decisions are logged but NOT executed |
| `force_execute` | boolean | `false` | If true, bypasses randomness check for execution |

## Dev Mode

**IMPORTANT**: Always use `dev_mode: true` during development to prevent accidental token mints.

```json
{
  "dev_mode": true
}
```

## Decision Factors

### Market Signals
- Engagement score (user activity)
- Wallet connections (new users)
- Recent trades (market activity)
- Hours since last token (cooldown)
- Trading volume (market health)
- Active holders (community size)
- DAO participation (governance activity)

### Randomness Factor
- Base: 0-1 random value
- Entropy: ±0.3 chaos modifier
- Higher values → more likely to launch
- Prevents predictability

### AI Reasoning
OpenAI analyzes signals and creates:
- Token name (creative, memorable)
- Token theme (story/concept)
- Launch timing (immediate or delayed)
- Confidence score (0-1)

## Database Schema

### token_decision_log
```sql
- id: UUID
- timestamp: timestamptz
- decision: 'launch' | 'hold' | 'skip'
- reasoning: text
- confidence: numeric
- token_name: text
- token_theme: text
- scheduled_launch_time: timestamptz
- market_signals: jsonb
- randomness_factor: numeric
- executed: boolean
- execution_result: jsonb
- dev_mode: boolean
```

## Security

- Uses `verify_jwt = false` for CRON access
- Requires `OPENAI_API_KEY` secret
- Executes with `SUPABASE_SERVICE_ROLE_KEY` for full access
- All decisions logged for transparency

## Monitoring

Check recent decisions:
```sql
SELECT 
  timestamp,
  decision,
  token_name,
  confidence,
  executed,
  dev_mode
FROM token_decision_log
ORDER BY timestamp DESC
LIMIT 20;
```

Check execution rate:
```sql
SELECT 
  decision,
  COUNT(*) as count,
  AVG(confidence) as avg_confidence
FROM token_decision_log
WHERE timestamp > now() - interval '7 days'
GROUP BY decision;
```

## Troubleshooting

### No tokens launching
- Check `dev_mode` is `false` in production
- Verify `OPENAI_API_KEY` is set
- Check randomness factor (may need higher threshold)
- Review market signals (engagement might be too low)

### Too many tokens launching
- Increase minimum hours between tokens
- Add cooldown logic in decision engine
- Adjust randomness threshold upward

### AI decision errors
- Verify OpenAI API key is valid
- Check API rate limits
- Review prompt formatting
