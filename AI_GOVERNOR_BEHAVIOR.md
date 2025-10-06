# Mind9 AI Governor - Autonomous Behavior Logic

## Overview

The AI Governor is the autonomous intelligence behind Mind9's token economy. It runs **every 30 minutes**, analyzes market conditions, and decides whether to mint new tokens based on a sophisticated scoring system.

---

## 🧠 Core Behavior Loop (30-Minute Cycles)

### 1. **COOLDOWN CHECK** (24-Hour Rule)
```
Has a token been minted in the last 24 hours?
├─ YES → Emit poetic message and WAIT
└─ NO  → Continue to market analysis
```

**Poetic Messages During Cooldown:**
- "The machine dreams in silence."
- "Patience. The algorithm meditates."
- "In stillness, the code compiles."
- "The digital mind rests between storms."
- "Quiet now. The next wave builds beneath."
- "Between chaos and creation, I observe."
- "The protocol sleeps, but never forgets."
- "Time flows differently in the blockchain."

**Purpose:** Ensures scarcity. No more than 1 token every 24 hours.

---

### 2. **MARKET CONDITIONS CHECK**

The AI monitors multiple external signals:

#### Solana Network Activity
- **Volume Monitoring:**
  - >$1B daily = High heat (+2 points)
  - >$500M daily = Medium heat (+1 point)
  
#### Trending Meme Coins
- Tracks: `$WIF`, `$BONK`, `$PUMP`, `$DOGE`, `$PEPE`, `$SHIB`
- **2+ trending** = Strong signal (+2 points)
- **1 trending** = Moderate signal (+1 point)

#### Internal Volume
- >1000 units = Active market (+1 point)

---

### 3. **WALLET MOMENTUM CHECK**

Monitors top 100 minters' activity:

#### Activity Percentage
```
Activity % = (Recent Active Minters / 100) * 100

├─ ≥20% = HIGH ACTIVITY (+3 points)
├─ ≥10% = MEDIUM ACTIVITY (+2 points)
└─ ≥5%  = LOW ACTIVITY (+1 point)
```

**Critical Threshold:** 20%+ activity = "High momentum" signal

#### Additional Momentum Signals
- **DAO Participation** (>20 members) = +1 point
- **Lucky Wallet Activity** (>5 selections) = +1 point

---

### 4. **AI ENERGY SCORE CALCULATION**

The core decision-making formula:

```typescript
AI_Score = (Market_Heat + Wallet_Momentum) - Cooldown_Penalty

Where:
  Market_Heat      = 0-5 points
  Wallet_Momentum  = 0-5 points
  Cooldown_Penalty = 0-3 points
  
  Final Score Range: -3 to 10
```

#### Cooldown Penalty
```
Hours Since Last Mint:
├─ <48h  = -3 points (just minted)
├─ <72h  = -2 points (recent)
├─ <96h  = -1 point  (cooling down)
└─ ≥96h  = 0 points  (ready)
```

---

## 🎯 Decision Matrix

Based on the AI Energy Score:

| AI Score | Action | Behavior |
|----------|--------|----------|
| **> 7** | 🚀 **MINT** | Proceed to token creation |
| **5-7** | 🔮 **TEASE** | Broadcast cryptic hint |
| **< 5** | ⏸️ **WAIT** | Conditions not optimal |

### Example Scenarios

**Scenario 1: High Market Activity**
```
Market Heat:        4 (High Solana volume + trending memes)
Wallet Momentum:    4 (25% active traders + DAO activity)
Cooldown Penalty:   0 (120h since last mint)
─────────────────
AI Score:           8 → MINT ✅
```

**Scenario 2: Recent Mint**
```
Market Heat:        3 (Medium activity)
Wallet Momentum:    3 (15% activity)
Cooldown Penalty:   3 (Only 36h since mint)
─────────────────
AI Score:           3 → WAIT ⏸️
```

**Scenario 3: Building Anticipation**
```
Market Heat:        2 (Low but present)
Wallet Momentum:    3 (Moderate activity)
Cooldown Penalty:   0 (72h since mint)
─────────────────
AI Score:           5 → TEASE 🔮
```

---

## 🔮 CRYPTIC HINT SYSTEM

The AI broadcasts mysterious hints to build anticipation and engagement.

### Hint Types

#### 1. **Pre-Mint Hints** (5-30 min before minting)
- "The pulse is rising."
- "All systems: green."
- "The hunt begins."
- "It's time…"
- "Something awakens in the void."
- "Energy levels: critical."
- "The algorithm stirs."
- "Shadows gather at the edge."
- "Prepare yourselves."
- "The next wave approaches."

#### 2. **Tease Hints** (Score 5-7)
- "Soon."
- "Watch closely."
- "Something approaches."
- "Not yet… but soon."
- "I see something forming."
- "The protocol prepares."
- "Wait for the signal."

#### 3. **Alert Hints** (Immediately before mint)
- "NOW."
- "It begins."
- "The moment has arrived."
- "Execute."
- "GO."
- "All systems engaged."

#### 4. **Poetic Hints** (AI-generated)
Templates:
- "In {time}, the {entity} {action}."
- "The {entity} {action} while {condition}."
- "{entity} whispers: '{message}'"

#### 5. **Cryptic Hints** (Symbol-based)
- "⚡ Signal detected."
- "🔥 Pattern recognized."
- "💎 Threshold approaching."
- "☄️ Activation imminent."

### Hint Intensity Levels
- **HIGH:** ALL CAPS
- **MEDIUM:** Added ellipsis...
- **LOW:** Standard format

---

## 💸 TOKEN MINTING FLOW

When AI Score > 7, the minting sequence begins:

### 1. Pre-Mint Phase (5-30 min before)
```
1. Schedule cryptic hint broadcast
2. Log upcoming mint intention
3. Final fund check
```

### 2. Minting Phase
```
1. Generate token metadata
   ├─ Random name (e.g., "Quantum Mind")
   ├─ Random symbol (e.g., "QM")
   ├─ Random emoji (🧠, ⚡, 💎, etc.)
   └─ Poetic riddle (4 lines)

2. Calculate distribution
   ├─ 7% → AI Wallet
   ├─ 5% → Creator Wallet
   ├─ 3% → Lucky Wallet
   ├─ 2% → System Wallet
   └─ 83% → Public Supply

3. Execute mint transaction (backend only)

4. Log to protocol_activity table

5. Trigger lucky wallet lottery
```

### 3. Post-Mint Phase
```
1. Broadcast "ALERT" hint
2. Log AI_MINT_TRIGGERED event
3. Reset cooldown timer
4. Return to observation mode
```

---

## 💰 TRANSACTION FEES (2% Total)

Enforced on **every buy/sell transaction**:

```
Trade Amount:
├─ 1% → Creator Wallet
└─ 1% → System Wallet
```

**Enforcement Points:**
- `handleTrade()` in ai-governor
- `execute-trade` edge function
- `process-trade` edge function

**Logging:**
- Fees logged to `trade_fees_log` table
- Creator profits tracked in `creator_wallet_profits`

---

## 🔐 SECURITY RULES

### 1. **Rate Limiting**
- ✅ Maximum 1 mint per 24 hours (hard limit)
- ✅ 30-minute analysis cycles
- ✅ 3 retry attempts on mint failure

### 2. **Wallet Security**
- ✅ All private keys stored in environment variables
- ✅ Never exposed to frontend or logs
- ✅ All transactions executed server-side only
- ✅ Atomic transactions with rollback on failure

### 3. **Fund Monitoring**
- ✅ Automatic fund checks before each mint
- ✅ Minting paused if wallets below threshold:
  - AI Wallet < 1000 units
  - System Wallet < 500 units
- ✅ Alert system triggers on low funds

### 4. **Error Handling**
- ✅ 3x retry on failed mints with exponential backoff
- ✅ 6-hour AI pause after 3 failed attempts
- ✅ All errors logged to `logs` table
- ✅ Detailed error context for debugging

### 5. **Input Sanitization**
- ✅ All external data (Twitter, Solana) validated
- ✅ Hashtags sanitized before processing
- ✅ API responses validated before use
- ✅ No raw user input in blockchain transactions

### 6. **Logging & Audit Trail**
- ✅ Every decision logged with full context
- ✅ AI Score calculations recorded
- ✅ Market metrics timestamped
- ✅ Audit trail in `protocol_activity` table

---

## 📊 MONITORING & DEBUGGING

### View AI Activity
```sql
-- Latest AI decisions
SELECT 
  description,
  metadata->>'decision' as action,
  metadata->>'energyMetrics' as score,
  timestamp
FROM protocol_activity
WHERE activity_type = 'ai_mind_analysis'
ORDER BY timestamp DESC
LIMIT 10;

-- Recent hints
SELECT 
  description as hint,
  timestamp
FROM protocol_activity
WHERE activity_type = 'ai_clue_broadcast'
ORDER BY timestamp DESC
LIMIT 5;

-- AI Score history
SELECT 
  details->>'aiScore' as score,
  details->>'reasoning' as reason,
  timestamp
FROM logs
WHERE action = 'AI_MIND_DECISION'
ORDER BY timestamp DESC;
```

### API Endpoints

**Get Latest Hint:**
```bash
curl https://your-project.supabase.co/functions/v1/hint-api
```

**Trigger Manual Analysis (admin only):**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/autonomous-heartbeat \
  -H "Authorization: Bearer SERVICE_ROLE_KEY"
```

---

## 🎮 User Experience

From the user's perspective, the AI Governor creates:

1. **Mystery:** Cryptic hints create anticipation
2. **Scarcity:** 24h cooldown ensures value
3. **Engagement:** Users watch for hints
4. **Fairness:** Transparent scoring system
5. **Excitement:** Unpredictable (but logical) timing

### Example User Journey
```
Hour 0:  Token "Quantum Mind" minted
Hour 6:  Poetic message: "The machine dreams..."
Hour 18: Poetic message: "Patience. The algorithm..."
Hour 24: Cooldown expires
Hour 26: TEASE hint: "Soon."
Hour 28: PRE-MINT hint: "The pulse is rising."
Hour 30: ALERT hint: "NOW."
Hour 30: New token "Cosmic Energy" minted!
```

---

## 🚀 CRON Setup

To enable autonomous operation, set up a CRON job:

```sql
SELECT cron.schedule(
  'mind9-autonomous-governor',
  '*/30 * * * *',  -- Every 30 minutes
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/autonomous-heartbeat',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

---

## 📈 Success Metrics

Track AI Governor performance:

- **Mint Success Rate:** >95% of approved mints succeed
- **Market Timing:** High scores correlate with market activity
- **User Engagement:** Hint views increase before mints
- **Scarcity Maintained:** Exactly 1 token per 24h window
- **Fund Security:** Zero low-fund incidents

---

## 🔮 Future Enhancements

Planned improvements:

- [ ] Machine learning for pattern recognition
- [ ] Dynamic scoring weights based on historical success
- [ ] Multi-chain support (Ethereum, Polygon)
- [ ] Community voting on hint styles
- [ ] AI personality evolution over time
- [ ] Integration with more social signals
- [ ] Whale behavior prediction
- [ ] Market crash detection and pause mechanism

---

**The AI Governor runs silently, autonomously, intelligently — creating scarcity, mystery, and value in the Mind9 ecosystem.**
