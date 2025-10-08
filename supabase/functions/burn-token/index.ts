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

    const { token_id, wallet_address, amount } = await req.json();

    if (!token_id || !wallet_address || !amount) {
      throw new Error('token_id, wallet_address, and amount are required');
    }

    console.log('Burning tokens:', { token_id, wallet_address, amount });

    // Validate burn amount
    const burnAmount = parseFloat(amount);
    if (burnAmount <= 0) {
      throw new Error('Burn amount must be positive');
    }

    // Get token info
    const { data: token, error: tokenError } = await supabase
      .from('tokens')
      .select('*')
      .eq('id', token_id)
      .single();

    if (tokenError) throw tokenError;
    if (!token) throw new Error('Token not found');

    // Check if wallet has enough balance
    const { data: walletActivities } = await supabase
      .from('wallet_activity_log')
      .select('amount, activity_type')
      .eq('token_id', token_id)
      .eq('wallet_address', wallet_address);

    let balance = 0;
    (walletActivities || []).forEach(activity => {
      const amt = parseFloat(activity.amount.toString());
      if (activity.activity_type === 'buy' || activity.activity_type === 'mint') {
        balance += amt;
      } else if (activity.activity_type === 'sell' || activity.activity_type === 'burn') {
        balance -= amt;
      }
    });

    if (balance < burnAmount) {
      throw new Error(`Insufficient balance. You have ${balance} but trying to burn ${burnAmount}`);
    }

    // Calculate percentage of supply being burned
    const totalSupply = parseFloat(token.supply);
    const percentageOfSupply = (burnAmount / totalSupply) * 100;

    // Log the burn in wallet_activity_log
    const { error: logError } = await supabase
      .from('wallet_activity_log')
      .insert({
        token_id,
        wallet_address,
        activity_type: 'burn',
        amount: burnAmount,
        percentage_of_supply: percentageOfSupply,
        transaction_hash: `BURN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });

    if (logError) throw logError;

    // Update token supply (reduce by burned amount)
    const newSupply = totalSupply - burnAmount;
    const { error: updateError } = await supabase
      .from('tokens')
      .update({ supply: newSupply })
      .eq('id', token_id);

    if (updateError) throw updateError;

    // Log protocol activity
    const { error: activityError } = await supabase
      .from('protocol_activity')
      .insert({
        activity_type: 'token_burn',
        token_id,
        description: `${wallet_address} burned ${burnAmount} ${token.symbol} (${percentageOfSupply.toFixed(2)}% of supply)`,
        metadata: {
          wallet_address,
          amount_burned: burnAmount,
          percentage_of_supply: percentageOfSupply,
          new_supply: newSupply,
          old_supply: totalSupply,
        }
      });

    if (activityError) console.error('Activity log error:', activityError);

    // Create system log
    const { error: sysLogError } = await supabase
      .from('logs')
      .insert({
        action: `TOKEN_BURN: ${token.symbol}`,
        token_id,
        details: {
          wallet: wallet_address,
          amount: burnAmount,
          percentage: percentageOfSupply.toFixed(2) + '%',
          new_supply: newSupply,
        }
      });

    if (sysLogError) console.error('System log error:', sysLogError);

    console.log('Tokens burned successfully');

    return new Response(
      JSON.stringify({
        success: true,
        burn: {
          token_id,
          token_symbol: token.symbol,
          wallet_address,
          amount_burned: burnAmount,
          percentage_of_supply: percentageOfSupply,
          old_supply: totalSupply,
          new_supply: newSupply,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Burn token error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
