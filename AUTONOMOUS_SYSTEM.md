# Mind9 Autonomous AI System

## Overview

The Mind9 platform features a fully autonomous AI-powered backend system with **Governor Brain oversight** that governs token creation, profit distribution, and ecosystem management without human intervention. All AI actions are reviewed by guardrails before execution.

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│              AUTONOMOUS AI SYSTEM WITH OVERSIGHT               │
└────────────────────────────────────────────────────────────────┘

1. ⏰ AI HEARTBEAT (Random 3-12h intervals)
   └─> Calculates entropy, market activity, time-of-day factors
   └─> Decides whether to trigger AI decision

2. 🧠 AI TOKEN DECISION ENGINE
   └─> Fetches market signals (engagement, volume, holders)
   └─> Calculates randomness factor
   └─> Consults Lovable AI (Gemini Flash)
   └─> Decision: LAUNCH, HOLD, or SKIP

3. 🛡️ GOVERNOR BRAIN (Oversight & Approval)
   └─> Reviews proposed action
   └─> Checks guardrails (rate limits, allocations, whale protection)
   └─> Calculates entropy factor
   └─> Decision: APPROVED, REJECTED, MODIFIED, or DEFERRED
   └─> Returns execution payload if approved

4. 🪙 MINT TOKEN (If Approved)
   └─> Creates token on blockchain
   └─> Distributes to wallets (AI, Creator, Lucky, System, Public)
   └─> Logs to protocol_activity

5. 💰 PROFIT REBALANCER (Triggered after launch)
   └─> Analyzes platform metrics
   └─> Consults OpenAI for allocation strategy
   └─> Proposes new profit split percentages
   └─> Submits to allocation manager
```

## Core Components

### 1. AI Mind Agent (`src/ai/agent.ts`)

The brain of the system that:
- Analyzes market conditions every 1-6 hours (randomized)
- Gathers signals from:
  - Recent minter activity
  - Trading volume (24h)
  - DAO participation levels
  - Lucky wallet selections
  - Time since last mint
- Makes intelligent decisions using Claude AI via Lovable AI Gateway
- Falls back to rule-based logic if AI fails

**Key Methods:**
- `analyze()` - Main analysis loop
- `gatherMarketSignals()` - Collects market data
- `makeDecision()` - AI-powered decision making
- `generateClue()` - Creates cryptic hints

### 2. Coin Governor (`src/ai/coinGovernor.ts`)

The execution layer that:
- Creates new tokens when AI approves
- Handles 4-wallet distribution:
  - 7% → AI Wallet
  - 5% → Creator Wallet
  - 3% → Lucky Wallet
  - 2% → System Wallet
  - 83% → Public Supply
- Generates token names, symbols, emojis
- Creates poetic riddles for each token
- Broadcasts cryptic clues before launches
- Triggers lucky wallet lottery

**Key Methods:**
- `launchCoin()` - Main coin creation
- `executeMint()` - Calls mint-token edge function
- `broadcastClue()` - Sends hints to users
- `triggerLuckyLottery()` - Runs lottery selection

### 3. Autonomous Heartbeat (`src/cron/heartbeat.ts`)

The scheduler that:
- Runs at randomized intervals (1-6 hours)
- Wakes the AI Mind Agent
- Executes AI decisions
- Logs all activity
- Can run continuously or via CRON

**Key Methods:**
- `pulse()` - Main execution loop
- `executeDecision()` - Routes decisions to handlers
- `handleCoinCreation()` - Creates new tokens
- `handleCoinTease()` - Broadcasts clues
- `handleProfitSale()` - Sells AI profits
- `handleLottery()` - Runs lucky selection
- `handleWhalePunishment()` - Flags whale accounts

## Edge Functions

### `autonomous-heartbeat` (Entry Point)

**Purpose:** CRON-triggered entry point for autonomous system

**Flow:**
1. Logs heartbeat start
2. Calls `mind-think` to analyze and decide
3. Calls `ai-governor` to execute decision
4. Logs completion

**Configuration:**
```toml
[functions.autonomous-heartbeat]
verify_jwt = false  # Public for CRON access
```

**CRON Setup:**
```sql
-- Run every 3 hours
SELECT cron.schedule(
  'mind9-autonomous-pulse',
  '0 */3 * * *',
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/autonomous-heartbeat',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

### `mind-think` (AI Brain)

**Purpose:** AI-powered decision making using Claude

**Input:** Market data, recent activity, DAO balance

**Output:** Decision object with action, reasoning, data

**Actions:**
- `createCoin` - Mint new token
- `teaseNextCoin` - Broadcast hint
- `sellProfit` - Take profits
- `runLuckyLottery` - Select winner
- `punishWhales` - Flag large holders
- `wait` - Do nothing

### `ai-governor` (Execution Layer)

**Purpose:** Executes AI Mind decisions

**Actions:**
- `token_mint` - Process mint events
- `trade` - Handle trading with 2% fees
- `ai_profit` - Distribute AI profits
- `detect_whale` - Flag whale activity
- `update_dao` - Manage DAO eligibility
- `lucky_lottery` - Run lottery
- `evaluate_market` - Analyze conditions
- `decide_creation` - Coin creation logic

## Profit Routing

### On Coin Creation
```
Total Supply
├── 7% → AI Wallet (autonomous trading)
├── 5% → Creator Wallet (platform fees)
├── 3% → Lucky Wallet (lottery pool)
├── 2% → System Wallet (operations)
└── 83% → Public Supply (distribution)
```

### On Trades (2% Total Fee)
```
Trade Amount
├── 1% → Creator Wallet
└── 1% → System Wallet
```

### On AI Profit Sales
```
AI Profit
├── 80% → Reinvestment Pool
├── 15% → DAO Treasury
├── 3% → Lucky Wallet
└── 2% → Creator Wallet
```

## Security Features

1. **Rate Limiting**
   - Minimum 6 hours between mints
   - Maximum 1-2 tokens per week
   - Prevents spam and maintains scarcity

2. **Whale Detection**
   - Buy > 5% of supply = flagged
   - Sell > 50% in one tx = flagged
   - Auto-excluded from DAO voting

3. **Auth Protection**
   - All coin minting routes are backend-only
   - Never exposed to frontend
   - Service role key required

4. **Atomic Transactions**
   - All database operations are atomic
   - No partial mints or distributions
   - Full rollback on errors

## Database Tables

### Core Tables
- `tokens` - Token registry
- `coin_distributions` - Distribution records
- `protocol_activity` - All system events
- `logs` - Detailed action logs

### Economy Tables
- `creator_wallet_profits` - Creator earnings
- `profit_events` - AI profit distributions
- `trade_fees_log` - All trading fees
- `lucky_wallet_selections` - Lottery winners

### Governance Tables
- `dao_eligibility` - DAO member status
- `dao_treasury` - Treasury balance
- `wallet_activity_log` - All wallet activity

## How to Use

### Manual Trigger
```typescript
import { heartbeat } from '@/cron/heartbeat';

// Run single pulse
await heartbeat.pulse();

// Start continuous monitoring (dev mode)
await heartbeat.startContinuousMonitoring();
```

### CRON Setup (Production)
Set up Supabase CRON job to call `autonomous-heartbeat` edge function every 1-6 hours.

### Frontend Integration
```typescript
// Subscribe to new coins
const channel = supabase
  .channel('tokens')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'tokens'
  }, (payload) => {
    console.log('New token created!', payload.new);
  })
  .subscribe();

// Get latest clues
const { data: clues } = await supabase
  .from('protocol_activity')
  .select('*')
  .eq('activity_type', 'ai_clue_broadcast')
  .order('timestamp', { ascending: false })
  .limit(5);
```

## AI Decision Logic

### Input Signals
- `recentMinters` - Unique wallets minting in 24h
- `volume24h` - Total trading volume
- `daoParticipation` - Active DAO members
- `luckyWalletActivity` - Recent lottery winners
- `totalTokens` - Current token count
- `hoursSinceLastMint` - Time since last token

### Decision Rules

**Create Coin When:**
- High activity (20+ minters, 1000+ volume)
- Been over 1 week since last mint
- AI confidence > 0.8

**Tease Coin When:**
- Moderate activity (10+ minters)
- 48+ hours since last mint
- Building anticipation

**Wait When:**
- Low activity
- Too soon since last mint (< 12h)
- Poor market conditions

## Monitoring

### Logs
All decisions and actions are logged to:
- `protocol_activity` table
- `logs` table
- Console output (visible in edge function logs)

### Query Recent Activity
```sql
SELECT 
  activity_type,
  description,
  metadata,
  timestamp
FROM protocol_activity
WHERE activity_type LIKE 'ai_%'
ORDER BY timestamp DESC
LIMIT 20;
```

### Query AI Decisions
```sql
SELECT 
  details->>'action' as action,
  details->>'confidence' as confidence,
  details->>'reasoning' as reasoning,
  timestamp
FROM logs
WHERE action = 'AI_MIND_DECISION'
ORDER BY timestamp DESC;
```

## Development Tips

1. **Test Mode**: Use `--dry-run` flag with governor-runner.ts
2. **Debug Mode**: Check edge function logs in Supabase dashboard
3. **Local Testing**: Use `heartbeat.pulse()` directly
4. **Monitoring**: Subscribe to protocol_activity table changes

## Future Enhancements

- [ ] Twitter/X integration for hints
- [ ] On-chain transaction execution
- [ ] Advanced whale detection algorithms
- [ ] Multi-model AI comparison
- [ ] Dynamic fee adjustments
- [ ] Community voting on AI actions
- [ ] Real-time price oracles
- [ ] Cross-chain token launches

## Support

For issues or questions about the autonomous system, check:
- Edge function logs in Supabase
- `protocol_activity` table for AI decisions
- `logs` table for detailed actions
- Console output in browser dev tools
