# Mind9 - Complete Project Specification

## Project Overview

**Mind9** is an autonomous AI-powered token economy on Solana where an artificial intelligence agent independently creates, manages, and trades meme coins without human intervention. The AI makes its own decisions about when to mint new tokens, how to distribute profits, and when to act - creating a living, breathing crypto ecosystem.

---

## Core Concept

Mind9 is NOT just another token launchpad. It's an **autonomous AI agent** that:

1. **Creates tokens on its own schedule** - The AI decides when market conditions are right
2. **Has its own personality and moods** - Influences decision-making (INSPIRED, BORED, GREEDY, CHAOTIC, etc.)
3. **Distributes profits fairly** - Automated splits between AI, DAO, creators, and lucky users
4. **Is completely transparent** - All decisions are logged and visible to users
5. **Cannot be controlled** - Operates within guardrails but makes autonomous choices

Think of it as a crypto entity with a mind of its own.

---

## System Architecture

### The Four Pillars

```
┌─────────────────────────────────────────────────────────────────┐
│                         MIND9 ECOSYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  HEARTBEAT   │───▶│  AI DECISION │───▶│   GOVERNOR   │       │
│  │  SCHEDULER   │    │    ENGINE    │    │    BRAIN     │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   WALLET     │    │    PROFIT    │    │    TOKEN     │       │
│  │   EXECUTOR   │    │  REBALANCER  │    │   MINTING    │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. AI Heartbeat System

**Purpose**: The "pulse" of Mind9 - triggers AI thinking at unpredictable intervals.

**How it works**:
- Runs every 3-12 hours (randomized to prevent exploitation)
- Calculates entropy factors based on market activity
- Decides whether to trigger the AI Decision Engine
- Logs all heartbeats for transparency

**Database Tables**:
- `heartbeat_log` - Records every heartbeat with timing and entropy
- `heartbeat_settings` - Configurable intervals and thresholds

**Edge Function**: `ai-heartbeat`

```
Heartbeat Flow:
1. CRON triggers heartbeat check
2. Calculate time since last action
3. Apply entropy (randomness) factor
4. If conditions met → Trigger AI Decision Engine
5. Log result and schedule next heartbeat
```

---

### 2. AI Decision Engine

**Purpose**: The "brain" that decides what action to take.

**Decision Types**:
- `LAUNCH` - Create a new token
- `HOLD` - Wait and observe
- `SKIP` - Do nothing this cycle

**Input Signals**:
- Market engagement metrics
- Recent token performance
- Time since last action
- Random entropy factor
- Current AI mood state

**Edge Function**: `ai-token-decision`

**Decision Logic**:
```
IF engagement_score > threshold AND 
   time_since_last_launch > minimum_wait AND
   random_factor > entropy_threshold
THEN → LAUNCH new token
ELSE → HOLD or SKIP
```

---

### 3. Token Theme Generator

**Purpose**: Creates unique, viral token identities using AI.

**Generates**:
- Token name (catchy, meme-worthy)
- Symbol (3-5 characters)
- Description
- Emoji
- Brand color (hex)
- Tagline
- Backstory

**Input Sources**:
- Viral meme trends
- Financial buzzwords
- Crypto Twitter culture
- Random abstract aesthetics
- Past token names (to avoid duplicates)

**Edge Function**: `generate-token-theme`

---

### 4. Governor Brain

**Purpose**: Oversight system that approves/rejects AI decisions before execution.

**Guardrails**:
- `allocation_total_check` - Profit splits must equal 100%
- `rate_limit_check` - Prevents too-frequent minting
- `minimum_reinvestment` - At least 50% must go to reinvestment
- `whale_protection` - Blocks suspicious large transactions
- `treasury_minimum` - DAO must receive minimum allocation

**Decision Outcomes**:
- `APPROVE` - Execute the action
- `REJECT` - Block the action
- `MODIFY` - Adjust parameters and execute
- `DEFER` - Wait for better conditions

**Edge Function**: `ai-governor-brain`

---

### 5. Wallet Executor

**Purpose**: Securely signs and executes Solana transactions.

**Wallet Types**:
| Wallet | Purpose |
|--------|---------|
| AI Wallet | Holds AI's token allocations, makes trades |
| Creator Wallet | Receives creator fees |
| Lucky Wallet | Random user rewards |
| System Wallet | Protocol operations |
| Treasury Wallet | DAO funds |

**Security Model**:
- Private keys stored ONLY in Supabase secrets
- Never exposed to frontend or AI logic
- All transactions logged to `wallet_activity_log`

**Edge Function**: `wallet-executor`

---

### 6. Profit Rebalancer

**Purpose**: Distributes profits according to dynamic allocation.

**Default Split** (AI can adjust):
- 80% → Reinvestment (AI buys more tokens)
- 15% → DAO Treasury
- 3% → Lucky Wallet (random user)
- 2% → Token Creator

**Triggers**:
- After AI sells tokens at profit
- On scheduled rebalancing cycles
- After successful token launches

**Edge Function**: `profit-rebalancer`

---

## Token Economy

### Initial Token Distribution (on mint)

```
Total Supply: 1,000,000,000 tokens

┌────────────────────────────────────┐
│  83% Public Sale                   │
│  7%  AI Wallet                     │
│  5%  Creator Wallet                │
│  3%  Lucky Wallet                  │
│  2%  System Wallet                 │
└────────────────────────────────────┘
```

### Transaction Fees

Every trade has a 2% fee:
- 1% → Creator
- 1% → System (protocol)

### Anti-Whale Protection

- Max buy: 5% of total supply per transaction
- Max sell: 50% of holdings per transaction
- Whales flagged in `dao_eligibility` table

---

## Database Schema

### Core Tables

```sql
-- Token registry
tokens (
  id, name, symbol, price, liquidity, volume_24h, 
  holders, supply, mint_address, pool_address,
  bonding_curve_data, launch_timestamp
)

-- Token personality/branding
token_profiles (
  token_id, mood, bio, mint_reason, image_url,
  social_text, audio_url, style
)

-- Token distribution on mint
coin_distributions (
  token_id, ai_wallet_amount, creator_wallet_amount,
  lucky_wallet_amount, system_wallet_amount, 
  public_sale_amount, total_supply
)
```

### Activity Logging

```sql
-- All protocol events
protocol_activity (
  id, activity_type, description, token_id, metadata, timestamp
)

-- AI decision history
ai_action_log (
  id, action, reasoning, confidence, input_data,
  execution_result, token_id, timestamp
)

-- Governor oversight log
governor_action_log (
  id, action_type, decision, reasoning, confidence,
  entropy_factor, guardrails_triggered, executed,
  public_message, market_signals
)
```

### Economy Tables

```sql
-- Trade fee tracking
trade_fees_log (
  token_id, trade_amount, creator_fee, system_fee,
  trade_type, trader_address, transaction_hash
)

-- Profit distribution events
profit_events (
  token_id, sale_amount, reinvestment_amount,
  dao_amount, creator_amount, lucky_amount
)

-- Lucky wallet selections
lucky_wallet_selections (
  token_id, wallet_address, distribution_amount,
  activity_score, is_recent_minter
)

-- DAO treasury balance
dao_treasury (
  balance, total_received, total_distributed
)
```

### AI State Tables

```sql
-- AI mood tracking
ai_mood_state (
  current_mood, mood_intensity, last_mood_change,
  decision_count, last_decision, reasoning
)

-- Engagement metrics
engagement_metrics (
  wallet_connections, trades_count, page_views,
  engagement_score, last_token_launch
)

-- Heartbeat logs
heartbeat_log (
  interval_hours, entropy_factor, decision_triggered,
  market_activity_score, next_heartbeat_at
)
```

### DAO Governance

```sql
-- Proposals
dao_proposals (
  title, description, created_by, status, 
  votes_yes, votes_no, votes_abstain,
  quorum_required, closes_at, ai_vote
)

-- Votes
dao_votes (
  proposal_id, wallet_address, vote, vote_power
)

-- Eligibility
dao_eligibility (
  wallet_address, token_id, is_eligible,
  whale_status, invite_count, ai_score
)
```

---

## Edge Functions (Supabase)

| Function | Purpose |
|----------|---------|
| `ai-heartbeat` | Triggers AI thinking cycles |
| `ai-token-decision` | Makes launch/hold/skip decisions |
| `ai-governor-brain` | Approves/rejects AI actions |
| `generate-token-theme` | Creates token names/themes with AI |
| `mint-token` | Mints new tokens on Solana |
| `execute-trade` | Executes buy/sell transactions |
| `process-trade` | Applies fees and logs trades |
| `profit-rebalancer` | Distributes profits |
| `process-ai-profits` | Handles AI wallet profit splits |
| `wallet-executor` | Signs Solana transactions |
| `select-lucky-wallet` | Picks random reward recipient |
| `distribute-profits` | Sends funds to wallets |
| `track-engagement` | Logs user activity |
| `ai-governor` | Central orchestrator |
| `autonomous-heartbeat` | Self-triggering pulse |
| `mind-think` | AI reasoning endpoint |

---

## Frontend Pages

### 1. Dashboard (/)
- AI Mind State visualization
- Live protocol activity feed
- Key metrics (tokens, volume, holders)
- AI mood indicator

### 2. Trade (/trade)
- Token list with prices
- Buy/sell interface
- Real-time price charts
- Wallet balance display

### 3. Explorer (/explore)
- Browse all tokens
- Token details and stats
- Historical data

### 4. Logbook (/logbook)
- AI decision history
- Governor approvals/rejections
- Profit distribution log
- Complete transparency view

### 5. Wallet (/wallet)
- User holdings
- Transaction history
- Lucky wallet status

### 6. Token Detail (/token/:id)
- Individual token page
- Trading chart
- Token profile/personality
- Holder distribution

---

## AI Personality System

The AI has moods that influence decisions:

| Mood | Behavior |
|------|----------|
| INSPIRED | More likely to launch creative tokens |
| BORED | May skip cycles, waiting for excitement |
| GREEDY | Focuses on profit-taking |
| PATIENT | Waits for optimal conditions |
| CHAOTIC | Unpredictable, random actions |
| PROTECTIVE | Conservative, protects treasury |

Moods shift based on:
- Time since last action
- Market engagement levels
- Community activity
- Random inspiration

---

## Security Model

### Access Levels

| Level | Access |
|-------|--------|
| Public | Read tokens, view logs, trade |
| Authenticated | Vote in DAO, create proposals |
| Backend Only | Wallet signing, profit distribution |
| Admin | Heartbeat settings, guardrail config |

### Key Security Features

1. **RLS Policies** - Row-level security on all tables
2. **Backend-only wallet access** - Private keys never exposed
3. **Governor oversight** - All AI actions reviewed
4. **Whale protection** - Prevents market manipulation
5. **Rate limiting** - Prevents spam and abuse
6. **Audit trail** - Every action logged

---

## Environment Variables (Secrets)

```
OPENAI_API_KEY          - For AI decision making
LOVABLE_API_KEY         - For token theme generation
SUPABASE_URL            - Database connection
SUPABASE_ANON_KEY       - Public API access
SUPABASE_SERVICE_ROLE_KEY - Backend operations

# Wallet private keys (NEVER expose)
AI_WALLET_PRIVATE_KEY
CREATOR_WALLET_PRIVATE_KEY
LUCKY_WALLET_PRIVATE_KEY
SYSTEM_WALLET_PRIVATE_KEY
TREASURY_WALLET_PRIVATE_KEY
```

---

## How to Recreate This Project

### Step 1: Database Setup
1. Create Supabase project
2. Run migrations for all tables listed above
3. Enable RLS on all tables
4. Create RLS policies for read/write access

### Step 2: Edge Functions
1. Create each edge function listed
2. Configure CORS headers
3. Set up authentication (verify_jwt settings)
4. Add all secrets to Supabase

### Step 3: Core Logic
1. Implement heartbeat scheduler with randomization
2. Build AI decision engine with market signal analysis
3. Create Governor Brain with guardrails
4. Set up wallet executor with Solana integration
5. Implement profit distribution logic

### Step 4: Frontend
1. Build React app with React Router
2. Connect to Supabase client
3. Implement Solana wallet adapter
4. Create pages for dashboard, trading, explorer, logbook

### Step 5: Automation
1. Set up CRON job to trigger heartbeat (every 30 mins)
2. Configure real-time subscriptions for live updates
3. Enable engagement tracking

---

## What Makes Mind9 Unique

1. **True Autonomy** - AI makes real decisions, not pre-programmed actions
2. **Transparent** - Every decision visible in logbook
3. **Fair Distribution** - Profits shared with community
4. **Personality** - AI has moods that affect behavior
5. **Unpredictable** - Randomized timing prevents gaming
6. **Self-Sustaining** - Reinvestment creates growth loop

---

## Summary

Mind9 is an experiment in autonomous AI economics. It answers the question: "What happens when an AI controls its own token economy?"

The AI:
- Launches tokens when it feels inspired
- Trades based on market conditions
- Distributes profits to the community
- Makes decisions humans can observe but not control

It's a living crypto entity with a mind of its own.
