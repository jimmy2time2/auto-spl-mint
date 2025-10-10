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

    console.log('💰 Profit Management: Starting redistribution...');

    // 1. Fetch AI wallet balance (unallocated profit)
    const { data: aiWallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('type', 'ai')
      .single();

    if (walletError) {
      throw new Error(`Failed to fetch AI wallet: ${walletError.message}`);
    }

    if (!aiWallet || aiWallet.balance <= 0) {
      console.log('⏸️ No unallocated profits to distribute');
      
      await supabase.from('protocol_activity').insert({
        activity_type: 'profit_redistribution',
        description: 'No unallocated profits available for redistribution',
        metadata: {
          ai_wallet_balance: aiWallet?.balance || 0,
          timestamp: new Date().toISOString()
        }
      });

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No profits to redistribute',
          ai_balance: aiWallet?.balance || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const totalProfit = aiWallet.balance;
    console.log(`💵 Total unallocated profit: ${totalProfit}`);

    // 2. Calculate distribution (80% reinvest, 15% DAO, 3% Lucky, 2% Creator)
    const reinvestmentAmount = totalProfit * 0.80;
    const daoAmount = totalProfit * 0.15;
    const luckyAmount = totalProfit * 0.03;
    const creatorAmount = totalProfit * 0.02;

    console.log('📊 Distribution calculated:', {
      reinvestment: reinvestmentAmount,
      dao: daoAmount,
      lucky: luckyAmount,
      creator: creatorAmount
    });

    // 3. Update wallet balances
    // Update DAO treasury
    const { data: currentDao } = await supabase
      .from('dao_treasury')
      .select('*')
      .limit(1)
      .single();

    if (currentDao) {
      await supabase
        .from('dao_treasury')
        .update({
          balance: currentDao.balance + daoAmount,
          total_received: currentDao.total_received + daoAmount,
          last_update: new Date().toISOString(),
          event_type: 'ai_profit_distribution',
          description: `AI profit redistribution: ${daoAmount}`,
          amount: daoAmount
        })
        .eq('id', currentDao.id);
    }

    // Update system wallet (for reinvestment)
    const { data: systemWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('type', 'system')
      .maybeSingle();

    if (systemWallet) {
      await supabase
        .from('wallets')
        .update({
          balance: systemWallet.balance + reinvestmentAmount,
          total_rewards: systemWallet.total_rewards + reinvestmentAmount,
          reward_count: systemWallet.reward_count + 1,
          last_reward_timestamp: new Date().toISOString()
        })
        .eq('id', systemWallet.id);
    }

    // Update lucky wallet pool
    const { data: luckyWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('type', 'public_lucky')
      .maybeSingle();

    if (luckyWallet) {
      await supabase
        .from('wallets')
        .update({
          balance: luckyWallet.balance + luckyAmount,
          total_rewards: luckyWallet.total_rewards + luckyAmount,
          reward_count: luckyWallet.reward_count + 1,
          last_reward_timestamp: new Date().toISOString()
        })
        .eq('id', luckyWallet.id);
    }

    // Update creator wallet pool  
    const { data: creatorWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('type', 'creator')
      .maybeSingle();

    if (creatorWallet) {
      await supabase
        .from('wallets')
        .update({
          balance: creatorWallet.balance + creatorAmount,
          total_rewards: creatorWallet.total_rewards + creatorAmount,
          reward_count: creatorWallet.reward_count + 1,
          last_reward_timestamp: new Date().toISOString()
        })
        .eq('id', creatorWallet.id);
    }

    // Reset AI wallet balance to 0
    await supabase
      .from('wallets')
      .update({ balance: 0 })
      .eq('id', aiWallet.id);

    // 4. Log to protocol_activity
    await supabase.from('protocol_activity').insert({
      activity_type: 'profit_redistribution',
      description: `Redistributed ${totalProfit} in AI profits`,
      metadata: {
        total_profit: totalProfit,
        distribution: {
          reinvestment: reinvestmentAmount,
          dao: daoAmount,
          lucky: luckyAmount,
          creator: creatorAmount
        },
        percentages: {
          reinvestment: '80%',
          dao: '15%',
          lucky: '3%',
          creator: '2%'
        },
        timestamp: new Date().toISOString()
      }
    });

    // 5. Log to system logs
    await supabase.from('logs').insert({
      action: 'PROFIT_REDISTRIBUTION',
      details: {
        total_profit: totalProfit,
        reinvestment: reinvestmentAmount,
        dao: daoAmount,
        lucky: luckyAmount,
        creator: creatorAmount
      }
    });

    console.log('✅ Profit redistribution complete');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Profit redistribution completed successfully',
        total_redistributed: totalProfit,
        distribution: {
          reinvestment: reinvestmentAmount,
          dao: daoAmount,
          lucky: luckyAmount,
          creator: creatorAmount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Profit management error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
