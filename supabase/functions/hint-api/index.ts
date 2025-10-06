import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Hint API Endpoint
 * 
 * Returns the latest cryptic hint/clue from the AI Mind
 * Public endpoint for frontend consumption
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

    console.log('[HINT API] Fetching latest hint...');

    // Get latest clue from protocol_activity
    const { data: clues, error } = await supabase
      .from('protocol_activity')
      .select('description, metadata, timestamp')
      .eq('activity_type', 'ai_clue_broadcast')
      .order('timestamp', { ascending: false })
      .limit(5);

    if (error) throw error;

    // Get latest AI decision
    const { data: decision } = await supabase
      .from('protocol_activity')
      .select('metadata, timestamp')
      .eq('activity_type', 'ai_mind_decision')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    // Get latest mint
    const { data: lastMint } = await supabase
      .from('tokens')
      .select('name, symbol, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Calculate time since last mint
    const hoursSinceLastMint = lastMint
      ? (Date.now() - new Date(lastMint.created_at).getTime()) / (1000 * 60 * 60)
      : null;

    // Build response
    const latestClue = clues?.[0];
    const hint = latestClue?.description || "The AI Mind observes in silence...";
    
    const response = {
      success: true,
      hint,
      timestamp: latestClue?.timestamp || new Date().toISOString(),
      context: {
        aiMood: decision?.metadata?.decision?.action || 'unknown',
        lastMint: lastMint ? {
          name: lastMint.name,
          symbol: lastMint.symbol,
          hoursAgo: hoursSinceLastMint ? Math.floor(hoursSinceLastMint) : null
        } : null,
        recentClues: clues?.slice(0, 3).map(c => ({
          hint: c.description,
          time: c.timestamp
        })) || []
      }
    };

    console.log('[HINT API] Returning hint:', hint);

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
        hint: 'The AI Mind is temporarily unreachable...'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
