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

    const { wallet_address } = await req.json();

    if (!wallet_address) {
      throw new Error('wallet_address is required');
    }

    console.log('Fetching activity for wallet:', wallet_address);

    // Get all wallet activity
    const { data: activities, error: activityError } = await supabase
      .from('wallet_activity_log')
      .select('*')
      .eq('wallet_address', wallet_address)
      .order('timestamp', { ascending: false });

    if (activityError) throw activityError;

    // Get tokens held (aggregate by token_id)
    const tokensHeld = new Map();
    (activities || []).forEach(activity => {
      const tokenId = activity.token_id;
      const amount = parseFloat(activity.amount.toString());
      
      if (!tokensHeld.has(tokenId)) {
        tokensHeld.set(tokenId, { 
          token_id: tokenId, 
          balance: 0,
          buy_total: 0,
          sell_total: 0,
        });
      }
      
      const token = tokensHeld.get(tokenId);
      if (activity.activity_type === 'buy' || activity.activity_type === 'mint') {
        token.balance += amount;
        token.buy_total += amount;
      } else if (activity.activity_type === 'sell') {
        token.balance -= amount;
        token.sell_total += amount;
      }
    });

    // Enrich token holdings with token info
    const holdings = await Promise.all(
      Array.from(tokensHeld.values())
        .filter(t => t.balance > 0)
        .map(async (holding) => {
          const { data: token } = await supabase
            .from('tokens')
            .select('name, symbol, price')
            .eq('id', holding.token_id)
            .single();

          const currentValue = holding.balance * (token ? parseFloat(token.price) : 0);

          return {
            token_id: holding.token_id,
            token_name: token?.name || 'Unknown',
            token_symbol: token?.symbol || 'UNKNOWN',
            balance: holding.balance,
            current_price: token ? parseFloat(token.price) : 0,
            current_value: currentValue,
            buy_total: holding.buy_total,
            sell_total: holding.sell_total,
          };
        })
    );

    // Check DAO eligibility
    const { data: daoEligibility } = await supabase
      .from('dao_eligibility')
      .select('*')
      .eq('wallet_address', wallet_address)
      .eq('active', true)
      .single();

    // Check if wallet has received lucky rewards
    const { data: luckySelections } = await supabase
      .from('lucky_wallet_selections')
      .select('*')
      .eq('wallet_address', wallet_address);

    const totalLuckyRewards = luckySelections?.reduce(
      (sum, s) => sum + parseFloat(s.distribution_amount.toString()), 
      0
    ) || 0;

    // Get creator profits (if this wallet created any tokens)
    const { data: creatorProfits } = await supabase
      .from('creator_wallet_profits')
      .select('*')
      .eq('creator_address', wallet_address);

    const totalCreatorProfit = creatorProfits?.reduce(
      (sum, p) => sum + parseFloat(p.amount.toString()), 
      0
    ) || 0;

    // Calculate total value and P&L
    const totalValue = holdings.reduce((sum, h) => sum + h.current_value, 0);
    const totalInvested = holdings.reduce((sum, h) => sum + h.buy_total * 0.001, 0); // Estimate using average entry price
    const totalPnL = totalValue - totalInvested;

    console.log('Wallet activity compiled successfully');

    return new Response(
      JSON.stringify({
        success: true,
        wallet_address,
        summary: {
          total_trades: activities?.length || 0,
          tokens_held: holdings.length,
          total_value: totalValue,
          total_pnl: totalPnL,
          lucky_rewards_total: totalLuckyRewards,
          creator_profit_total: totalCreatorProfit,
          dao_eligible: !!daoEligibility,
        },
        holdings,
        recent_activity: (activities || []).slice(0, 50).map(a => ({
          id: a.id,
          token_id: a.token_id,
          activity_type: a.activity_type,
          amount: parseFloat(a.amount.toString()),
          percentage_of_supply: parseFloat(a.percentage_of_supply.toString()),
          timestamp: a.timestamp,
          is_whale_flagged: a.is_whale_flagged,
          transaction_hash: a.transaction_hash,
        })),
        dao_status: daoEligibility ? {
          is_eligible: daoEligibility.is_eligible,
          eligibility_type: daoEligibility.eligibility_type,
          whale_status: daoEligibility.whale_status,
          eligibility_date: daoEligibility.eligibility_date,
        } : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Get wallet activity error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
