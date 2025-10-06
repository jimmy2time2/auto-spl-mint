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

    const { token_id, trade_type, trader_address, amount } = await req.json();

    console.log('Executing trade:', { token_id, trade_type, trader_address, amount });

    // Get token details
    const { data: token, error: tokenError } = await supabase
      .from('tokens')
      .select('*')
      .eq('id', token_id)
      .single();

    if (tokenError) throw tokenError;

    const tradeAmount = parseFloat(amount);
    const percentageOfSupply = (tradeAmount / parseFloat(token.supply)) * 100;

    // Whale detection: >5% buy or >50% sell
    const isWhaleFlagged = (trade_type === 'buy' && percentageOfSupply > 5) || 
                          (trade_type === 'sell' && percentageOfSupply > 50);

    if (isWhaleFlagged) {
      console.log('🚨 WHALE DETECTED:', { trader_address, percentageOfSupply, trade_type });
    }

    // Calculate fees: 1% creator, 1% system (total 2%)
    const creatorFee = tradeAmount * 0.01;
    const systemFee = tradeAmount * 0.01;
    const totalFees = creatorFee + systemFee;

    // 1. Log trade fees
    const { error: feeError } = await supabase
      .from('trade_fees_log')
      .insert({
        token_id,
        trade_type,
        trader_address,
        trade_amount: tradeAmount,
        creator_fee: creatorFee,
        system_fee: systemFee,
        transaction_hash: `TX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });

    if (feeError) throw feeError;

    // 2. Get or create DAO eligibility record
    const { data: daoRecord } = await supabase
      .from('dao_eligibility')
      .select('*')
      .eq('wallet_address', trader_address)
      .eq('token_id', token_id)
      .single();

    const totalBought = (daoRecord?.total_bought || 0) + (trade_type === 'buy' ? tradeAmount : 0);
    const totalSold = (daoRecord?.total_sold || 0) + (trade_type === 'sell' ? tradeAmount : 0);
    const maxBuyPercentage = Math.max(daoRecord?.max_buy_percentage || 0, trade_type === 'buy' ? percentageOfSupply : 0);
    const maxSellPercentage = Math.max(daoRecord?.max_sell_percentage || 0, trade_type === 'sell' ? percentageOfSupply : 0);

    if (daoRecord) {
      await supabase
        .from('dao_eligibility')
        .update({
          total_bought: totalBought,
          total_sold: totalSold,
          max_buy_percentage: maxBuyPercentage,
          max_sell_percentage: maxSellPercentage,
          whale_status: isWhaleFlagged || daoRecord.whale_status,
          is_eligible: !isWhaleFlagged && daoRecord.is_eligible,
          flagged_reason: isWhaleFlagged ? `${trade_type.toUpperCase()}_WHALE_${percentageOfSupply.toFixed(2)}%` : daoRecord.flagged_reason,
          last_activity: new Date().toISOString()
        })
        .eq('id', daoRecord.id);
    } else {
      await supabase
        .from('dao_eligibility')
        .insert({
          wallet_address: trader_address,
          token_id,
          total_bought: totalBought,
          total_sold: totalSold,
          max_buy_percentage: maxBuyPercentage,
          max_sell_percentage: maxSellPercentage,
          whale_status: isWhaleFlagged,
          is_eligible: !isWhaleFlagged,
          flagged_reason: isWhaleFlagged ? `${trade_type.toUpperCase()}_WHALE_${percentageOfSupply.toFixed(2)}%` : null
        });
    }

    // 3. Log wallet activity
    await supabase
      .from('wallet_activity_log')
      .insert({
        wallet_address: trader_address,
        token_id,
        activity_type: trade_type,
        amount: tradeAmount,
        percentage_of_supply: percentageOfSupply,
        transaction_hash: `TX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        is_whale_flagged: isWhaleFlagged
      });

    // 4. Track creator profit from trade fee
    const { data: tokenData } = await supabase
      .from('coin_distributions')
      .select('*')
      .eq('token_id', token_id)
      .single();

    if (tokenData) {
      const { data: creatorProfit } = await supabase
        .from('creator_wallet_profits')
        .select('creator_address')
        .eq('token_id', token_id)
        .eq('profit_source', 'mint_allocation')
        .single();

      if (creatorProfit) {
        await supabase
          .from('creator_wallet_profits')
          .insert({
            token_id,
            creator_address: creatorProfit.creator_address,
            profit_source: 'trade_fee',
            amount: creatorFee,
            transaction_hash: `TX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          });
      }
    }

    // 5. Log protocol activity
    await supabase
      .from('protocol_activity')
      .insert({
        activity_type: isWhaleFlagged ? 'whale_flag' : 'trade',
        token_id,
        description: `${trade_type.toUpperCase()}: ${tradeAmount} ${token.symbol} by ${trader_address.slice(0, 8)}...`,
        metadata: {
          trader_address,
          amount: tradeAmount,
          percentage_of_supply: percentageOfSupply,
          fees: { creator: creatorFee, system: systemFee },
          whale_flagged: isWhaleFlagged
        }
      });

    // 6. Update token stats
    const newVolume = parseFloat(token.volume_24h) + tradeAmount;
    await supabase
      .from('tokens')
      .update({ volume_24h: newVolume })
      .eq('id', token_id);

    // 7. Create system log
    await supabase
      .from('logs')
      .insert({
        action: `TRADE_${trade_type.toUpperCase()}: ${token.symbol}`,
        token_id,
        details: {
          trader: trader_address,
          amount: tradeAmount,
          fees: { creator: creatorFee, system: systemFee },
          whale_detected: isWhaleFlagged
        }
      });

    console.log('Trade executed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        trade: {
          type: trade_type,
          amount: tradeAmount,
          fees: { creator: creatorFee, system: systemFee, total: totalFees }
        },
        whale_flagged: isWhaleFlagged
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Trade execution error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
