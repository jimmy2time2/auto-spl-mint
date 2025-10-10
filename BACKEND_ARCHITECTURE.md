# Mind9 Backend Architecture

Complete overview of the autonomous AI backend system.

## System Overview

Mind9 operates as a truly autonomous AI agent on Solana, powered by multiple interconnected backend modules that work together without user intervention.

```
┌──────────────────────────────────────────────────────────────┐
│                     AUTONOMOUS AI CORE                        │
│                                                               │
│  ┌───────────────┐         ┌──────────────┐                 │
│  │  AI Heartbeat │────────→│ AI Decision  │                 │
│  │  (3-12h random)│         │ Engine       │                 │
│  └───────────────┘         └──────┬───────┘                 │
│         ↑                          │                          │
│         │                          ↓                          │
│  ┌──────┴────────┐         ┌──────────────┐                 │
│  │  Market       │         │ Token Launch │                 │
│  │  Signals      │         │ (Mint Token) │                 │
│  └───────────────┘         └──────┬───────┘                 │
│                                    │                          │
└────────────────────────────────────┼──────────────────────────┘
                                     ↓
         ┌───────────────────────────────────────┐
         │      4-WALLET ECONOMY SYSTEM          │
         │                                       │
         │  ┌──────┐  ┌────────┐  ┌──────┐  ┌────────┐  │
         │  │  AI  │  │ System │  │Lucky │  │Creator │  │
         │  │ 80%  │  │  15%   │  │  3%  │  │   2%   │  │
         │  └───┬──┘  └───┬────┘  └───┬──┘  └───┬────┘  │
         │      │         │           │         │        │
         │      └─────────┴───────────┴─────────┘        │
         │                     ↓                          │
         │            ┌────────────────┐                 │
         │            │ Wallet Executor│                 │
         │            │ (Secure Signer)│                 │
         │            └────────────────┘                 │
         └───────────────────────────────────────────────┘
                              ↓
                   ┌──────────────────┐
                   │ Solana Blockchain│
                   └──────────────────┘
```

## Core Modules

### 1. AI Heartbeat System 💓

**Purpose**: Random scheduler that triggers AI thinking

**Files**:
- `supabase/functions/_shared/heartbeat-scheduler.ts`
- `supabase/functions/ai-heartbeat/index.ts`
- `AI_HEARTBEAT_SYSTEM.md`

**How it works**:
1. CRON checks every 30 minutes
2. Calculates if heartbeat is due (3-12 hour random intervals)
3. Considers market activity, time of day, entropy
4. Triggers AI Decision Engine when time comes
5. Logs heartbeat and schedules next

**Key features**:
- Unpredictable timing
- Market-responsive
- Time-of-day aware
- Pure entropy injection

**Configuration**: `heartbeat_settings` table
```sql
min_interval_hours: 3
max_interval_hours: 12
entropy_weight: 0.3
active: true
```

---

### 2. AI Decision Engine 🧠

**Purpose**: Autonomous token launch decision-maker

**Files**:
- `supabase/functions/_shared/decision-engine.ts`
- `supabase/functions/ai-token-decision/index.ts`
- `AI_TOKEN_DECISION_SETUP.md`

**How it works**:
1. Analyzes market signals (volume, engagement, holders)
2. Calculates randomness factor
3. Consults OpenAI for creative decision
4. Decides: launch, hold, or skip
5. If launch: generates token name + theme
6. Executes mint via wallet executor
7. Logs decision to database

**Decisions**:
- **LAUNCH**: Create new token with AI-generated name/theme
- **HOLD**: Wait for better conditions
- **SKIP**: Market not ready

**Dev Mode**: Test decisions without executing mints

---

### 3. Profit Distribution System 💰

**Purpose**: Automatic profit splitting on token sales

**Files**:
- `supabase/functions/_shared/profit-distributor.ts`
- `supabase/functions/distribute-profits/index.ts`
- `PROFIT_DISTRIBUTION_SYSTEM.md`

**How it works**:
1. Monitors `profit_events` table
2. Splits profits: 80% AI / 15% DAO / 3% Lucky / 2% Creator
3. Executes transfers via wallet executor
4. Logs to `wallet_activity_log`
5. Updates `protocol_activity`

**Trigger options**:
- CRON schedule (hourly)
- Database trigger (instant)
- Manual invocation

**Error handling**:
- Retry mechanism for failures
- Idempotency (no duplicates)
- Partial success handling

---

### 4. Wallet Executor 🔐

**Purpose**: Secure transaction signing service

**Files**:
- `supabase/functions/_shared/wallet-signer.ts`
- `supabase/functions/wallet-executor/index.ts`
- `WALLET_SIGNER_SETUP.md`

**How it works**:
1. Stores private keys as encrypted Supabase secrets
2. Receives transaction requests (mint, transfer, burn, swap)
3. Signs transactions with appropriate wallet
4. Submits to Solana RPC
5. Returns transaction signature
6. Logs to database

**Supported wallets**:
- AI Wallet (autonomous operations)
- System Wallet (DAO treasury)
- Lucky Wallet (community rewards)
- Creator Wallet (creator profits)
- Treasury Wallet (platform fees)

**Security**:
- Private keys never exposed
- Backend-only access
- Full audit trail
- Environment variable encryption

---

### 5. Governor Brain System 🎯

**Purpose**: AI oversight and rule enforcement

**Files**:
- `supabase/functions/_shared/governor-brain.ts`
- `supabase/functions/ai-governor-brain/index.ts`
- `GOVERNOR_BRAIN_SYSTEM.md`

**How it works**:
1. Reviews all AI actions before execution
2. Applies guardrails (rate limits, caps, minimums)
3. Calculates entropy for randomness
4. Approves, modifies, rejects, or defers actions
5. Generates public messages
6. Logs all decisions

**Guardrails**:
- Allocation total check (must sum to 100%)
- Minimum reinvestment (40%)
- Rate limit check (1 per 6 hours)
- Whale protection (max 10% per wallet)
- DAO treasury cap (50% max)

---

## Database Schema

### Key Tables

**heartbeat_log**
- Tracks AI thinking sessions
- Records next scheduled heartbeat
- Stores influence factors

**token_decision_log**
- Logs all AI token decisions
- Captures reasoning and confidence
- Links to executed tokens

**profit_events**
- Records token sale profits
- Source for profit distribution

**wallet_activity_log**
- Tracks all wallet transactions
- Profit distributions
- Token mints/burns

**protocol_activity**
- Transparency log
- All system events
- Public audit trail

**governor_action_log**
- Governor decisions
- Approval/rejection reasons
- Guardrail triggers

---

## Data Flow

### Token Launch Flow
```
1. Heartbeat Timer Expires
   ↓
2. AI Heartbeat Triggered
   ↓
3. AI Decision Engine Analyzes Market
   ↓
4. OpenAI Consulted for Creative Decision
   ↓
5. Decision: LAUNCH
   ↓
6. Governor Brain Reviews
   ↓
7. Approved → Mint Token Function
   ↓
8. Wallet Executor Signs Transaction
   ↓
9. Submit to Solana RPC
   ↓
10. Log to protocol_activity & tokens table
```

### Profit Distribution Flow
```
1. Token Sold (profit_events record created)
   ↓
2. Distribute Profits Function Triggered
   ↓
3. Calculate Splits (80/15/3/2)
   ↓
4. For Each Wallet:
   a. Call Wallet Executor
   b. Sign Transfer Transaction
   c. Submit to Solana
   d. Log to wallet_activity_log
   ↓
5. Update protocol_activity
```

---

## CRON Schedules

### Recommended Setup

```sql
-- AI Heartbeat Checker (every 30 min)
SELECT cron.schedule(
  'ai-heartbeat-checker',
  '*/30 * * * *',
  $$[HTTP POST to ai-heartbeat]$$
);

-- Profit Distribution (every hour)
SELECT cron.schedule(
  'distribute-profits-hourly',
  '0 * * * *',
  $$[HTTP POST to distribute-profits]$$
);

-- Optional: AI Decision Manual Trigger (for testing)
SELECT cron.schedule(
  'ai-decision-test',
  '0 */6 * * *',
  $$[HTTP POST to ai-token-decision]$$
);
```

---

## Environment Variables / Secrets

Required Supabase secrets:

```
SUPABASE_URL                  - Auto-configured
SUPABASE_ANON_KEY            - Auto-configured
SUPABASE_SERVICE_ROLE_KEY    - Auto-configured
OPENAI_API_KEY               - Set manually
AI_WALLET_PRIVATE_KEY        - Set manually
SYSTEM_WALLET_PRIVATE_KEY    - Set manually
LUCKY_WALLET_PRIVATE_KEY     - Set manually
CREATOR_WALLET_PRIVATE_KEY   - Set manually
TREASURY_WALLET_PRIVATE_KEY  - Set manually
```

---

## Monitoring Dashboard Queries

### System Health Check
```sql
-- Recent activity across all systems
SELECT 
  activity_type,
  COUNT(*) as count,
  MAX(timestamp) as last_occurrence
FROM protocol_activity
WHERE timestamp > now() - interval '24 hours'
GROUP BY activity_type
ORDER BY last_occurrence DESC;
```

### Heartbeat Status
```sql
-- Next heartbeat and system status
SELECT 
  next_heartbeat_at,
  EXTRACT(EPOCH FROM (next_heartbeat_at - now())) / 3600 as hours_until,
  decision_result as last_decision,
  market_activity_score,
  entropy_factor
FROM heartbeat_log
ORDER BY timestamp DESC
LIMIT 1;
```

### Token Launch Rate
```sql
-- Tokens launched per day
SELECT 
  DATE(created_at) as date,
  COUNT(*) as tokens_launched
FROM tokens
WHERE created_at > now() - interval '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Profit Distribution Summary
```sql
-- Total distributed by wallet
SELECT 
  wallet_address,
  COUNT(*) as distribution_count,
  SUM(amount) as total_received
FROM wallet_activity_log
WHERE activity_type = 'profit_distribution'
GROUP BY wallet_address;
```

---

## Security Model

### Access Levels

1. **Public Endpoints** (no auth):
   - ai-heartbeat
   - ai-token-decision (can be public or private)
   - distribute-profits (can be public or private)

2. **Backend Only** (SERVICE_ROLE_KEY):
   - wallet-executor
   - All internal function calls

3. **Database**:
   - Row Level Security (RLS) enabled on all tables
   - Public read access for transparency
   - Write access restricted to backend

### Key Storage
- All private keys in Supabase secrets (encrypted)
- Never logged or exposed in responses
- Backend-only access via wallet executor
- Auditable via transaction logs

---

## Testing Checklist

### Initial Setup
- [ ] Database migrations run successfully
- [ ] All edge functions deployed
- [ ] Secrets configured (OpenAI, wallet keys)
- [ ] CRON jobs scheduled
- [ ] heartbeat_settings initialized

### Heartbeat System
- [ ] Force manual heartbeat: `curl ... -d '{"force": true}'`
- [ ] Check heartbeat_log has entries
- [ ] Verify next_heartbeat_at is set
- [ ] Monitor CRON execution

### AI Decision Engine
- [ ] Test with dev_mode: true
- [ ] Verify token_decision_log entries
- [ ] Check OpenAI API connectivity
- [ ] Test actual token mint (dev_mode: false)

### Profit Distribution
- [ ] Create test profit_event
- [ ] Trigger distribute-profits
- [ ] Verify wallet_activity_log entries
- [ ] Check transaction signatures

### Wallet Executor
- [ ] Test wallet balance queries
- [ ] Verify signature generation
- [ ] Check transaction submission
- [ ] Review logs table entries

---

## Troubleshooting

### Issue: Nothing happening

**Check**:
1. Are CRON jobs active? `SELECT * FROM cron.job;`
2. Are systems enabled? `SELECT * FROM heartbeat_settings;`
3. Check edge function logs
4. Verify secrets are set

### Issue: Transactions failing

**Check**:
1. Wallet balances (need SOL for fees)
2. RPC endpoint connectivity
3. Private key format
4. Transaction parameters

### Issue: AI not deciding

**Check**:
1. OpenAI API key valid
2. API rate limits
3. Network connectivity
4. ai-token-decision logs

---

## Performance Optimization

### Database Indexes
- All timestamp columns indexed
- Foreign keys indexed
- Composite indexes for common queries

### Edge Function Optimization
- Shared modules for reuse
- Minimal dependencies
- Efficient database queries
- Parallel processing where possible

### Scalability
- Stateless edge functions
- Database connection pooling
- Rate limiting built-in
- Horizontal scaling ready

---

## Maintenance

### Daily
- [ ] Review protocol_activity for anomalies
- [ ] Check heartbeat is functioning
- [ ] Monitor token launch rate

### Weekly
- [ ] Analyze decision patterns
- [ ] Review profit distributions
- [ ] Check wallet balances
- [ ] Audit failed transactions

### Monthly
- [ ] Optimize CRON schedules
- [ ] Review and adjust settings
- [ ] Performance analysis
- [ ] Security audit

---

## Future Enhancements

### Phase 1 (Current)
- ✅ AI Heartbeat System
- ✅ AI Decision Engine
- ✅ Profit Distribution
- ✅ Wallet Executor
- ✅ Governor Brain

### Phase 2 (Planned)
- [ ] Machine learning for interval optimization
- [ ] Sentiment analysis integration
- [ ] Community governance voting
- [ ] Advanced alerting system
- [ ] Multi-model AI consensus

### Phase 3 (Future)
- [ ] Cross-chain expansion
- [ ] DAO treasury management
- [ ] Dynamic fee adjustment
- [ ] Autonomous liquidity management
- [ ] AI personality evolution

---

## Documentation

- **AI_HEARTBEAT_SYSTEM.md** - Heartbeat scheduler guide
- **AI_TOKEN_DECISION_SETUP.md** - Decision engine setup
- **PROFIT_DISTRIBUTION_SYSTEM.md** - Profit splitting guide
- **WALLET_SIGNER_SETUP.md** - Wallet security setup
- **GOVERNOR_BRAIN_SYSTEM.md** - Governance oversight
- **BACKEND_ARCHITECTURE.md** - This document

---

## Support & Resources

- Edge function logs: `supabase functions logs [function-name]`
- Database queries: SQL editor in Supabase dashboard
- CRON monitoring: `cron.job_run_details` table
- Protocol transparency: `protocol_activity` table

---

## Conclusion

The Mind9 backend is a fully autonomous AI system that:
- 🧠 Thinks independently (Heartbeat + Decision Engine)
- 💰 Manages its own economy (Profit Distribution)
- 🔐 Executes securely (Wallet Executor)
- 🎯 Governs itself (Governor Brain)
- 📊 Operates transparently (Full audit logs)

**The AI is autonomous. The system is alive. The future is now.**
