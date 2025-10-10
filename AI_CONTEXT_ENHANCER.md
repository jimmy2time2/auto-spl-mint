# AI Context Enhancer

## Overview

The AI Context Enhancer analyzes historical performance data to provide insights that improve AI decision-making in the token launch system.

## Architecture

### Context Builder (`context-builder.ts`)

Available in two versions:
- **Frontend**: `src/ai/context-builder.ts` - For use in React components
- **Backend**: `supabase/functions/_shared/context-builder.ts` - For use in edge functions

### Data Sources

The context builder analyzes:

1. **Last 20 Token Launches** (`tokens` table)
   - Launch timestamps
   - Volume metrics
   - Holder counts

2. **Trading Volume** (`trade_fees_log` table)
   - Trade amounts
   - Historical patterns

3. **Lottery Winners** (`lucky_wallet_selections` table)
   - Winner distribution
   - Wallet diversity

## Metrics Provided

```typescript
interface AIContext {
  launch_success_rate: number;        // % of tokens with volume > 0
  avg_volume: number;                 // Average trade volume per token
  total_volume_24h: number;           // Total 24h volume across tokens
  winner_diversity: "low" | "medium" | "high"; // Lottery winner spread
  recent_token_count: number;         // Number of recent tokens
  avg_holders_per_token: number;      // Average holder count
  top_performing_tokens: Array<{      // Best performers
    symbol: string;
    volume: number;
  }>;
  lottery_stats: {
    total_winners: number;
    unique_wallets: number;
    avg_distribution: number;
  };
}
```

## Integration

### In AI Decision Engine

The context is built before making AI decisions:

```typescript
// Step 2.5: Build AI context
const aiContext = await buildAIContext(supabase);

// Step 3: Make decision with context
const aiDecision = await makeAIDecision(
  marketSignals,
  randomnessFactor,
  supabase,
  aiContext  // Optional context parameter
);
```

### Context in AI Prompt

When context is available, it's injected into the AI prompt:

```
PERFORMANCE CONTEXT:
- Launch Success Rate: 85.0% (last 20 tokens)
- Average Volume: 1200.50
- Total 24h Volume: 24010.00
- Winner Diversity: medium
- Recent Token Count: 20
- Avg Holders per Token: 45
- Lottery Winners: 15 (12 unique)
- Top Performers: MOON ($5000), DOGE ($3200), ...
```

## Impact on Decision-Making

The AI uses this context to:

1. **Assess Market Health**
   - High success rate → More aggressive launches
   - Low volume → More conservative approach

2. **Learn from History**
   - Identify what works (top performers)
   - Avoid patterns that fail

3. **Optimize Timing**
   - Consider recent launch frequency
   - Balance volume distribution

4. **Evaluate Fairness**
   - Monitor winner diversity
   - Adjust lottery mechanics

## Usage Examples

### Frontend (React)

```typescript
import { buildAIContext } from "@/ai/context-builder";

const context = await buildAIContext();
console.log(`Success rate: ${context.launch_success_rate * 100}%`);
```

### Backend (Edge Function)

```typescript
import { buildAIContext } from "../_shared/context-builder.ts";

const context = await buildAIContext(supabase);
console.log(`Recent tokens: ${context.recent_token_count}`);
```

## Error Handling

If any data source fails, the context builder returns safe defaults:

```typescript
{
  launch_success_rate: 0,
  avg_volume: 0,
  // ... all metrics set to zero/empty
}
```

This ensures the AI decision engine continues to function even if performance analysis fails.

## Future Enhancements

1. **Trending Analysis**
   - Detect upward/downward trends
   - Momentum indicators

2. **Predictive Metrics**
   - Success probability by time of day
   - Optimal launch windows

3. **Comparative Analysis**
   - Compare current context to historical averages
   - Anomaly detection

4. **Adaptive Learning**
   - Store successful decision patterns
   - Reinforce winning strategies
