import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  shouldTriggerHeartbeat,
  executeHeartbeat,
  getHeartbeatSettings,
} from "../_shared/heartbeat-scheduler.ts";

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
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const { force = false } = await req.json().catch(() => ({}));

    console.log('💓 AI Heartbeat Scheduler invoked...');

    // Check settings
    const settings = await getHeartbeatSettings(supabase);
    
    if (!settings.active && !force) {
      console.log('⏸️ Heartbeat system is disabled');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Heartbeat system is disabled',
          active: false,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if it's time for a heartbeat
    const shouldTrigger = force || await shouldTriggerHeartbeat(supabase);
    
    if (!shouldTrigger) {
      // Get next scheduled time
      const { data: lastHeartbeat } = await supabase
        .from('heartbeat_log')
        .select('next_heartbeat_at')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
      
      const nextTime = lastHeartbeat?.next_heartbeat_at 
        ? new Date(lastHeartbeat.next_heartbeat_at)
        : new Date();
      
      const hoursUntil = (nextTime.getTime() - Date.now()) / (1000 * 60 * 60);
      
      console.log(`⏰ Not time yet. Next heartbeat in ${hoursUntil.toFixed(2)} hours`);
      
      return new Response(
        JSON.stringify({
          success: true,
          triggered: false,
          message: `Next heartbeat scheduled in ${hoursUntil.toFixed(2)} hours`,
          next_heartbeat_at: nextTime.toISOString(),
          hours_remaining: hoursUntil,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Execute heartbeat
    console.log('✅ Heartbeat time! Executing...');
    const result = await executeHeartbeat(supabase);

    console.log('💓 Heartbeat complete');
    console.log(`🧠 Decision: ${result.decision_result}`);
    console.log(`⏰ Next heartbeat: ${result.next_heartbeat_at}`);

    return new Response(
      JSON.stringify({
        success: true,
        triggered: true,
        heartbeat: result,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-heartbeat:', error);
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
