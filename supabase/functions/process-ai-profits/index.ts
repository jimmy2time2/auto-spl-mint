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

    const { tokenId, saleAmount, creatorAddress } = await req.json();

    console.log('Processing AI wallet profits:', { tokenId, saleAmount });

    // Split: 80% reinvestment, 15% DAO, 2% creator, 3% lucky
    const split = {
      reinvestment: Number(saleAmount) * 0.80,
      dao: Number(saleAmount) * 0.15,
      creator: Number(saleAmount) * 0.02,
      lucky: Number(saleAmount) * 0.03
    };

    // Record profit event
    const { error: profitError } = await supabaseClient
      .from('profit_events')
      .insert({
        token_id: tokenId,
        sale_amount: saleAmount,
        reinvestment_amount: split.reinvestment,
        dao_amount: split.dao,
        creator_amount: split.creator,
        lucky_amount: split.lucky,
        transaction_hash: `TX_${crypto.randomUUID()}`
      });

    if (profitError) throw profitError;

    // Update DAO treasury
    const { data: treasury } = await supabaseClient
      .from('dao_treasury')
      .select('*')
      .single();

    if (treasury) {
      await supabaseClient
        .from('dao_treasury')
        .update({
          balance: Number(treasury.balance) + split.dao,
          total_received: Number(treasury.total_received) + split.dao,
          last_update: new Date().toISOString()
        })
        .eq('id', treasury.id);
    }

    // Record creator profit share
    const { error: creatorProfitError } = await supabaseClient
      .from('creator_wallet_profits')
      .insert({
        token_id: tokenId,
        creator_address: creatorAddress,
        profit_source: 'ai_profit_share',
        amount: split.creator,
        transaction_hash: `TX_${crypto.randomUUID()}`
      });

    if (creatorProfitError) throw creatorProfitError;

    // Log protocol activity
    await supabaseClient
      .from('protocol_activity')
      .insert({
        activity_type: 'profit_distribution',
        token_id: tokenId,
        description: `AI wallet profit distributed: ${saleAmount}`,
        metadata: { split }
      });

    console.log('AI profits processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        split
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-ai-profits:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
