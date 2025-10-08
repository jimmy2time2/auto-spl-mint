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

    const { wallet_address } = await req.json();

    console.log('[DAO] Generating invite code:', wallet_address);

    // Generate unique invite code
    const inviteCode = `MIND9-${wallet_address.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    // Get current invite count
    const { count } = await supabase
      .from('invite_log')
      .select('*', { count: 'exact', head: true })
      .eq('inviter_wallet', wallet_address);

    console.log('[DAO] ✅ Invite code generated:', inviteCode);

    return new Response(
      JSON.stringify({
        success: true,
        invite_code: inviteCode,
        invite_count: count || 0,
        invite_url: `${Deno.env.get('SUPABASE_URL')}?invite=${inviteCode}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DAO ERROR]:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
