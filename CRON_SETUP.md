# AI Governor - CRON Setup Guide

This document explains how to set up the 30-minute autonomous evaluation cycle for the Mind9 AI Governor.

## Overview

The AI Governor runs every 30 minutes to:
1. Check cooldown status (24h minimum between mints)
2. Analyze market conditions via Solana & Twitter APIs
3. Calculate AI Energy Score
4. Decide whether to mint, tease, or wait
5. Broadcast cryptic hints before minting

## Setup Options

### Option 1: Supabase CRON (Recommended for Production)

Supabase supports pg_cron for scheduled edge function calls.

1. Enable `pg_cron` extension in your Supabase project:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

2. Create the CRON job to call the autonomous-heartbeat function every 30 minutes:
```sql
SELECT cron.schedule(
  'ai-governor-pulse',
  '*/30 * * * *', -- Every 30 minutes
  $$
  SELECT
    net.http_post(
        url:='https://hrhklzusdctgrwpiacyq.supabase.co/functions/v1/autonomous-heartbeat',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
```

3. Replace `YOUR_SERVICE_ROLE_KEY` with your actual Supabase service role key.

### Option 2: External CRON Service

Use a service like [cron-job.org](https://cron-job.org) or GitHub Actions:

**GitHub Actions Example** (`.github/workflows/ai-governor.yml`):
```yaml
name: AI Governor Pulse
on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  pulse:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger AI Heartbeat
        run: |
          curl -X POST \
            https://hrhklzusdctgrwpiacyq.supabase.co/functions/v1/autonomous-heartbeat \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'
```

### Option 3: Local Development

For testing locally, you can manually trigger the heartbeat:

```bash
curl -X POST \
  http://localhost:54321/functions/v1/autonomous-heartbeat \
  -H "Content-Type: application/json" \
  -d '{"timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'
```

Or use the frontend heartbeat component:
```typescript
import { heartbeat } from "@/cron/heartbeat";

// Trigger manually
await heartbeat.pulse();

// Start continuous monitoring (dev only)
await heartbeat.startContinuousMonitoring();
```

## Monitoring

### Check AI Activity
Query the protocol_activity table to see AI decisions:
```sql
SELECT 
  timestamp,
  description,
  metadata->>'decision' as decision
FROM protocol_activity
WHERE activity_type = 'ai_mind_decision'
ORDER BY timestamp DESC
LIMIT 20;
```

### Check Hints
See broadcasted hints:
```sql
SELECT 
  timestamp,
  description as hint
FROM protocol_activity
WHERE activity_type = 'ai_hint_broadcast'
ORDER BY timestamp DESC
LIMIT 10;
```

### Frontend API
Use the hint API endpoint to display live AI status:
```typescript
const { data } = await supabase.functions.invoke('hint-api');
console.log(data.latestHint);
console.log(data.aiStatus);
```

## Security Notes

- The AI Governor enforces a **24-hour cooldown** between mints
- All mints require sufficient wallet funds (checked via FundMonitor)
- Transaction fees (2% total: 1% creator + 1% system) are **mandatory** and cannot be bypassed
- Whale detection automatically flags wallets that buy >5% or sell >3% of supply
- All decisions are logged for transparency and audit trails

## Rate Limiting

- Market analysis: 30 minutes minimum between checks
- Token minting: 24 hours minimum cooldown
- Hint broadcasting: No limit (AI can tease anytime)
- Energy Score threshold: 7/10 required to mint

## AI Energy Score Formula

```
Energy Score = (Market Heat + Wallet Momentum) - Cooldown Penalty

Market Heat (0-5):
  - Bullish sentiment: +2
  - High Solana volume (>$1M): +2
  - Crypto trending hashtags: +1

Wallet Momentum (0-5):
  - High activity (>20% of top 100): +3
  - High volume: +1
  - High DAO participation: +1

Cooldown Penalty:
  - <24h since last mint: -10 (blocks minting)
  - 24-48h: -3
  - >48h: 0
```

## Troubleshooting

**No mints happening?**
- Check cooldown: Must be >24h since last mint
- Check AI Energy Score: Must be ≥7
- Check wallet funds: AI wallet must have sufficient balance
- Check logs: Look for errors in protocol_activity table

**Too many hints, no mints?**
- This is intentional - the AI teases before minting to build anticipation
- Hints appear when momentum is building but energy score isn't high enough yet

**How to force a mint?**
- You can manually call the mint-token function, but this bypasses AI logic
- It's recommended to let the AI decide based on market conditions

## API Endpoints

- `/functions/v1/autonomous-heartbeat` - Trigger AI evaluation cycle
- `/functions/v1/hint-api` - Get latest AI hints and status
- `/functions/v1/mind-think` - Raw AI decision engine
- `/functions/v1/ai-governor` - Execute AI decisions

## Next Steps

1. Set up your preferred CRON method
2. Monitor the AI activity for the first few cycles
3. Adjust thresholds if needed (edit `src/ai/agent.ts`)
4. Display hints on your frontend using `<AIHintDisplay />`
