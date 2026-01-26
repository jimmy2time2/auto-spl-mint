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

    // Get ALL wallets that have interacted with the platform
    // This includes minters, buyers, sellers - anyone who participated
    const { data: allActivity, error: activityError } = await supabase
      .from('wallet_activity_log')
      .select('wallet_address, timestamp, activity_type')
      .order('timestamp', { ascending: false })
      .limit(500);

    if (activityError) throw activityError;

    // Also get wallets from invite_log (people who shared/invited)
    const { data: inviteActivity } = await supabase
      .from('invite_log')
      .select('inviter_wallet, inviter_score')
      .order('timestamp', { ascending: false })
      .limit(200);

    // Build wallet pool with base entries
    const walletEntries = new Map<string, number>();
    
    // Everyone who interacted gets base entries
    if (allActivity) {
      allActivity.forEach((activity) => {
        const currentEntries = walletEntries.get(activity.wallet_address) || 0;
        // Base entry for any activity
        walletEntries.set(activity.wallet_address, currentEntries + 1);
      });
    }

    // Bonus entries for sharing/inviting (+10 per share)
    if (inviteActivity) {
      inviteActivity.forEach((invite) => {
        const currentEntries = walletEntries.get(invite.inviter_wallet) || 0;
        // +10 entries per invite/share
        walletEntries.set(invite.inviter_wallet, currentEntries + 10);
      });
    }

    // If no activity at all, return error
    if (walletEntries.size === 0) {
      return new Response(
        JSON.stringify({ error: 'No eligible wallets found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check DAO eligibility to exclude only extreme whales (optional filter)
    const walletAddresses = Array.from(walletEntries.keys());
    const { data: daoRecords } = await supabase
      .from('dao_eligibility')
      .select('wallet_address, whale_status')
      .in('wallet_address', walletAddresses);

    // Only exclude extreme whales (>10% supply holders)
    const eligibleWallets = walletAddresses.filter(address => {
      const daoRecord = daoRecords?.find(r => r.wallet_address === address);
      // Include everyone except flagged whales
      return !daoRecord || !daoRecord.whale_status;
    });

    if (eligibleWallets.length === 0) {
      // Fallback: if all are whales somehow, just pick from all
      const allWallets = Array.from(walletEntries.keys());
      const randomIndex = Math.floor(Math.random() * allWallets.length);
      const selectedWallet = allWallets[randomIndex];
      
      return await recordSelection(supabase, selectedWallet, token_id, distribution_amount, 1, eligibleWallets.length);
    }

    // Weighted random selection based on entries
    const weights = eligibleWallets.map(addr => walletEntries.get(addr) || 1);
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

    const entries = walletEntries.get(selectedWallet) || 1;

    return await recordSelection(supabase, selectedWallet, token_id, distribution_amount, entries, eligibleWallets.length);

  } catch (error) {
    console.error('Lucky wallet selection error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function recordSelection(
  supabase: any, 
  selectedWallet: string, 
  token_id: string, 
  distribution_amount: number, 
  activityScore: number,
  poolSize: number
) {
  // Log the lucky wallet selection
  const { error: selectionError } = await supabase
    .from('lucky_wallet_selections')
    .insert({
      wallet_address: selectedWallet,
      token_id,
      distribution_amount: parseFloat(String(distribution_amount)),
      is_recent_minter: false,
      activity_score: activityScore
    });

  if (selectionError) throw selectionError;

  // Log protocol activity
  await supabase
    .from('protocol_activity')
    .insert({
      activity_type: 'lucky_selection',
      token_id,
      description: `Lucky wallet: ${selectedWallet.slice(0, 8)}...`,
      metadata: {
        wallet_address: selectedWallet,
        distribution_amount,
        entries: activityScore,
        eligible_pool_size: poolSize
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
      action: `LUCKY_WALLET: ${token?.symbol || 'TOKEN'}`,
      token_id,
      details: {
        wallet: selectedWallet,
        amount: distribution_amount,
        entries: activityScore
      }
    });

  console.log('Lucky wallet selected:', selectedWallet);

  return new Response(
    JSON.stringify({ 
      success: true,
      lucky_wallet: {
        address: selectedWallet,
        distribution_amount,
        entries: activityScore,
        eligible_pool_size: poolSize
      }
    }),
    { headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
  );
}
