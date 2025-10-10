# AI Decision Engine

Autonomous AI module that analyzes platform data and decides whether to launch new tokens.

## Overview

This module runs every 15 minutes (via Supabase cron) and:
1. Gathers engagement, token lifecycle, and platform data
2. Uses OpenAI to make autonomous decisions (LAUNCH, HOLD, or BURN)
3. Logs all decisions to `ai_action_log` table
4. If LAUNCH: generates token details with OpenAI and calls `mint-token`
5. Adds random jitter (0-5 min) to prevent predictable patterns

## Decision Logic

The AI considers:
- **Time since last mint**: Minimum hours between launches (from settings)
- **Engagement score**: Wallet connections, trades, page views
- **Trade activity**: Volume in last 24 hours
- **Market health**: Average token prices and holder counts

## Actions

- **LAUNCH**: Creates new token when conditions are favorable
- **HOLD**: Waits for better market conditions
- **BURN**: Reduces supply when oversaturated (logged but not yet implemented)

## Setup Cron Job

To run this every 15 minutes, execute in Supabase SQL editor:

\`\`\`sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule AI decision engine to run every 15 minutes
SELECT cron.schedule(
  'ai-decision-engine-15min',
  '*/15 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://hrhklzusdctgrwpiacyq.supabase.co/functions/v1/ai-decision-engine',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
\`\`\`

## Manual Testing

Call the function manually:
\`\`\`bash
curl -X POST https://hrhklzusdctgrwpiacyq.supabase.co/functions/v1/ai-decision-engine
\`\`\`

## Logs

All decisions are logged to:
- `ai_action_log` table (dedicated logging)
- `protocol_activity` table (public visibility)

Query recent decisions:
\`\`\`sql
SELECT * FROM ai_action_log ORDER BY timestamp DESC LIMIT 10;
\`\`\`
