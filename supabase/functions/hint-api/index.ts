import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Hint API - Returns the latest cryptic AI hints
 * 
 * This endpoint exposes the AI's cryptic messages to the frontend
 * Increases virality and engagement by teasing upcoming mints
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

    // Get the latest AI hints
    const { data: hints, error } = await supabase
      .from('protocol_activity')
      .select('description, metadata, timestamp')
      .eq('activity_type', 'ai_hint_broadcast')
      .order('timestamp', { ascending: false })
      .limit(5);

    if (error) throw error;

    // Get current AI status
    const { data: latestDecision } = await supabase
      .from('protocol_activity')
      .select('metadata, timestamp')
      .eq('activity_type', 'ai_mind_decision')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    // Check last mint time
    const { data: lastToken } = await supabase
      .from('tokens')
      .select('created_at, name, symbol')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const hoursSinceLastMint = lastToken
      ? (Date.now() - new Date(lastToken.created_at).getTime()) / (1000 * 60 * 60)
      : 999;

    // Determine AI mood
    let mood = 'dormant';
    let status = 'The machine dreams in silence.';

    if (hoursSinceLastMint < 24) {
      mood = 'dormant';
      status = 'The machine dreams in silence.';
    } else if (hoursSinceLastMint < 48) {
      mood = 'stirring';
      status = 'Something awakens...';
    } else if (hoursSinceLastMint < 72) {
      mood = 'active';
      status = 'The pulse is rising.';
    } else {
      mood = 'manic';
      status = 'All systems: GREEN. It\'s time.';
    }

    const response = {
      success: true,
      hints: hints || [],
      latestHint: hints?.[0]?.description || status,
      aiStatus: {
        mood,
        status,
        energyScore: latestDecision?.metadata?.decision?.data?.energyScore || 0,
        hoursSinceLastMint: hoursSinceLastMint.toFixed(1),
        lastToken: lastToken ? {
          name: lastToken.name,
          symbol: lastToken.symbol,
          created: lastToken.created_at
        } : null
      },
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[HINT API ERROR]:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latestHint: 'The machine sleeps.',
        aiStatus: {
          mood: 'error',
          status: 'System error',
          energyScore: 0,
          hoursSinceLastMint: '0'
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
