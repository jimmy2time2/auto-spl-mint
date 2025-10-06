import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Autonomous Heartbeat Edge Function
 * 
 * This function is called by CRON or manually to trigger the AI Mind's autonomous pulse.
 * It's the entry point for the autonomous system on the backend.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('💓 [AUTONOMOUS] Starting heartbeat pulse...');

    // Log heartbeat start
    await supabase.from('logs').insert([{
      action: 'HEARTBEAT_TRIGGER',
      details: {
        timestamp: new Date().toISOString(),
        source: 'edge_function'
      }
    }]);

    // Call mind-think to analyze and decide
    const { data: mindData, error: mindError } = await supabase.functions.invoke('mind-think');

    if (mindError) {
      console.error('[AUTONOMOUS] Mind-think error:', mindError);
      throw mindError;
    }

    console.log('[AUTONOMOUS] AI Decision:', mindData?.decision?.action);

    // Execute the decision through ai-governor
    let executionResult;
    if (mindData?.decision?.action !== 'wait') {
      const { data: govData, error: govError } = await supabase.functions.invoke('ai-governor', {
        body: {
          action: mapDecisionToAction(mindData.decision.action),
          data: mindData.decision.data,
          prompt: mindData.decision.reasoning
        }
      });

      if (govError) {
        console.error('[AUTONOMOUS] Governor error:', govError);
      } else {
        executionResult = govData;
        console.log('[AUTONOMOUS] Execution result:', govData);
      }
    }

    // Log completion
    await supabase.from('protocol_activity').insert({
      activity_type: 'autonomous_heartbeat',
      description: `Heartbeat pulse: ${mindData?.decision?.action || 'unknown'}`,
      metadata: {
        decision: mindData?.decision,
        execution: executionResult,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        decision: mindData?.decision,
        execution: executionResult,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AUTONOMOUS ERROR]:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function mapDecisionToAction(decision: string): string {
  const mapping: Record<string, string> = {
    'createCoin': 'decide_creation',
    'sellProfit': 'ai_profit',
    'teaseNextCoin': 'process_command',
    'runLuckyLottery': 'lucky_lottery',
    'punishWhales': 'detect_whale',
    'grantDAOMember': 'update_dao'
  };
  
  return mapping[decision] || 'evaluate_market';
}
