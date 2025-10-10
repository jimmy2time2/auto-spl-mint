import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Governor Brain - AI Oversight System
 * 
 * Acts as the overseer of the entire economy, reviewing and approving/rejecting
 * actions from other AI systems based on guardrails, entropy, and market signals.
 */

// Guardrail types
export interface Guardrail {
  name: string;
  check: (payload: any, context: GovernorContext) => Promise<GuardrailResult>;
  severity: 'critical' | 'warning' | 'info';
}

export interface GuardrailResult {
  passed: boolean;
  reason?: string;
  suggestedModification?: any;
}

export interface GovernorContext {
  supabase: any;
  recentActivity: any[];
  marketData?: any;
  systemMetrics: any;
}

export interface GovernorDecision {
  decision: 'approved' | 'rejected' | 'deferred' | 'modified';
  confidence: number;
  reasoning: string;
  guardrailsTriggered: string[];
  entropyFactor: number;
  modifiedValue?: any;
  publicMessage?: string;
}

export interface ActionReview {
  actionType: string;
  decisionSource: string;
  actionPayload: any;
  originalValue?: any;
}

// Define built-in guardrails
const GUARDRAILS: Guardrail[] = [
  {
    name: 'allocation_total_check',
    severity: 'critical',
    check: async (payload, context) => {
      if (payload.reinvestment_pct !== undefined) {
        const total = (payload.reinvestment_pct || 0) + 
                     (payload.dao_pct || 0) + 
                     (payload.lucky_pct || 0) + 
                     (payload.creator_pct || 0);
        
        if (Math.abs(total - 100) > 0.01) {
          return {
            passed: false,
            reason: `Allocation percentages must sum to 100%, got ${total}%`
          };
        }
      }
      return { passed: true };
    }
  },
  {
    name: 'minimum_reinvestment',
    severity: 'warning',
    check: async (payload, context) => {
      if (payload.reinvestment_pct !== undefined && payload.reinvestment_pct < 40) {
        return {
          passed: false,
          reason: 'Reinvestment below 40% is risky for long-term sustainability',
          suggestedModification: { reinvestment_pct: 40 }
        };
      }
      return { passed: true };
    }
  },
  {
    name: 'dao_treasury_cap',
    severity: 'info',
    check: async (payload, context) => {
      if (payload.dao_pct !== undefined && payload.dao_pct > 30) {
        return {
          passed: false,
          reason: 'DAO allocation above 30% may slow system growth',
          suggestedModification: { dao_pct: 30 }
        };
      }
      return { passed: true };
    }
  },
  {
    name: 'rate_limit_check',
    severity: 'critical',
    check: async (payload, context) => {
      // Check if we're creating tokens too frequently
      const recentTokens = context.recentActivity.filter(
        (act: any) => act.activity_type === 'token_mint' && 
        Date.now() - new Date(act.timestamp).getTime() < 3600000 // 1 hour
      );
      
      if (recentTokens.length >= 3) {
        return {
          passed: false,
          reason: 'Token creation rate limit exceeded (max 3 per hour)'
        };
      }
      return { passed: true };
    }
  },
  {
    name: 'whale_protection',
    severity: 'warning',
    check: async (payload, context) => {
      // Check for whale activity patterns
      if (payload.amount && payload.percentage_of_supply) {
        if (payload.percentage_of_supply > 10) {
          return {
            passed: false,
            reason: 'Transaction exceeds 10% of supply - potential whale manipulation'
          };
        }
      }
      return { passed: true };
    }
  }
];

/**
 * Calculate entropy factor for decision randomness
 */
function calculateEntropy(decisionSource: string, confidence: number): number {
  // Base entropy on source and confidence
  const sourceEntropy = {
    'ai_decision_engine': 0.2,
    'profit_rebalancer': 0.15,
    'wallet_executor': 0.1,
    'mind_think': 0.25
  }[decisionSource] || 0.3;
  
  // Higher confidence = lower entropy influence
  const confidenceModifier = 1 - confidence;
  
  // Add some randomness
  const randomness = Math.random() * 0.2;
  
  return Math.min(sourceEntropy * confidenceModifier + randomness, 1);
}

/**
 * Generate public-facing message for transparency
 */
function generatePublicMessage(
  decision: string,
  actionType: string,
  reasoning: string
): string | undefined {
  // Only publish certain types of decisions
  if (['token_mint', 'profit_distribution', 'allocation_change'].includes(actionType)) {
    const messages = {
      'approved': `✅ ${actionType.replace('_', ' ')} approved - ${reasoning.substring(0, 100)}`,
      'rejected': `❌ ${actionType.replace('_', ' ')} rejected - ${reasoning.substring(0, 100)}`,
      'modified': `⚙️ ${actionType.replace('_', ' ')} modified - ${reasoning.substring(0, 100)}`,
      'deferred': `⏸️ ${actionType.replace('_', ' ')} deferred - ${reasoning.substring(0, 100)}`
    };
    return messages[decision as keyof typeof messages];
  }
  return undefined;
}

/**
 * Main Governor Brain Review Function
 */
export async function reviewAction(
  review: ActionReview,
  context: GovernorContext
): Promise<GovernorDecision> {
  console.log(`🧠 Governor Brain reviewing ${review.actionType} from ${review.decisionSource}`);
  
  const triggeredGuardrails: string[] = [];
  const failedGuardrails: GuardrailResult[] = [];
  
  // Run all guardrails
  for (const guardrail of GUARDRAILS) {
    const result = await guardrail.check(review.actionPayload, context);
    
    if (!result.passed) {
      triggeredGuardrails.push(guardrail.name);
      failedGuardrails.push(result);
      
      if (guardrail.severity === 'critical') {
        // Critical failures = immediate rejection
        const entropy = calculateEntropy(review.decisionSource, 0.9);
        
        return {
          decision: 'rejected',
          confidence: 0.95,
          reasoning: `Critical guardrail failed: ${result.reason}`,
          guardrailsTriggered: triggeredGuardrails,
          entropyFactor: entropy,
          publicMessage: generatePublicMessage('rejected', review.actionType, result.reason || '')
        };
      }
    }
  }
  
  // Calculate entropy factor
  const baseConfidence = failedGuardrails.length === 0 ? 0.9 : 0.7;
  const entropy = calculateEntropy(review.decisionSource, baseConfidence);
  
  // Determine decision based on guardrails and entropy
  if (failedGuardrails.length === 0) {
    // All guardrails passed
    return {
      decision: 'approved',
      confidence: baseConfidence,
      reasoning: 'All guardrails passed, action approved',
      guardrailsTriggered: [],
      entropyFactor: entropy,
      publicMessage: generatePublicMessage('approved', review.actionType, 'System checks passed')
    };
  }
  
  // Some warnings triggered - check if we can modify
  const modifications = failedGuardrails
    .filter(g => g.suggestedModification)
    .reduce((acc, g) => ({ ...acc, ...g.suggestedModification }), {});
  
  if (Object.keys(modifications).length > 0) {
    // Apply modifications
    const modifiedPayload = { ...review.actionPayload, ...modifications };
    const reasons = failedGuardrails.map(g => g.reason).join('; ');
    
    return {
      decision: 'modified',
      confidence: 0.75,
      reasoning: `Action modified to meet guardrails: ${reasons}`,
      guardrailsTriggered: triggeredGuardrails,
      entropyFactor: entropy,
      modifiedValue: modifiedPayload,
      publicMessage: generatePublicMessage('modified', review.actionType, reasons)
    };
  }
  
  // Too many warnings, defer for review
  if (failedGuardrails.length > 2) {
    const reasons = failedGuardrails.map(g => g.reason).join('; ');
    return {
      decision: 'deferred',
      confidence: 0.5,
      reasoning: `Multiple warnings triggered, deferring decision: ${reasons}`,
      guardrailsTriggered: triggeredGuardrails,
      entropyFactor: entropy,
      publicMessage: generatePublicMessage('deferred', review.actionType, 'Multiple warnings')
    };
  }
  
  // Entropy-based decision for edge cases
  const entropyThreshold = 0.7;
  if (entropy > entropyThreshold && Math.random() > 0.5) {
    return {
      decision: 'deferred',
      confidence: 0.6,
      reasoning: 'High entropy detected, deferring for additional analysis',
      guardrailsTriggered: triggeredGuardrails,
      entropyFactor: entropy,
      publicMessage: generatePublicMessage('deferred', review.actionType, 'Additional review needed')
    };
  }
  
  // Default to approval with warnings
  return {
    decision: 'approved',
    confidence: 0.7,
    reasoning: `Approved with warnings: ${failedGuardrails.map(g => g.reason).join('; ')}`,
    guardrailsTriggered: triggeredGuardrails,
    entropyFactor: entropy,
    publicMessage: generatePublicMessage('approved', review.actionType, 'Approved with conditions')
  };
}

/**
 * Log governor decision to database
 */
export async function logGovernorDecision(
  supabase: any,
  review: ActionReview,
  decision: GovernorDecision,
  marketSignals?: any
): Promise<string | null> {
  const { data, error } = await supabase
    .from('governor_action_log')
    .insert({
      action_type: review.actionType,
      decision_source: review.decisionSource,
      action_payload: review.actionPayload,
      decision: decision.decision,
      confidence: decision.confidence,
      reasoning: decision.reasoning,
      guardrails_triggered: decision.guardrailsTriggered,
      entropy_factor: decision.entropyFactor,
      market_signals: marketSignals,
      original_value: review.originalValue,
      modified_value: decision.modifiedValue,
      public_message: decision.publicMessage,
      published: decision.publicMessage !== undefined
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Failed to log governor decision:', error);
    return null;
  }
  
  console.log('✅ Governor decision logged:', data.id);
  return data.id;
}

/**
 * Fetch system context for governor decisions
 */
export async function getGovernorContext(
  supabase: any
): Promise<GovernorContext> {
  // Get recent activity (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: activity } = await supabase
    .from('protocol_activity')
    .select('*')
    .gte('timestamp', oneDayAgo)
    .order('timestamp', { ascending: false });
  
  // Get system metrics
  const { data: metrics } = await supabase
    .from('engagement_metrics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  // Get market sentiment (if available)
  const { data: sentiment } = await supabase
    .from('market_sentiment')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  return {
    supabase,
    recentActivity: activity || [],
    marketData: sentiment,
    systemMetrics: metrics || {}
  };
}
