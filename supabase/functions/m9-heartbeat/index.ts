import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * M9 HEARTBEAT - CRON-triggered autonomous loop
 * 
 * This function is called by CRON every 5-10 minutes to wake M9.
 * M9 analyzes the market and makes autonomous decisions.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('💓 M9 HEARTBEAT TRIGGERED');

    // Check if system is paused
    const { data: settings } = await supabase
      .from('settings')
      .select('status')
      .single();
    
    if (settings?.status === 'PAUSED' || settings?.status === 'MAINTENANCE') {
      console.log('⏸️ System is paused');
      return new Response(JSON.stringify({ 
        paused: true, 
        status: settings.status 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Rate limit: minimum 5 minutes between cycles
    const { data: lastCycle } = await supabase
      .from('m9_agent_cycles')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (lastCycle) {
      const timeSinceLast = Date.now() - new Date(lastCycle.created_at).getTime();
      if (timeSinceLast < 5 * 60 * 1000) {
        console.log('⏱️ Rate limited: too soon since last cycle');
        return new Response(JSON.stringify({ 
          rate_limited: true,
          retry_in_seconds: Math.ceil((5 * 60 * 1000 - timeSinceLast) / 1000)
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Import and run M9 agent
    const { M9Agent } = await import('../_shared/m9-agent.ts');
    const agent = new M9Agent(supabase);
    
    console.log('🧠 Starting M9 cycle...');
    const result = await agent.runCycle();
    
    // Log heartbeat
    const entropy = Math.random();
    await supabase.from('heartbeat_log').insert({
      interval_hours: 0.083, // ~5 minutes
      entropy_factor: entropy,
      decision_triggered: result.decisions.length > 0,
      decision_result: result.decisions.length > 0 
        ? result.decisions.map(d => d.action).join(', ') 
        : 'HOLD',
      market_activity_score: result.analysis.total_volume_24h,
      metadata: {
        sentiment: result.analysis.market_sentiment,
        opportunities: result.analysis.opportunities.length,
        decisions: result.decisions.length,
      },
    });

    const duration = Date.now() - startTime;
    console.log(`✅ M9 HEARTBEAT COMPLETE: ${result.decisions.length} decisions in ${duration}ms`);

    return new Response(JSON.stringify({
      success: true,
      decisions_count: result.decisions.length,
      sentiment: result.analysis.market_sentiment,
      volume_24h: result.analysis.total_volume_24h,
      opportunities: result.analysis.opportunities.length,
      duration_ms: duration,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ M9 HEARTBEAT ERROR:', errorMsg);
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMsg,
      duration_ms: Date.now() - startTime,
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
