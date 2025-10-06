import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { name, symbol, supply, creator_address } = await req.json();

    console.log('Minting token:', { name, symbol, supply, creator_address });

    // Distribution percentages: 7% AI, 5% Creator, 3% Lucky, 2% System, 83% Public
    const totalSupply = parseFloat(supply);
    const aiAmount = totalSupply * 0.07;
    const creatorAmount = totalSupply * 0.05;
    const luckyAmount = totalSupply * 0.03;
    const systemAmount = totalSupply * 0.02;
    const publicAmount = totalSupply * 0.83;

    // 1. Create token record
    const { data: token, error: tokenError } = await supabase
      .from('tokens')
      .insert({
        name,
        symbol,
        supply: totalSupply,
        price: 0.001, // Initial price
        liquidity: 0,
        volume_24h: 0,
        holders: 1,
        mint_address: `MINT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        pool_address: `POOL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })
      .select()
      .single();

    if (tokenError) throw tokenError;

    // 2. Log coin distribution
    const { error: distError } = await supabase
      .from('coin_distributions')
      .insert({
        token_id: token.id,
        ai_wallet_amount: aiAmount,
        creator_wallet_amount: creatorAmount,
        lucky_wallet_amount: luckyAmount,
        system_wallet_amount: systemAmount,
        public_sale_amount: publicAmount,
        total_supply: totalSupply
      });

    if (distError) throw distError;

    // 3. Track creator profit from mint allocation
    const { error: profitError } = await supabase
      .from('creator_wallet_profits')
      .insert({
        token_id: token.id,
        creator_address,
        profit_source: 'mint_allocation',
        amount: creatorAmount,
        transaction_hash: `TX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });

    if (profitError) throw profitError;

    // 4. Log protocol activity
    const { error: activityError } = await supabase
      .from('protocol_activity')
      .insert({
        activity_type: 'token_mint',
        token_id: token.id,
        description: `Token ${symbol} minted with ${totalSupply} supply`,
        metadata: {
          distribution: {
            ai: aiAmount,
            creator: creatorAmount,
            lucky: luckyAmount,
            system: systemAmount,
            public: publicAmount
          },
          creator_address
        }
      });

    if (activityError) throw activityError;

    // 5. Create system log
    const { error: logError } = await supabase
      .from('logs')
      .insert({
        action: `TOKEN_MINT: ${symbol}`,
        token_id: token.id,
        details: {
          name,
          symbol,
          supply: totalSupply,
          distribution: 'AI:7% Creator:5% Lucky:3% System:2% Public:83%'
        }
      });

    if (logError) console.error('Log error:', logError);

    console.log('Token minted successfully:', token.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        token,
        distribution: {
          ai: aiAmount,
          creator: creatorAmount,
          lucky: luckyAmount,
          system: systemAmount,
          public: publicAmount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Mint token error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
