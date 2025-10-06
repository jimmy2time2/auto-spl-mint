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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { tokenName, tokenSymbol, totalSupply, creatorAddress } = await req.json();

    console.log('Minting token:', { tokenName, tokenSymbol, totalSupply });

    // Distribution percentages: 7% AI, 5% Creator, 3% Lucky, 2% System, 83% Public
    const distribution = {
      ai: Number(totalSupply) * 0.07,
      creator: Number(totalSupply) * 0.05,
      lucky: Number(totalSupply) * 0.03,
      system: Number(totalSupply) * 0.02,
      public: Number(totalSupply) * 0.83
    };

    // Create the token
    const { data: token, error: tokenError } = await supabaseClient
      .from('tokens')
      .insert({
        name: tokenName,
        symbol: tokenSymbol,
        supply: totalSupply,
        price: 0.001,
        liquidity: 0,
        volume_24h: 0,
        holders: 0,
        mint_address: `MINT_${crypto.randomUUID().substring(0, 8)}`,
        pool_address: `POOL_${crypto.randomUUID().substring(0, 8)}`,
      })
      .select()
      .single();

    if (tokenError) throw tokenError;

    // Record distribution
    const { error: distError } = await supabaseClient
      .from('coin_distributions')
      .insert({
        token_id: token.id,
        ai_wallet_amount: distribution.ai,
        creator_wallet_amount: distribution.creator,
        lucky_wallet_amount: distribution.lucky,
        system_wallet_amount: distribution.system,
        public_sale_amount: distribution.public,
        total_supply: totalSupply
      });

    if (distError) throw distError;

    // Record creator profit
    const { error: profitError } = await supabaseClient
      .from('creator_wallet_profits')
      .insert({
        token_id: token.id,
        creator_address: creatorAddress,
        profit_source: 'mint_allocation',
        amount: distribution.creator,
        transaction_hash: `TX_${crypto.randomUUID()}`
      });

    if (profitError) throw profitError;

    // Log protocol activity
    await supabaseClient
      .from('protocol_activity')
      .insert({
        activity_type: 'token_mint',
        token_id: token.id,
        description: `Token ${tokenSymbol} minted with ${totalSupply} supply`,
        metadata: { distribution }
      });

    // Create log entry
    await supabaseClient
      .from('logs')
      .insert({
        action: 'TOKEN_MINTED',
        token_id: token.id,
        details: { 
          name: tokenName, 
          symbol: tokenSymbol,
          distribution 
        }
      });

    console.log('Token minted successfully:', token.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        token,
        distribution 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in mint-token:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
