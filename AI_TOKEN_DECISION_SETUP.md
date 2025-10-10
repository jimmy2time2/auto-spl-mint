# AI Token Decision Engine - Setup Guide

## Overview

The AI Token Decision Engine is an autonomous module that runs in the background and decides when to launch new tokens on the Mind9 platform. It analyzes market conditions, applies randomness, and uses AI reasoning to make strategic decisions.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   AI Token Decision Engine                   │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Market       │  │ Randomness   │  │ AI Reasoning │
    │ Signals      │  │ Factor       │  │ (OpenAI)     │
    └──────────────┘  └──────────────┘  └──────────────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              ▼
                    ┌──────────────────┐
                    │ Decision Made    │
                    │ (launch/hold/skip)│
                    └──────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Log to       │  │ Execute Mint │  │ Schedule Next │
    │ Database     │  │ (if approved)│  │ Check (6-18h) │
    └──────────────┘  └──────────────┘  └──────────────┘
```

## Key Features

✅ **Autonomous Decision-Making**: AI decides when to launch tokens based on multiple factors  
✅ **Randomized Timing**: Checks occur every 6-18 hours (random) to prevent predictability  
✅ **Dev Mode**: Test decisions without executing actual token mints  
✅ **Market-Aware**: Analyzes engagement, volume, holder activity, and DAO participation  
✅ **Creative AI**: Uses OpenAI to generate unique token names and themes  
✅ **Full Transparency**: All decisions logged to `token_decision_log` table  
✅ **Secure Execution**: Integrates with existing wallet executor for safe minting

## Setup Instructions

### 1. Verify Database Migration

The `token_decision_log` table should already be created. Verify it exists:

```sql
SELECT * FROM token_decision_log LIMIT 1;
```

### 2. Set Up CRON Job (Production)

To run the decision engine automatically, create a CRON job in Supabase:

```sql
-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule decision engine to run every 12 hours
SELECT cron.schedule(
  'ai-token-decision-engine',
  '0 */12 * * *', -- Every 12 hours at the top of the hour
  $$
  SELECT net.http_post(
    url := 'https://hrhklzusdctgrwpiacyq.supabase.co/functions/v1/ai-token-decision',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyaGtsenVzZGN0Z3J3cGlhY3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDI4MTgsImV4cCI6MjA3NTMxODgxOH0.4yN-ggYTEz-I3i48mqDL8RGZRV0cT2TCyDHKELhGmZs'
    ),
    body := jsonb_build_object(
      'dev_mode', false,
      'force_execute', false
    )
  );
  $$
);

-- Check CRON job status
SELECT * FROM cron.job WHERE jobname = 'ai-token-decision-engine';
```

### 3. Test Manually (Dev Mode)

Test the decision engine without executing mints:

```bash
curl -X POST https://hrhklzusdctgrwpiacyq.supabase.co/functions/v1/ai-token-decision \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyaGtsenVzZGN0Z3J3cGlhY3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDI4MTgsImV4cCI6MjA3NTMxODgxOH0.4yN-ggYTEz-I3i48mqDL8RGZRV0cT2TCyDHKELhGmZs" \
  -H "Content-Type: application/json" \
  -d '{"dev_mode": true}'
```

Expected response:
```json
{
  "success": true,
  "decision": "hold",
  "confidence": 0.65,
  "reasoning": "Market signals show low engagement...",
  "decision_id": "uuid-here",
  "next_check_hours": 14.7,
  "dev_mode": true
}
```

## Configuration

### Dev Mode (Recommended for Testing)

Always use `dev_mode: true` during development:

```json
{
  "dev_mode": true
}
```

This will:
- ✅ Log all decisions to database
- ✅ Run AI analysis
- ✅ Calculate market signals
- ❌ **NOT** execute token mints

### Production Mode

Once tested, switch to production:

```json
{
  "dev_mode": false,
  "force_execute": false
}
```

This will:
- ✅ Log decisions
- ✅ Execute token mints when AI decides to launch
- ✅ Apply randomness factor for execution threshold

### Force Execute

To bypass randomness checks (use cautiously):

```json
{
  "dev_mode": false,
  "force_execute": true
}
```

## Decision Logic

### Market Signals Analyzed

1. **Engagement Score**: User activity level (0-100)
2. **Wallet Connections**: New users in last 24h
3. **Recent Trades**: Trading activity count
4. **Hours Since Last Token**: Cooldown period
5. **Trading Volume**: Total volume in last 24h
6. **Active Holders**: Unique holders trading
7. **DAO Participation**: Governance votes cast

### Randomness Factor

- **Range**: 0.0 to 1.0
- **Formula**: `base_random + entropy - 0.15`
- **Purpose**: Adds unpredictability to prevent gaming the system
- **Effect**: Higher values = more likely to launch

### AI Decision Process

The OpenAI model considers:
- All market signals
- Randomness factor
- Historical launch frequency
- Community engagement trends

And produces:
- **Decision**: launch, hold, or skip
- **Reasoning**: Explanation of the decision
- **Confidence**: 0.0-1.0 score
- **Token Name**: Creative name (if launching)
- **Token Theme**: Story/concept behind token
- **Launch Time**: Immediate or scheduled

## Monitoring

### View Recent Decisions

```sql
SELECT 
  timestamp,
  decision,
  token_name,
  confidence,
  reasoning,
  executed,
  dev_mode
FROM token_decision_log
ORDER BY timestamp DESC
LIMIT 20;
```

### Decision Statistics

```sql
SELECT 
  decision,
  COUNT(*) as count,
  AVG(confidence) as avg_confidence,
  COUNT(*) FILTER (WHERE executed = true) as executed_count
FROM token_decision_log
WHERE timestamp > now() - interval '30 days'
GROUP BY decision;
```

### Execution Rate

```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as decisions,
  COUNT(*) FILTER (WHERE decision = 'launch') as launches,
  COUNT(*) FILTER (WHERE executed = true) as executed
FROM token_decision_log
WHERE timestamp > now() - interval '7 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

## Troubleshooting

### Issue: No tokens launching

**Possible Causes:**
- Dev mode is enabled
- Randomness factor too low
- Market signals below threshold
- OpenAI API key not configured

**Solutions:**
1. Check dev_mode setting
2. Review recent decision logs
3. Verify OPENAI_API_KEY secret is set
4. Check market signals are being fetched correctly

### Issue: Too many tokens launching

**Possible Causes:**
- Force execute enabled
- Randomness threshold too low
- Market signals artificially high

**Solutions:**
1. Disable force_execute
2. Increase minimum hours between tokens
3. Add cooldown logic
4. Review decision criteria

### Issue: AI reasoning errors

**Possible Causes:**
- OpenAI API rate limit hit
- Invalid API key
- Prompt formatting error

**Solutions:**
1. Check OpenAI API key validity
2. Review API usage limits
3. Check edge function logs
4. Verify OpenAI API status

## Edge Function Logs

View real-time logs:

```bash
# Via Supabase CLI
supabase functions logs ai-token-decision --follow

# Or query logs table
SELECT * FROM logs 
WHERE action LIKE '%ai-token-decision%' 
ORDER BY timestamp DESC 
LIMIT 50;
```

## Security Notes

- ✅ Uses `SUPABASE_SERVICE_ROLE_KEY` for elevated permissions
- ✅ All decisions logged for transparency
- ✅ Dev mode prevents accidental production executions
- ✅ Integrates with existing wallet executor security
- ⚠️ CRON jobs use anon key (public endpoint)
- ⚠️ OpenAI API key stored as Supabase secret

## Integration with Existing Systems

The decision engine works alongside:

- **mint-token**: Executes actual token minting
- **wallet-executor**: Handles secure transactions
- **ai-decision-engine**: Older decision system (can coexist)
- **autonomous-heartbeat**: Alternative scheduling system
- **governor-brain**: Oversight and governance

All systems can run in parallel without conflicts.

## Next Steps

1. ✅ Test in dev mode
2. ✅ Review decision logs
3. ✅ Adjust parameters if needed
4. ✅ Enable CRON job
5. ✅ Monitor execution
6. ✅ Switch to production mode

## Support

For issues or questions:
1. Check edge function logs
2. Review decision_log table
3. Verify market signals
4. Test with dev_mode: true
5. Check OpenAI API status
