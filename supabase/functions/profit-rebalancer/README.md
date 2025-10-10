# Profit Rebalancer - Dynamic Allocation Manager

AI-powered profit allocation optimizer that analyzes platform metrics and suggests optimal profit split adjustments.

## 🎯 Overview

Instead of hardcoded 80/15/3/2 splits, the profit rebalancer allows the AI to dynamically adjust allocation percentages based on:

- **Community Growth**: Increasing/decreasing user activity
- **Engagement Levels**: Wallet connections, trades, page views
- **Token Performance**: Price trends and market health
- **DAO Treasury**: Balance and governance capacity

All suggestions are logged and require review before activation (governance integration coming soon).

## 📊 How It Works

```
Metrics Analysis → AI Optimization → Proposal Creation → Review → Activation
```

### 1. Metrics Analysis
The rebalancer gathers:
- Engagement scores (wallet connections, trades, views)
- Token performance (prices, volume, holder growth)
- DAO treasury balance
- Community growth rate (7-day comparison)
- Current active allocation

### 2. AI Optimization
OpenAI GPT-4o-mini analyzes metrics and suggests:
- New allocation percentages (must sum to 100%)
- Reasoning for changes
- Confidence score (0-1)
- Whether to rebalance or maintain current split

### 3. Proposal Creation
If rebalancing recommended:
- Creates proposal in `profit_allocation_log`
- Validates percentages and ranges
- Logs to `protocol_activity` for transparency

### 4. Review & Activation
Proposals must be reviewed before activation:
- Review can approve or reject
- Approved proposals become active immediately
- Old allocation is deactivated
- History is preserved

## 💰 Allocation Breakdown

Current categories:
- **Reinvestment** (40-90%): System wallet for operations and growth
- **DAO Treasury** (5-30%): Governance and community funding
- **Lucky Lottery** (1-15%): User engagement rewards
- **Creator Rewards** (1-10%): Builder incentives

## 🔧 Usage

### Analyze and Suggest (Manual)

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/profit-rebalancer
```

Response:
```json
{
  "success": true,
  "should_rebalance": true,
  "current_allocation": {
    "reinvestment": 80,
    "dao": 15,
    "lucky": 3,
    "creator": 2
  },
  "suggested_allocation": {
    "reinvestment": 70,
    "dao": 20,
    "lucky": 7,
    "creator": 3
  },
  "reasoning": "Community growth is strong (+45%), increasing lucky and creator rewards to capitalize on momentum",
  "confidence": 0.85,
  "proposal_id": "uuid"
}
```

### Schedule Automatic Analysis

Run every 24 hours via Supabase cron:

```sql
SELECT cron.schedule(
  'profit-rebalancer-daily',
  '0 0 * * *',  -- Daily at midnight
  $$
  SELECT net.http_post(
    url:='https://PROJECT_ID.supabase.co/functions/v1/profit-rebalancer',
    headers:='{"Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

### Programmatic Usage

```typescript
import { createClient } from '@supabase/supabase-js';
import { createAllocationManager } from './_shared/allocation-manager';

const supabase = createClient(url, serviceKey);
const allocMgr = createAllocationManager(supabase);

// Get current allocation
const current = await allocMgr.getCurrentAllocation();
console.log('Current:', current);

// Get pending proposals
const pending = await allocMgr.getPendingProposals();
console.log('Pending:', pending);

// Review a proposal
await allocMgr.reviewProposal(
  'proposal-id',
  'approved',
  'governor_ai',
  'Metrics support this change'
);
```

## 📋 Database Schema

### profit_allocation_log

Tracks all allocation proposals and history:

```sql
CREATE TABLE profit_allocation_log (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT now(),
  status TEXT CHECK (status IN ('proposed', 'active', 'rejected')),
  proposed_by TEXT CHECK (proposed_by IN ('ai', 'manual', 'system')),
  
  -- Allocation percentages (must sum to 100)
  reinvestment_pct NUMERIC CHECK (0 <= reinvestment_pct <= 100),
  dao_pct NUMERIC CHECK (0 <= dao_pct <= 100),
  lucky_pct NUMERIC CHECK (0 <= lucky_pct <= 100),
  creator_pct NUMERIC CHECK (0 <= creator_pct <= 100),
  
  reasoning TEXT,
  confidence NUMERIC CHECK (0 <= confidence <= 1),
  input_metrics JSONB,
  
  -- Review tracking
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  review_notes TEXT,
  
  -- Effective dates
  effective_from TIMESTAMPTZ,
  effective_until TIMESTAMPTZ,
  
  CONSTRAINT valid_total CHECK (
    reinvestment_pct + dao_pct + lucky_pct + creator_pct = 100
  )
);
```

## 🔍 Query Examples

### Get Current Active Allocation
```sql
SELECT * FROM profit_allocation_log
WHERE status = 'active'
ORDER BY effective_from DESC
LIMIT 1;
```

### View Allocation History
```sql
SELECT 
  timestamp,
  status,
  proposed_by,
  reinvestment_pct || '/' || dao_pct || '/' || lucky_pct || '/' || creator_pct as split,
  reasoning,
  confidence
FROM profit_allocation_log
ORDER BY timestamp DESC
LIMIT 20;
```

### Pending Proposals
```sql
SELECT * FROM profit_allocation_log
WHERE status = 'proposed'
ORDER BY timestamp DESC;
```

### Allocation Changes Over Time
```sql
SELECT 
  DATE(effective_from) as date,
  reinvestment_pct,
  dao_pct,
  lucky_pct,
  creator_pct
FROM profit_allocation_log
WHERE status = 'active'
ORDER BY effective_from;
```

## 🛡️ Safety Features

### 1. Validation Rules
- Percentages must sum to exactly 100%
- Each category has min/max bounds
- Confidence score required (0-1)
- Reasoning text mandatory

### 2. Review Process
- All AI proposals start as 'proposed'
- Require explicit approval to become 'active'
- Can be rejected with notes
- Full audit trail maintained

### 3. Warnings System
The validator flags potential issues:
- Reinvestment <40%: May reduce sustainability
- Reinvestment >90%: May reduce incentives
- DAO <5%: May limit governance
- Lucky <1%: May reduce engagement
- Creator <1%: May reduce builder activity

### 4. Historical Tracking
- All allocations preserved forever
- Can analyze what worked/didn't
- Effective date ranges tracked
- Proposal metadata stored

## 📈 Integration with Other Modules

### With manage-profits Function
```typescript
// In manage-profits, use dynamic allocation:
const allocMgr = createAllocationManager(supabase);
const allocation = await allocMgr.getCurrentAllocation();
const amounts = allocMgr.calculateAmounts(totalProfit, allocation);

// Distribute using current active split
await distributeToWallets(amounts);
```

### With AI Decision Engine
```typescript
// AI Decision Engine can trigger rebalancing
const { data } = await supabase.functions.invoke('profit-rebalancer');

if (data.should_rebalance) {
  console.log('New allocation proposed:', data.proposal_id);
  // Notify governance or auto-approve based on confidence
}
```

### With Governor Function (Coming Soon)
```typescript
// Governor reviews and approves/rejects proposals
const proposals = await allocMgr.getPendingProposals();

for (const proposal of proposals) {
  const decision = await aiGovernor.reviewAllocation(proposal);
  await allocMgr.reviewProposal(
    proposal.id,
    decision.approved ? 'approved' : 'rejected',
    'ai_governor',
    decision.reasoning
  );
}
```

## 🎮 Example Scenarios

### Scenario 1: Rapid Growth
**Metrics:**
- Community growth: +50% (7-day)
- Engagement: High (score 85)
- DAO balance: $3000 (healthy)

**AI Suggestion:**
```
Reinvestment: 80% → 65%
DAO: 15% → 18%
Lucky: 3% → 10%
Creator: 2% → 7%

Reasoning: "Strong growth momentum detected. Increasing lucky and creator rewards to capitalize on user and builder engagement. DAO treasury healthy, maintaining moderate allocation."
Confidence: 0.90
```

### Scenario 2: Declining Activity
**Metrics:**
- Community growth: -20%
- Engagement: Low (score 25)
- Token performance: Poor (avg price 0.005)

**AI Suggestion:**
```
Reinvestment: 80% → 85%
DAO: 15% → 10%
Lucky: 3% → 3%
Creator: 2% → 2%

Reasoning: "Activity declining. Prioritizing reinvestment to improve platform features and marketing. Reducing DAO allocation temporarily to build treasury through improved operations."
Confidence: 0.75
```

### Scenario 3: DAO Treasury Low
**Metrics:**
- DAO balance: $200 (critically low)
- Community growth: Stable
- Engagement: Medium

**AI Suggestion:**
```
Reinvestment: 80% → 70%
DAO: 15% → 23%
Lucky: 3% → 4%
Creator: 2% → 3%

Reasoning: "DAO treasury critically low ($200). Significantly increasing DAO allocation to ensure governance capacity. Slightly reducing reinvestment to prioritize treasury replenishment."
Confidence: 0.88
```

## 🚀 Future Enhancements

### Phase 1: Basic Governor (Current)
- ✅ AI analyzes metrics
- ✅ Proposes allocations
- ✅ Creates proposals
- ⏳ Manual review required

### Phase 2: Automated Governor
- 🔄 AI Governor reviews proposals
- 🔄 Auto-approve high-confidence suggestions
- 🔄 Multi-signature for large changes
- 🔄 Governance voting integration

### Phase 3: Advanced Features
- 🔮 Machine learning from historical performance
- 🔮 Predictive allocation optimization
- 🔮 A/B testing different allocations
- 🔮 Community voting on proposals

## 📊 Monitoring

### Key Metrics to Track
```sql
-- Average confidence of AI suggestions
SELECT AVG(confidence) FROM profit_allocation_log
WHERE proposed_by = 'ai' AND timestamp > now() - interval '30 days';

-- Approval rate
SELECT 
  COUNT(*) FILTER (WHERE status = 'active') * 100.0 / COUNT(*) as approval_rate
FROM profit_allocation_log
WHERE proposed_by = 'ai' AND timestamp > now() - interval '30 days';

-- Current vs historical allocation
SELECT 
  'current' as period,
  reinvestment_pct, dao_pct, lucky_pct, creator_pct
FROM profit_allocation_log
WHERE status = 'active'
UNION ALL
SELECT 
  '30d_avg',
  AVG(reinvestment_pct), AVG(dao_pct), AVG(lucky_pct), AVG(creator_pct)
FROM profit_allocation_log
WHERE status = 'active' AND effective_from > now() - interval '30 days';
```

## 🆘 Troubleshooting

### Issue: AI always suggests same allocation
**Solution**: Check if metrics are updating. Verify engagement tracking is working.

### Issue: Proposals fail validation
**Solution**: Check that percentages sum to exactly 100. Review min/max bounds.

### Issue: No proposals being created
**Solution**: AI may determine current allocation is optimal. Check `should_rebalance: false` in response.

### Issue: Can't approve proposal
**Solution**: Verify proposal ID exists and status is 'proposed'. Check for database errors.

## 📚 Related Documentation

- [Allocation Manager API](../_shared/allocation-manager.ts)
- [Manage Profits Function](../manage-profits)
- [AI Decision Engine](../ai-decision-engine)
- [Protocol Activity Logs](../../database/protocol_activity)
