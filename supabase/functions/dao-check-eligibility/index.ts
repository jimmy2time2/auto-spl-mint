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

    console.log('[DAO] Checking eligibility:', wallet_address);

    // Call the check_dao_eligibility function
    const { data, error } = await supabase.rpc('check_dao_eligibility', {
      wallet: wallet_address
    });

    if (error) throw error;

    // Get updated eligibility record
    const { data: eligibility } = await supabase
      .from('dao_eligibility')
      .select('*')
      .eq('wallet_address', wallet_address)
      .single();

    console.log('[DAO] ✅ Eligibility checked:', data);

    return new Response(
      JSON.stringify({
        success: true,
        is_eligible: data,
        eligibility
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
