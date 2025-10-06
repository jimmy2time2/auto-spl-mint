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

    const { tokenId, tradeType, traderAddress, tradeAmount, creatorAddress } = await req.json();

    console.log('Processing trade:', { tokenId, tradeType, tradeAmount });

    // Fee calculation: 1% creator, 1% system
    const creatorFee = Number(tradeAmount) * 0.01;
    const systemFee = Number(tradeAmount) * 0.01;
    const totalFees = creatorFee + systemFee;

    // Get token supply for whale detection
    const { data: token } = await supabaseClient
      .from('tokens')
      .select('supply')
      .eq('id', tokenId)
      .single();

    if (!token) {
      throw new Error('Token not found');
    }

    const percentageOfSupply = (Number(tradeAmount) / Number(token.supply)) * 100;

    // Check for whale activity (>5% buy or >50% sell)
    const isWhaleActivity = (tradeType === 'buy' && percentageOfSupply > 5) || 
                           (tradeType === 'sell' && percentageOfSupply > 50);

    // Record trade fees
    const { error: feeError } = await supabaseClient
      .from('trade_fees_log')
      .insert({
        token_id: tokenId,
        trade_type: tradeType,
        trader_address: traderAddress,
        trade_amount: tradeAmount,
        creator_fee: creatorFee,
        system_fee: systemFee,
        transaction_hash: `TX_${crypto.randomUUID()}`
      });

    if (feeError) throw feeError;

    // Record creator profit from fees
    const { error: profitError } = await supabaseClient
      .from('creator_wallet_profits')
      .insert({
        token_id: tokenId,
        creator_address: creatorAddress,
        profit_source: 'trade_fee',
        amount: creatorFee,
        transaction_hash: `TX_${crypto.randomUUID()}`
      });

    if (profitError) throw profitError;

    // Log wallet activity
    const { error: activityError } = await supabaseClient
      .from('wallet_activity_log')
      .insert({
        wallet_address: traderAddress,
        token_id: tokenId,
        activity_type: tradeType,
        amount: tradeAmount,
        percentage_of_supply: percentageOfSupply,
        is_whale_flagged: isWhaleActivity,
        transaction_hash: `TX_${crypto.randomUUID()}`
      });

    if (activityError) throw activityError;

    // Update or create DAO eligibility record
    const { data: existingEligibility } = await supabaseClient
      .from('dao_eligibility')
      .select('*')
      .eq('wallet_address', traderAddress)
      .eq('token_id', tokenId)
      .single();

    if (existingEligibility) {
      const newTotalBought = tradeType === 'buy' 
        ? Number(existingEligibility.total_bought) + Number(tradeAmount)
        : Number(existingEligibility.total_bought);
      
      const newTotalSold = tradeType === 'sell'
        ? Number(existingEligibility.total_sold) + Number(tradeAmount)
        : Number(existingEligibility.total_sold);

      const maxBuyPercentage = Math.max(
        Number(existingEligibility.max_buy_percentage),
        tradeType === 'buy' ? percentageOfSupply : 0
      );

      const maxSellPercentage = Math.max(
        Number(existingEligibility.max_sell_percentage),
        tradeType === 'sell' ? percentageOfSupply : 0
      );

      const whaleStatus = maxBuyPercentage > 5 || maxSellPercentage > 50;
      const flaggedReason = whaleStatus ? 
        (maxBuyPercentage > 5 ? 'Large buy >5%' : 'Large sell >50%') : null;

      await supabaseClient
        .from('dao_eligibility')
        .update({
          total_bought: newTotalBought,
          total_sold: newTotalSold,
          max_buy_percentage: maxBuyPercentage,
          max_sell_percentage: maxSellPercentage,
          whale_status: whaleStatus,
          is_eligible: !whaleStatus,
          flagged_reason: flaggedReason,
          last_activity: new Date().toISOString()
        })
        .eq('wallet_address', traderAddress)
        .eq('token_id', tokenId);
    } else {
      await supabaseClient
        .from('dao_eligibility')
        .insert({
          wallet_address: traderAddress,
          token_id: tokenId,
          total_bought: tradeType === 'buy' ? tradeAmount : 0,
          total_sold: tradeType === 'sell' ? tradeAmount : 0,
          max_buy_percentage: tradeType === 'buy' ? percentageOfSupply : 0,
          max_sell_percentage: tradeType === 'sell' ? percentageOfSupply : 0,
          whale_status: isWhaleActivity,
          is_eligible: !isWhaleActivity,
          flagged_reason: isWhaleActivity ? 
            (tradeType === 'buy' ? 'Large buy >5%' : 'Large sell >50%') : null
        });
    }

    // Log protocol activity
    await supabaseClient
      .from('protocol_activity')
      .insert({
        activity_type: 'trade',
        token_id: tokenId,
        description: `${tradeType.toUpperCase()} trade: ${tradeAmount} tokens`,
        metadata: { 
          traderAddress, 
          fees: { creatorFee, systemFee },
          whaleActivity: isWhaleActivity 
        }
      });

    if (isWhaleActivity) {
      await supabaseClient
        .from('protocol_activity')
        .insert({
          activity_type: 'whale_flag',
          token_id: tokenId,
          description: `Whale activity detected: ${tradeType} ${percentageOfSupply.toFixed(2)}%`,
          metadata: { traderAddress, percentageOfSupply }
        });
    }

    console.log('Trade processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        fees: { creatorFee, systemFee, totalFees },
        whaleActivity: isWhaleActivity
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-trade:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
