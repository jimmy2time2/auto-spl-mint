import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { eventType, data } = await req.json();

    // Get or create engagement tracker
    let { data: tracker } = await supabase
      .from('engagement_metrics')
      .select('*')
      .single();

    if (!tracker) {
      // Initialize tracker
      const { data: newTracker } = await supabase
        .from('engagement_metrics')
        .insert({
          wallet_connections: 0,
          trades_count: 0,
          page_views: 0,
          last_token_launch: null,
          engagement_score: 0
        })
        .select()
        .single();
      
      tracker = newTracker;
    }

    // Update based on event type
    const updates: any = {};
    
    switch (eventType) {
      case 'wallet_connect':
        updates.wallet_connections = (tracker.wallet_connections || 0) + 1;
        updates.engagement_score = (tracker.engagement_score || 0) + 5;
        break;
      case 'trade':
        updates.trades_count = (tracker.trades_count || 0) + 1;
        updates.engagement_score = (tracker.engagement_score || 0) + 10;
        break;
      case 'page_view':
        updates.page_views = (tracker.page_views || 0) + 1;
        updates.engagement_score = (tracker.engagement_score || 0) + 1;
        break;
      case 'token_launch':
        updates.last_token_launch = new Date().toISOString();
        updates.engagement_score = 0; // Reset after launch
        break;
    }

    updates.last_updated = new Date().toISOString();

    await supabase
      .from('engagement_metrics')
      .update(updates)
      .eq('id', tracker.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        engagement_score: (tracker.engagement_score || 0) + (updates.engagement_score || 0)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ENGAGEMENT ERROR]:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
