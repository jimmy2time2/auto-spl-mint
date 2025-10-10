import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { 
  reviewAction, 
  logGovernorDecision, 
  getGovernorContext,
  type ActionReview,
  type GovernorDecision
} from "../_shared/governor-brain.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action, data, source } = body;

    console.log(`🧠 Governor Brain received action: ${action} from ${source}`);

    // Prepare action review
    const review: ActionReview = {
      actionType: action,
      decisionSource: source || 'unknown',
      actionPayload: data,
      originalValue: data
    };

    // Get system context
    const context = await getGovernorContext(supabase);

    // Review the action
    const decision: GovernorDecision = await reviewAction(review, context);

    // Log the decision
    const logId = await logGovernorDecision(
      supabase,
      review,
      decision,
      context.marketData
    );

    console.log(`🧠 Governor decision: ${decision.decision} (confidence: ${decision.confidence})`);
    console.log(`📝 Reasoning: ${decision.reasoning}`);

    // If approved or modified, return the payload to execute
    if (decision.decision === 'approved' || decision.decision === 'modified') {
      const executionPayload = decision.decision === 'modified' 
        ? decision.modifiedValue 
        : data;

      return new Response(
        JSON.stringify({
          success: true,
          decision: decision.decision,
          confidence: decision.confidence,
          reasoning: decision.reasoning,
          guardrails_triggered: decision.guardrailsTriggered,
          entropy_factor: decision.entropyFactor,
          execution_payload: executionPayload,
          log_id: logId,
          public_message: decision.publicMessage
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If rejected or deferred, return the decision without execution
    return new Response(
      JSON.stringify({
        success: false,
        decision: decision.decision,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
        guardrails_triggered: decision.guardrailsTriggered,
        entropy_factor: decision.entropyFactor,
        log_id: logId,
        public_message: decision.publicMessage
      }),
      { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Governor Brain error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
