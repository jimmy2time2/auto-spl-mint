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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { invite_code, invitee_wallet } = await req.json();

    console.log('[DAO] Using invite code:', invite_code);

    // Extract inviter wallet from invite code
    const inviterWalletPrefix = invite_code.split('-')[1];
    
    // Find inviter by prefix
    const { data: existingInvites } = await supabase
      .from('invite_log')
      .select('inviter_wallet')
      .ilike('invite_code', `%${inviterWalletPrefix}%`)
      .limit(1);

    let inviterWallet = null;
    
    if (existingInvites && existingInvites.length > 0) {
      inviterWallet = existingInvites[0].inviter_wallet;
    } else {
      // Extract from code format: MIND9-WALLETPRE-TIMESTAMP
      const parts = invite_code.split('-');
      if (parts.length >= 2) {
        // Search for wallet starting with this prefix
        const { data: wallets } = await supabase
          .from('wallets')
          .select('address')
          .ilike('address', `${parts[1].toLowerCase()}%`)
          .limit(1);
        
        if (wallets && wallets.length > 0) {
          inviterWallet = wallets[0].address;
        }
      }
    }

    if (!inviterWallet) {
      return new Response(
        JSON.stringify({ error: 'Invalid invite code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already used this invite
    const { data: existingInvite } = await supabase
      .from('invite_log')
      .select('*')
      .eq('inviter_wallet', inviterWallet)
      .eq('invitee_wallet', invitee_wallet)
      .single();

    if (existingInvite) {
      return new Response(
        JSON.stringify({ error: 'Invite already used' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit check (max 10 invites per hour per inviter)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('invite_log')
      .select('*', { count: 'exact', head: true })
      .eq('inviter_wallet', inviterWallet)
      .gte('timestamp', oneHourAgo);

    if (count && count >= 10) {
      return new Response(
        JSON.stringify({ error: 'Invite rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record invite
    const { data: inviteLog, error: inviteError } = await supabase
      .from('invite_log')
      .insert({
        inviter_wallet: inviterWallet,
        invitee_wallet,
        invite_code
      })
      .select()
      .single();

    if (inviteError) throw inviteError;

    // Check and update eligibility for inviter
    await supabase.rpc('check_dao_eligibility', { wallet: inviterWallet });

    // Log to protocol activity
    await supabase.from('protocol_activity').insert({
      activity_type: 'invite_used',
      description: `Invite accepted`,
      metadata: {
        inviter_wallet: inviterWallet,
        invitee_wallet,
        invite_code
      }
    });

    console.log('[DAO] ✅ Invite used:', inviteLog.id);

    return new Response(
      JSON.stringify({ success: true, invite: inviteLog }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DAO ERROR]:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
