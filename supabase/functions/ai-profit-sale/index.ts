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

    const { token_id, sale_amount } = await req.json();

    console.log('AI Profit Sale:', { token_id, sale_amount });

    // Get token details
    const { data: token, error: tokenError } = await supabase
      .from('tokens')
      .select('*')
      .eq('id', token_id)
      .single();

    if (tokenError) throw tokenError;

    const totalSale = parseFloat(sale_amount);

    // Split: 80% reinvestment, 15% DAO, 2% creator, 3% lucky
    const reinvestmentAmount = totalSale * 0.80;
    const daoAmount = totalSale * 0.15;
    const creatorAmount = totalSale * 0.02;
    const luckyAmount = totalSale * 0.03;

    // 1. Log profit event
    const { error: profitError } = await supabase
      .from('profit_events')
      .insert({
        token_id,
        sale_amount: totalSale,
        reinvestment_amount: reinvestmentAmount,
        dao_amount: daoAmount,
        creator_amount: creatorAmount,
        lucky_amount: luckyAmount,
        transaction_hash: `TX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });

    if (profitError) throw profitError;

    // 2. Update DAO treasury
    const { data: treasury } = await supabase
      .from('dao_treasury')
      .select('*')
      .single();

    if (treasury) {
      await supabase
        .from('dao_treasury')
        .update({
          balance: parseFloat(treasury.balance) + daoAmount,
          total_received: parseFloat(treasury.total_received) + daoAmount,
          last_update: new Date().toISOString()
        })
        .eq('id', treasury.id);
    }

    // 3. Track creator profit from AI sale
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
          profit_source: 'ai_profit_share',
          amount: creatorAmount,
          transaction_hash: `TX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
    }

    // 4. Distribute to lucky wallet (select from recent minters)
    const { data: recentActivity } = await supabase
      .from('wallet_activity_log')
      .select('wallet_address')
      .eq('token_id', token_id)
      .eq('activity_type', 'mint')
      .order('timestamp', { ascending: false })
      .limit(10);

    if (recentActivity && recentActivity.length > 0) {
      // Select random wallet from recent minters
      const luckyWallet = recentActivity[Math.floor(Math.random() * recentActivity.length)];
      
      await supabase
        .from('lucky_wallet_selections')
        .insert({
          wallet_address: luckyWallet.wallet_address,
          token_id,
          distribution_amount: luckyAmount,
          is_recent_minter: true,
          activity_score: Math.random() * 100
        });

      console.log('Lucky wallet selected:', luckyWallet.wallet_address);
    }

    // 5. Log protocol activity
    await supabase
      .from('protocol_activity')
      .insert({
        activity_type: 'profit_distribution',
        token_id,
        description: `AI profit sale: ${totalSale} distributed`,
        metadata: {
          sale_amount: totalSale,
          splits: {
            reinvestment: reinvestmentAmount,
            dao: daoAmount,
            creator: creatorAmount,
            lucky: luckyAmount
          }
        }
      });

    // 6. Create system log
    await supabase
      .from('logs')
      .insert({
        action: `AI_PROFIT_SALE: ${token.symbol}`,
        token_id,
        details: {
          sale_amount: totalSale,
          distribution: 'Reinvest:80% DAO:15% Creator:2% Lucky:3%'
        }
      });

    console.log('AI profit sale processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        distribution: {
          reinvestment: reinvestmentAmount,
          dao: daoAmount,
          creator: creatorAmount,
          lucky: luckyAmount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI profit sale error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
