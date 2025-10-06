# Mind9 API Endpoints

## Public Endpoints

### 1. Get Latest Hint/Clue

**Endpoint:** `GET /functions/v1/hint-api`

**Description:** Returns the latest cryptic hint from the AI Mind

**Authentication:** None (public)

**Response:**
```json
{
  "success": true,
  "hint": "Tomorrow's chaos will come from fire.",
  "timestamp": "2025-01-06T12:00:00Z",
  "context": {
    "aiMood": "createCoin",
    "lastMint": {
      "name": "Quantum Mind",
      "symbol": "QM",
      "hoursAgo": 18
    },
    "recentClues": [
      {
        "hint": "Tomorrow's chaos will come from fire.",
        "time": "2025-01-06T12:00:00Z"
      },
      {
        "hint": "Three wallets woke up early this morning.",
        "time": "2025-01-05T08:00:00Z"
      }
    ]
  }
}
```

**Example Usage:**
```bash
curl https://your-project.supabase.co/functions/v1/hint-api
```

```typescript
// Frontend usage
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/hint-api'
);
const data = await response.json();
console.log('Latest hint:', data.hint);
```

---

## Internal/Protected Endpoints

### 2. Autonomous Heartbeat

**Endpoint:** `POST /functions/v1/autonomous-heartbeat`

**Description:** Triggers the AI Mind's autonomous analysis and decision-making

**Authentication:** Service role key (CRON only)

**Response:**
```json
{
  "success": true,
  "decision": {
    "action": "createCoin",
    "reasoning": "High market activity detected",
    "data": {
      "name": "Cosmic Energy",
      "symbol": "COSM",
      "supply": 1000000000
    }
  },
  "execution": {
    "success": true,
    "tokenId": "uuid-here"
  },
  "timestamp": "2025-01-06T12:30:00Z"
}
```

**CRON Setup:**
```sql
-- Run every 30 minutes
SELECT cron.schedule(
  'mind9-autonomous-pulse',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/autonomous-heartbeat',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

---

### 3. Fetch Twitter Trends

**Endpoint:** `POST /functions/v1/fetch-twitter-trends`

**Description:** Fetches trending crypto/Solana hashtags from Twitter

**Authentication:** Service role key

**Response:**
```json
{
  "success": true,
  "trends": [
    "#Solana",
    "#DeFi",
    "#Crypto",
    "#Web3"
  ],
  "timestamp": "2025-01-06T12:00:00Z",
  "source": "twitter_api"
}
```

---

### 4. Fetch Solana Metrics

**Endpoint:** `POST /functions/v1/fetch-solana-metrics`

**Description:** Fetches Solana on-chain metrics (volume, wallets, TPS)

**Authentication:** Service role key

**Response:**
```json
{
  "success": true,
  "volume24h": 650000000,
  "activeWallets": 9500,
  "transactionCount": 2150000,
  "avgTPS": 2450,
  "networkLoad": "high",
  "timestamp": "2025-01-06T12:00:00Z",
  "source": "solana_rpc"
}
```

---

### 5. Mint Token

**Endpoint:** `POST /functions/v1/mint-token`

**Description:** Mints a new SPL token with 4-wallet distribution

**Authentication:** Service role key

**Request:**
```json
{
  "name": "Quantum Mind",
  "symbol": "QM",
  "supply": 1000000000,
  "creator_address": "CREATOR_WALLET_ADDRESS",
  "metadata": "{...}"
}
```

**Response:**
```json
{
  "success": true,
  "token": {
    "id": "uuid-here",
    "name": "Quantum Mind",
    "symbol": "QM",
    "supply": 1000000000
  },
  "distribution": {
    "ai": 70000000,
    "creator": 50000000,
    "lucky": 30000000,
    "system": 20000000,
    "public": 830000000
  }
}
```

---

### 6. AI Governor

**Endpoint:** `POST /functions/v1/ai-governor`

**Description:** Executes AI Mind decisions (mint, trade, lottery, etc.)

**Authentication:** Service role key

**Request:**
```json
{
  "action": "decide_creation",
  "data": {
    "tokenId": "uuid-here"
  },
  "prompt": "Create new token based on market conditions"
}
```

**Response:**
```json
{
  "success": true,
  "action": "coin_creation_decision",
  "decision": "create",
  "marketCondition": {
    "totalTokens": 5,
    "totalVolume24h": 1250000,
    "trend": "bullish"
  }
}
```

---

## Security Notes

1. **Public Endpoints:**
   - `/hint-api` is the ONLY public endpoint
   - No authentication required
   - Rate limited by Supabase

2. **Protected Endpoints:**
   - All other endpoints require service role key
   - Never expose service role key to frontend
   - Use CRON jobs for autonomous triggers

3. **Wallet Security:**
   - All wallet addresses stored in environment variables
   - Never exposed to frontend or logs
   - Transactions happen server-side only

4. **Rate Limiting:**
   - Heartbeat runs every 30 minutes (CRON)
   - Minting limited to max 1 per 24 hours
   - Market analysis cached for 30 minutes

---

## Environment Variables Required

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Wallets
CREATOR_WALLET_ADDRESS=your-creator-wallet
SYSTEM_WALLET_ADDRESS=your-system-wallet

# External APIs (optional for now)
TWITTER_BEARER_TOKEN=your-twitter-token
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# AI
LOVABLE_API_KEY=auto-configured
```

---

## Testing Endpoints

### Test Hint API (curl)
```bash
curl https://your-project.supabase.co/functions/v1/hint-api
```

### Test Heartbeat (with service key)
```bash
curl -X POST https://your-project.supabase.co/functions/v1/autonomous-heartbeat \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### Frontend Integration
```typescript
// Get latest hint
async function getLatestHint() {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hint-api`
  );
  return response.json();
}

// Display in UI
const hintData = await getLatestHint();
console.log('AI says:', hintData.hint);
```
