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

    const { tokenId, distributionAmount } = await req.json();

    console.log('Selecting lucky wallet for token:', tokenId);

    // Get recent minters/traders (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentActivity } = await supabaseClient
      .from('wallet_activity_log')
      .select('wallet_address, activity_type')
      .eq('token_id', tokenId)
      .gte('timestamp', oneDayAgo)
      .order('timestamp', { ascending: false });

    // Get eligible wallets (not whales)
    const { data: eligibleWallets } = await supabaseClient
      .from('dao_eligibility')
      .select('wallet_address, is_eligible')
      .eq('token_id', tokenId)
      .eq('is_eligible', true);

    if (!eligibleWallets || eligibleWallets.length === 0) {
      throw new Error('No eligible wallets found for lucky selection');
    }

    // Calculate activity scores
    const walletScores = new Map<string, number>();
    
    recentActivity?.forEach(activity => {
      const currentScore = walletScores.get(activity.wallet_address) || 0;
      // Give higher score to minters
      const scoreIncrement = activity.activity_type === 'mint' ? 3 : 1;
      walletScores.set(activity.wallet_address, currentScore + scoreIncrement);
    });

    // Filter eligible wallets and assign scores
    const candidates = eligibleWallets
      .map(wallet => ({
        address: wallet.wallet_address,
        score: walletScores.get(wallet.wallet_address) || 0,
        isRecentMinter: recentActivity?.some(
          a => a.wallet_address === wallet.wallet_address && a.activity_type === 'mint'
        ) || false
      }))
      .filter(c => c.score > 0);

    if (candidates.length === 0) {
      throw new Error('No active candidates for lucky wallet selection');
    }

    // Weighted random selection based on activity score
    const totalScore = candidates.reduce((sum, c) => sum + c.score, 0);
    let random = Math.random() * totalScore;
    
    let selectedWallet = candidates[0];
    for (const candidate of candidates) {
      random -= candidate.score;
      if (random <= 0) {
        selectedWallet = candidate;
        break;
      }
    }

    // Record lucky wallet selection
    const { error: selectionError } = await supabaseClient
      .from('lucky_wallet_selections')
      .insert({
        wallet_address: selectedWallet.address,
        token_id: tokenId,
        distribution_amount: distributionAmount,
        is_recent_minter: selectedWallet.isRecentMinter,
        activity_score: selectedWallet.score
      });

    if (selectionError) throw selectionError;

    // Update public_lucky wallet balance
    const { data: luckyWallet } = await supabaseClient
      .from('wallets')
      .select('*')
      .eq('type', 'public_lucky')
      .single();

    if (luckyWallet) {
      await supabaseClient
        .from('wallets')
        .update({
          balance: Number(luckyWallet.balance) + Number(distributionAmount),
          total_rewards: Number(luckyWallet.total_rewards) + Number(distributionAmount),
          reward_count: Number(luckyWallet.reward_count) + 1,
          last_reward_timestamp: new Date().toISOString()
        })
        .eq('id', luckyWallet.id);
    }

    // Log protocol activity
    await supabaseClient
      .from('protocol_activity')
      .insert({
        activity_type: 'profit_distribution',
        token_id: tokenId,
        description: `Lucky wallet selected: ${selectedWallet.address}`,
        metadata: {
          wallet: selectedWallet.address,
          amount: distributionAmount,
          activityScore: selectedWallet.score,
          isRecentMinter: selectedWallet.isRecentMinter
        }
      });

    console.log('Lucky wallet selected:', selectedWallet.address);

    return new Response(
      JSON.stringify({ 
        success: true,
        selectedWallet: selectedWallet.address,
        distributionAmount,
        activityScore: selectedWallet.score
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in select-lucky-wallet:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
