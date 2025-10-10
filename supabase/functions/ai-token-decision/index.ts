import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  calculateRandomnessFactor,
  fetchMarketSignals,
  makeAIDecision,
  logDecision,
  executeTokenMint,
  getNextCheckInterval,
} from "../_shared/decision-engine.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const { dev_mode = false, force_execute = false } = await req.json().catch(() => ({}));

    console.log(`🤖 AI Token Decision Engine starting...`);
    console.log(`Dev Mode: ${dev_mode}`);

    // Step 1: Fetch market signals
    console.log('📊 Fetching market signals...');
    const marketSignals = await fetchMarketSignals(supabase);
    console.log('Market signals:', marketSignals);

    // Step 2: Calculate randomness factor
    const randomnessFactor = calculateRandomnessFactor();
    console.log(`🎲 Randomness factor: ${randomnessFactor.toFixed(2)}`);

    // Step 3: Make AI decision
    console.log('🧠 Consulting AI for decision...');
    const aiDecision = await makeAIDecision(marketSignals, randomnessFactor, openaiApiKey);
    console.log(`Decision: ${aiDecision.decision} (confidence: ${aiDecision.confidence})`);
    console.log(`Reasoning: ${aiDecision.reasoning}`);

    // Step 4: Log decision
    const decisionResult = {
      ...aiDecision,
      market_signals: marketSignals,
      randomness_factor: randomnessFactor,
    };

    const decisionId = await logDecision(supabase, decisionResult, dev_mode);
    console.log(`✅ Decision logged with ID: ${decisionId}`);

    // Step 5: Execute if launch decision and not in dev mode
    let executionResult = null;
    if (aiDecision.decision === 'launch' && !dev_mode && (force_execute || randomnessFactor > 0.3)) {
      console.log('🚀 Executing token launch...');
      try {
        executionResult = await executeTokenMint(
          supabase,
          aiDecision.token_name!,
          aiDecision.token_theme!,
          decisionId
        );
        console.log('✅ Token launched successfully:', executionResult);
      } catch (error) {
        console.error('❌ Token launch failed:', error);
        executionResult = { error: error instanceof Error ? error.message : String(error) };
      }
    } else if (aiDecision.decision === 'launch' && dev_mode) {
      console.log('⚠️ Dev mode enabled - skipping token launch execution');
    }

    // Step 6: Calculate next check interval
    const nextCheckHours = getNextCheckInterval();
    console.log(`⏰ Next check scheduled in ${nextCheckHours.toFixed(1)} hours`);

    // Log to protocol activity
    await supabase.from('protocol_activity').insert({
      activity_type: 'ai_decision',
      description: `AI decided to ${aiDecision.decision.toUpperCase()}${aiDecision.token_name ? ` - ${aiDecision.token_name}` : ''}`,
      metadata: {
        decision_id: decisionId,
        decision: aiDecision.decision,
        confidence: aiDecision.confidence,
        dev_mode,
        next_check_hours: nextCheckHours,
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        decision: aiDecision.decision,
        confidence: aiDecision.confidence,
        reasoning: aiDecision.reasoning,
        token_name: aiDecision.token_name,
        token_theme: aiDecision.token_theme,
        decision_id: decisionId,
        execution_result: executionResult,
        next_check_hours: nextCheckHours,
        dev_mode,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-token-decision:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
