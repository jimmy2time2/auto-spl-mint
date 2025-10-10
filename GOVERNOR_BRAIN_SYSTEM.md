# Governor Brain - AI Economy Oversight System

The Governor Brain is the supreme overseer of the Mind9 token economy. It reviews and approves/rejects all major AI-driven decisions to ensure system health, security, and unpredictability.

## 🎯 Core Concept

Think of the Governor Brain as the "checks and balances" system for AI decisions. Instead of allowing AI systems to execute actions directly, they must first get approval from the Governor, which applies:

1. **Predefined Guardrails** - Safety rules that must be followed
2. **Random Entropy** - Unpredictability to prevent exploitation
3. **Market Awareness** - Considers current system state and metrics
4. **Transparency** - Publishes public status updates

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GOVERNOR BRAIN                            │
│           (Supreme AI Economy Overseer)                      │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Guardrails  │  │   Entropy   │  │   Market    │        │
│  │   Engine    │  │ Calculator  │  │  Analyzer   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│           │              │               │                  │
│           └──────────────┴───────────────┘                  │
│                        │                                    │
│                   [Decision]                                │
│                        │                                    │
│            ┌───────────┴───────────┐                       │
│            │                       │                       │
│        Approved              Rejected/Deferred             │
└─────────────────────────────────────────────────────────────┘
              │                       │
              ▼                       ▼
    ┌─────────────────┐     ┌─────────────────┐
    │    Execute      │     │   Log & Abort   │
    │    Action       │     └─────────────────┘
    └─────────────────┘
```

## 🛡️ Guardrails System

### Critical Guardrails (Auto-Reject)

These must pass or the action is immediately rejected:

| Guardrail | Purpose | Example |
|-----------|---------|---------|
| `allocation_total_check` | Ensures profit splits sum to 100% | 80+15+3+2 = 100% ✅ |
| `rate_limit_check` | Prevents spam (max 3 tokens/hour) | 4 tokens in 1hr ❌ |

### Warning Guardrails (Suggest Modifications)

These can be fixed by modifying the action:

| Guardrail | Purpose | Threshold | Modification |
|-----------|---------|-----------|--------------|
| `minimum_reinvestment` | Protects long-term sustainability | 40% minimum | Bumps to 40% |
| `whale_protection` | Prevents market manipulation | 10% of supply | Rejects trade |

### Info Guardrails (Advisory Only)

These provide warnings but don't block:

| Guardrail | Purpose | Threshold |
|-----------|---------|-----------|
| `dao_treasury_cap` | Warns of excessive DAO allocation | 30% maximum |

## 🎲 Entropy System

The entropy factor adds controlled randomness to prevent predictable patterns:

### How Entropy Works

1. **Base Entropy by Source**:
   ```typescript
   ai_decision_engine: 0.2  // 20% base randomness
   profit_rebalancer: 0.15  // 15% base randomness
   wallet_executor: 0.1     // 10% base randomness
   mind_think: 0.25         // 25% base randomness
   ```

2. **Confidence Modifier**:
   - High confidence (0.9) → Low entropy influence
   - Low confidence (0.5) → High entropy influence

3. **Random Component**:
   - Additional 0-0.2 randomness added

4. **Decision Impact**:
   - Entropy > 0.7 → May cause deferral even on valid actions
   - Creates unpredictability in the system

### Example Entropy Calculation

```typescript
// AI Decision Engine wants to create a token (confidence: 0.8)
baseEntropy = 0.2  // AI Decision Engine base
confidenceModifier = 1 - 0.8 = 0.2
randomness = Math.random() * 0.2  // e.g., 0.15
finalEntropy = (0.2 * 0.2) + 0.15 = 0.19

// Result: Low entropy → Approved if guardrails pass
```

```typescript
// Mind Think wants to create a token (confidence: 0.5)
baseEntropy = 0.25  // Mind Think base
confidenceModifier = 1 - 0.5 = 0.5
randomness = Math.random() * 0.2  // e.g., 0.18
finalEntropy = (0.25 * 0.5) + 0.18 = 0.305

// Result: Medium entropy → Still likely approved
```

## 📊 Decision Matrix

| Condition | Decision | Confidence | Action |
|-----------|----------|------------|--------|
| Critical guardrail fails | REJECT | 0.95 | Immediate abort |
| All guardrails pass | APPROVE | 0.9 | Execute as-is |
| Warnings with fixes | MODIFY | 0.75 | Execute modified version |
| Multiple warnings | DEFER | 0.5 | Wait for review |
| High entropy (>0.7) | DEFER | 0.6 | Random deferral |

## 🔄 Integration Examples

### Example 1: AI Decision Engine → Governor

**Scenario**: AI wants to create a new token

```typescript
// AI Decision Engine
const { data } = await supabase.functions.invoke('ai-governor-brain', {
  body: {
    action: 'token_mint',
    source: 'ai_decision_engine',
    data: {
      name: 'MindCoin',
      symbol: 'MIND',
      supply: 1000000
    }
  }
});

// Response 1: Approved ✅
{
  "success": true,
  "decision": "approved",
  "confidence": 0.9,
  "reasoning": "All guardrails passed, action approved",
  "guardrails_triggered": [],
  "entropy_factor": 0.18,
  "execution_payload": { name: 'MindCoin', symbol: 'MIND', supply: 1000000 },
  "public_message": "✅ token mint approved - System checks passed"
}

// Response 2: Rejected ❌ (rate limit)
{
  "success": false,
  "decision": "rejected",
  "confidence": 0.95,
  "reasoning": "Critical guardrail failed: Token creation rate limit exceeded",
  "guardrails_triggered": ["rate_limit_check"],
  "entropy_factor": 0.15,
  "public_message": "❌ token mint rejected - Rate limit exceeded"
}
```

### Example 2: Profit Rebalancer → Governor

**Scenario**: AI wants to change profit allocation

```typescript
// Profit Rebalancer
const { data } = await supabase.functions.invoke('ai-governor-brain', {
  body: {
    action: 'profit_allocation',
    source: 'profit_rebalancer',
    data: {
      reinvestment_pct: 35,  // Below 40% minimum!
      dao_pct: 25,
      lucky_pct: 30,         // Very high!
      creator_pct: 10
    }
  }
});

// Response: Modified ⚙️
{
  "success": true,
  "decision": "modified",
  "confidence": 0.75,
  "reasoning": "Action modified: Reinvestment below 40% is risky",
  "guardrails_triggered": ["minimum_reinvestment"],
  "entropy_factor": 0.12,
  "execution_payload": {
    reinvestment_pct: 40,  // ← Modified!
    dao_pct: 25,
    lucky_pct: 25,         // ← Adjusted to maintain 100%
    creator_pct: 10
  },
  "public_message": "⚙️ profit allocation modified - Increased reinvestment to 40%"
}
```

### Example 3: Wallet Executor → Governor

**Scenario**: High-value whale transaction

```typescript
// Wallet Executor
const { data } = await supabase.functions.invoke('ai-governor-brain', {
  body: {
    action: 'token_trade',
    source: 'wallet_executor',
    data: {
      amount: 150000,
      percentage_of_supply: 15,  // Whale alert!
      wallet: '0x...'
    }
  }
});

// Response: Rejected ❌ (whale protection)
{
  "success": false,
  "decision": "rejected",
  "confidence": 0.85,
  "reasoning": "Transaction exceeds 10% of supply - potential whale manipulation",
  "guardrails_triggered": ["whale_protection"],
  "entropy_factor": 0.08,
  "public_message": "❌ token trade rejected - Whale protection triggered"
}
```

## 🔍 Transparency & Monitoring

### Public Status Updates

Users can view governor decisions through the `governor_status_updates` view:

```typescript
const { data } = await supabase
  .from('governor_status_updates')
  .select('*')
  .order('timestamp', { ascending: false })
  .limit(10);
```

Example output:
```typescript
[
  {
    timestamp: "2025-10-10T20:15:00Z",
    action_type: "token_mint",
    decision: "approved",
    public_message: "✅ token mint approved - System checks passed",
    confidence: 0.9
  },
  {
    timestamp: "2025-10-10T20:10:00Z",
    action_type: "profit_allocation",
    decision: "modified",
    public_message: "⚙️ profit allocation modified - Increased reinvestment",
    confidence: 0.75
  }
]
```

### Analytics Queries

```sql
-- Rejection rate by source
SELECT 
  decision_source,
  COUNT(*) as total_decisions,
  SUM(CASE WHEN decision = 'rejected' THEN 1 ELSE 0 END) as rejections,
  ROUND(100.0 * SUM(CASE WHEN decision = 'rejected' THEN 1 ELSE 0 END) / COUNT(*), 2) as rejection_rate_pct
FROM governor_action_log
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY decision_source
ORDER BY rejection_rate_pct DESC;

-- Most triggered guardrails
SELECT 
  UNNEST(guardrails_triggered) as guardrail_name,
  COUNT(*) as times_triggered,
  AVG(confidence) as avg_confidence_when_triggered
FROM governor_action_log
WHERE array_length(guardrails_triggered, 1) > 0
GROUP BY guardrail_name
ORDER BY times_triggered DESC;

-- Entropy impact analysis
SELECT 
  CASE 
    WHEN entropy_factor < 0.3 THEN 'Low'
    WHEN entropy_factor < 0.6 THEN 'Medium'
    ELSE 'High'
  END as entropy_level,
  COUNT(*) as count,
  SUM(CASE WHEN decision = 'deferred' THEN 1 ELSE 0 END) as deferrals,
  ROUND(AVG(confidence), 3) as avg_confidence
FROM governor_action_log
GROUP BY entropy_level
ORDER BY entropy_level;
```

## 🎛️ Configuration & Customization

### Adding Custom Guardrails

Edit `supabase/functions/_shared/governor-brain.ts`:

```typescript
const GUARDRAILS: Guardrail[] = [
  // ... existing guardrails
  {
    name: 'custom_token_name_check',
    severity: 'warning',
    check: async (payload, context) => {
      if (payload.name && payload.name.length < 3) {
        return {
          passed: false,
          reason: 'Token name must be at least 3 characters',
          suggestedModification: { name: payload.name + 'Coin' }
        };
      }
      return { passed: true };
    }
  }
];
```

### Adjusting Entropy Levels

To make the system more/less random:

```typescript
// Lower values = more predictable
// Higher values = more random
const sourceEntropy = {
  'ai_decision_engine': 0.1,  // Was 0.2
  'profit_rebalancer': 0.05,  // Was 0.15
  // ...
}[decisionSource] || 0.15;
```

### Changing Entropy Threshold

To make deferrals more/less likely:

```typescript
// In reviewAction() function
const entropyThreshold = 0.6;  // Was 0.7
if (entropy > entropyThreshold && Math.random() > 0.5) {
  return { decision: 'deferred', ... };
}
```

## 🚀 Quick Start Integration

### Step 1: Update Existing AI Functions

Before executing any action, check with Governor:

```typescript
// In any AI function (ai-decision-engine, profit-rebalancer, etc.)
const governorCheck = await supabase.functions.invoke('ai-governor-brain', {
  body: {
    action: 'your_action_type',
    source: 'your_function_name',
    data: actionPayload
  }
});

if (!governorCheck.data.success) {
  console.log('🛑 Governor rejected:', governorCheck.data.reasoning);
  return { error: governorCheck.data.reasoning };
}

// Use the approved/modified payload
const finalPayload = governorCheck.data.execution_payload;
// ... proceed with execution
```

### Step 2: Deploy the Function

The `ai-governor-brain` function is already configured in `supabase/config.toml` and will be deployed automatically.

### Step 3: Monitor Decisions

```typescript
// View recent decisions
const { data } = await supabase
  .from('governor_action_log')
  .select('*')
  .order('timestamp', { ascending: false })
  .limit(20);

// View public updates only
const { data: updates } = await supabase
  .from('governor_status_updates')
  .select('*')
  .order('timestamp', { ascending: false })
  .limit(10);
```

## 🐛 Troubleshooting

### Issue: Too many rejections

**Diagnosis**:
```sql
SELECT guardrails_triggered, COUNT(*)
FROM governor_action_log
WHERE decision = 'rejected'
GROUP BY guardrails_triggered;
```

**Solutions**:
- Adjust guardrail thresholds in `governor-brain.ts`
- Review calling function's payload construction
- Check if rate limits are too strict

### Issue: Too many deferrals

**Diagnosis**:
```sql
SELECT AVG(entropy_factor), COUNT(*)
FROM governor_action_log
WHERE decision = 'deferred';
```

**Solutions**:
- Lower entropy base levels
- Increase entropy threshold (0.7 → 0.8)
- Improve confidence in calling functions

### Issue: Guardrail not triggering

**Diagnosis**:
- Add console.log in guardrail check
- Verify payload structure matches guardrail expectations
- Check guardrail order (they run sequentially)

## 📚 API Reference

### Request Format

```typescript
{
  action: string;        // Action type identifier
  source: string;        // Calling function name
  data: any;            // Action-specific payload
}
```

### Response Format (Success)

```typescript
{
  success: true;
  decision: 'approved' | 'modified';
  confidence: number;              // 0.0-1.0
  reasoning: string;
  guardrails_triggered: string[];
  entropy_factor: number;          // 0.0-1.0
  execution_payload: any;          // Use this for execution
  log_id: string;
  public_message?: string;
}
```

### Response Format (Failure)

```typescript
{
  success: false;
  decision: 'rejected' | 'deferred';
  confidence: number;
  reasoning: string;
  guardrails_triggered: string[];
  entropy_factor: number;
  log_id: string;
  public_message?: string;
}
```

## 🔐 Security Considerations

1. **Backend-Only**: Governor function has `verify_jwt = false` and should only be called by other backend functions
2. **Audit Trail**: All decisions are permanently logged
3. **No Override**: Critical guardrails cannot be bypassed
4. **Entropy Protection**: Prevents exploitation through pattern recognition
5. **Public Transparency**: Selected decisions are published for user visibility

## 🎯 Best Practices

1. **Always Check Before Execute**: Never execute without governor approval
2. **Use Approved Payload**: Always use `execution_payload`, not original data
3. **Log Rejections**: Track why actions are rejected for improvement
4. **Monitor Entropy**: Watch for patterns in deferred actions
5. **Custom Guardrails**: Add domain-specific checks as needed
6. **Test Thoroughly**: Verify guardrails with edge cases

## 📈 Performance Tips

1. **Guardrail Order**: Put fastest checks first (they run sequentially)
2. **Cache Context**: Governor context is fetched for each request
3. **Batch Review**: If possible, batch multiple actions in one review
4. **Optimize Queries**: Index `governor_action_log` appropriately

---

**The Governor Brain ensures the AI economy remains healthy, secure, and unpredictable while maintaining full transparency for users.**
