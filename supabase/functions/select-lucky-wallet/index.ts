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
    const { data: allActivity, error: activityError } = await supabase
      .from('wallet_activity_log')
      .select('wallet_address, timestamp, activity_type')
      .order('timestamp', { ascending: false })
      .limit(500);

    if (activityError) throw activityError;

    // Get referral bonus entries
    const { data: referralLinks } = await supabase
      .from('referral_links')
      .select('wallet_address, bonus_entries')
      .gt('bonus_entries', 0);

    // Build wallet pool with base entries
    const walletEntries = new Map<string, number>();
    
    // Everyone who interacted gets base entries
    if (allActivity) {
      allActivity.forEach((activity: { wallet_address: string }) => {
        const currentEntries = walletEntries.get(activity.wallet_address) || 0;
        walletEntries.set(activity.wallet_address, currentEntries + 1);
      });
    }

    // Add referral bonus entries (from Twitter shares)
    if (referralLinks) {
      referralLinks.forEach((link: { wallet_address: string; bonus_entries: number }) => {
        const currentEntries = walletEntries.get(link.wallet_address) || 0;
        walletEntries.set(link.wallet_address, currentEntries + link.bonus_entries);
      });
    }

    // If no entries at all, return error
    if (walletEntries.size === 0) {
      return new Response(
        JSON.stringify({ error: 'No eligible wallets found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check DAO eligibility to exclude only extreme whales
    const walletAddresses = Array.from(walletEntries.keys());
    const { data: daoRecords } = await supabase
      .from('dao_eligibility')
      .select('wallet_address, whale_status')
      .in('wallet_address', walletAddresses);

    // Only exclude extreme whales (>10% supply holders)
    const eligibleWallets = walletAddresses.filter(address => {
      const daoRecord = (daoRecords as Array<{ wallet_address: string; whale_status: boolean }> | null)?.find(r => r.wallet_address === address);
      return !daoRecord || !daoRecord.whale_status;
    });

    let selectedWallet: string;
    let entries: number;
    let poolSize: number;

    if (eligibleWallets.length === 0) {
      // Fallback: pick from all if everyone is a whale
      const allWallets = Array.from(walletEntries.keys());
      const randomIndex = Math.floor(Math.random() * allWallets.length);
      selectedWallet = allWallets[randomIndex];
      entries = walletEntries.get(selectedWallet) || 1;
      poolSize = allWallets.length;
    } else {
      // Weighted random selection based on entries
      const weights = eligibleWallets.map(addr => walletEntries.get(addr) || 1);
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      const random = Math.random() * totalWeight;
      
      let cumulativeWeight = 0;
      selectedWallet = eligibleWallets[0];
      
      for (let i = 0; i < eligibleWallets.length; i++) {
        cumulativeWeight += weights[i];
        if (random <= cumulativeWeight) {
          selectedWallet = eligibleWallets[i];
          break;
        }
      }

      entries = walletEntries.get(selectedWallet) || 1;
      poolSize = eligibleWallets.length;
    }

    // Log the lucky wallet selection
    const { error: selectionError } = await supabase
      .from('lucky_wallet_selections')
      .insert({
        wallet_address: selectedWallet,
        token_id,
        distribution_amount: parseFloat(String(distribution_amount)),
        is_recent_minter: false,
        activity_score: entries
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
          entries,
          eligible_pool_size: poolSize
        }
      });

    // Create system log
    const { data: token } = await supabase
      .from('tokens')
      .select('symbol')
      .eq('id', token_id)
      .single();

    const tokenData = token as { symbol: string } | null;

    await supabase
      .from('logs')
      .insert({
        action: `LUCKY_WALLET: ${tokenData?.symbol || 'TOKEN'}`,
        token_id,
        details: {
          wallet: selectedWallet,
          amount: distribution_amount,
          entries
        }
      });

    console.log('Lucky wallet selected:', selectedWallet, 'with', entries, 'entries');

    return new Response(
      JSON.stringify({ 
        success: true,
        lucky_wallet: {
          address: selectedWallet,
          distribution_amount,
          entries,
          eligible_pool_size: poolSize
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
