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

    const { token_id, distribution_amount } = await req.json();

    console.log('Selecting lucky wallet:', { token_id, distribution_amount });

    // Get recent minters (last 50 wallet activities)
    const { data: recentActivity, error: activityError } = await supabase
      .from('wallet_activity_log')
      .select('wallet_address, timestamp')
      .eq('token_id', token_id)
      .in('activity_type', ['mint', 'buy'])
      .order('timestamp', { ascending: false })
      .limit(50);

    if (activityError) throw activityError;

    if (!recentActivity || recentActivity.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No eligible wallets found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate activity scores for each wallet
    const walletScores = new Map<string, number>();
    
    recentActivity.forEach((activity, index) => {
      const recencyScore = 50 - index; // More recent = higher score
      const currentScore = walletScores.get(activity.wallet_address) || 0;
      walletScores.set(activity.wallet_address, currentScore + recencyScore);
    });

    // Check DAO eligibility (exclude whales)
    const walletAddresses = Array.from(walletScores.keys());
    const { data: daoRecords } = await supabase
      .from('dao_eligibility')
      .select('wallet_address, is_eligible, whale_status')
      .in('wallet_address', walletAddresses)
      .eq('token_id', token_id);

    // Filter out whales and ineligible wallets
    const eligibleWallets = walletAddresses.filter(address => {
      const daoRecord = daoRecords?.find(r => r.wallet_address === address);
      return !daoRecord || (daoRecord.is_eligible && !daoRecord.whale_status);
    });

    if (eligibleWallets.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No eligible non-whale wallets found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Weighted random selection based on activity scores
    const weights = eligibleWallets.map(addr => walletScores.get(addr) || 0);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const random = Math.random() * totalWeight;
    
    let cumulativeWeight = 0;
    let selectedWallet = eligibleWallets[0];
    
    for (let i = 0; i < eligibleWallets.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        selectedWallet = eligibleWallets[i];
        break;
      }
    }

    const activityScore = walletScores.get(selectedWallet) || 0;

    // Log the lucky wallet selection
    const { error: selectionError } = await supabase
      .from('lucky_wallet_selections')
      .insert({
        wallet_address: selectedWallet,
        token_id,
        distribution_amount: parseFloat(distribution_amount),
        is_recent_minter: true,
        activity_score: activityScore
      });

    if (selectionError) throw selectionError;

    // Log protocol activity
    await supabase
      .from('protocol_activity')
      .insert({
        activity_type: 'fee_collection',
        token_id,
        description: `Lucky wallet selected: ${selectedWallet.slice(0, 8)}...`,
        metadata: {
          wallet_address: selectedWallet,
          distribution_amount,
          activity_score: activityScore,
          eligible_pool_size: eligibleWallets.length
        }
      });

    // Create system log
    const { data: token } = await supabase
      .from('tokens')
      .select('symbol')
      .eq('id', token_id)
      .single();

    await supabase
      .from('logs')
      .insert({
        action: `LUCKY_WALLET_SELECTED: ${token?.symbol}`,
        token_id,
        details: {
          wallet: selectedWallet,
          amount: distribution_amount,
          activity_score: activityScore
        }
      });

    console.log('Lucky wallet selected:', selectedWallet);

    return new Response(
      JSON.stringify({ 
        success: true,
        lucky_wallet: {
          address: selectedWallet,
          distribution_amount,
          activity_score: activityScore,
          eligible_pool_size: eligibleWallets.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Lucky wallet selection error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
