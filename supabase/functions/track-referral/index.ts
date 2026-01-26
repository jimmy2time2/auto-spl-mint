import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, wallet_address, referral_code } = await req.json();

    console.log('Referral tracking:', { action, wallet_address, referral_code });

    // Action: Generate or get referral link for a wallet
    if (action === 'get_link') {
      if (!wallet_address) {
        return new Response(
          JSON.stringify({ error: 'Wallet address required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if wallet already has a referral code
      const { data: existing } = await supabase
        .from('referral_links')
        .select('*')
        .eq('wallet_address', wallet_address)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ 
            success: true,
            referral_link: existing
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate new referral code
      let newCode = generateReferralCode();
      let attempts = 0;
      
      while (attempts < 5) {
        const { data: codeExists } = await supabase
          .from('referral_links')
          .select('id')
          .eq('referral_code', newCode)
          .single();
        
        if (!codeExists) break;
        newCode = generateReferralCode();
        attempts++;
      }

      // Insert new referral link
      const { data: newLink, error: insertError } = await supabase
        .from('referral_links')
        .insert({
          wallet_address,
          referral_code: newCode
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({ 
          success: true,
          referral_link: newLink
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Record a share (when user clicks share button)
    if (action === 'record_share') {
      if (!wallet_address) {
        return new Response(
          JSON.stringify({ error: 'Wallet address required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get current stats
      const { data: current } = await supabase
        .from('referral_links')
        .select('share_count')
        .eq('wallet_address', wallet_address)
        .single();

      if (current) {
        await supabase
          .from('referral_links')
          .update({ 
            share_count: (current.share_count || 0) + 1,
            last_share_at: new Date().toISOString()
          })
          .eq('wallet_address', wallet_address);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Track a visit from referral link
    if (action === 'track_visit') {
      if (!referral_code) {
        return new Response(
          JSON.stringify({ error: 'Referral code required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get visitor IP for deduplication
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
      const ipHash = hashIP(ip);

      // Check if this referral code exists
      const { data: referralLink } = await supabase
        .from('referral_links')
        .select('*')
        .eq('referral_code', referral_code)
        .single();

      if (!referralLink) {
        return new Response(
          JSON.stringify({ error: 'Invalid referral code' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if this visitor already visited this link
      const { data: existingVisit } = await supabase
        .from('referral_visits')
        .select('id')
        .eq('referral_code', referral_code)
        .eq('visitor_ip_hash', ipHash)
        .single();

      if (existingVisit) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Already counted',
            referrer_wallet: referralLink.wallet_address
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Record new visit
      await supabase
        .from('referral_visits')
        .insert({
          referral_code,
          visitor_ip_hash: ipHash,
          visitor_wallet: wallet_address || null
        });

      // Update referral link stats (+10 bonus entries per unique visit)
      await supabase
        .from('referral_links')
        .update({ 
          visit_count: referralLink.visit_count + 1,
          bonus_entries: referralLink.bonus_entries + 10,
          last_visit_at: new Date().toISOString()
        })
        .eq('id', referralLink.id);

      // Log to protocol activity
      await supabase
        .from('protocol_activity')
        .insert({
          activity_type: 'referral_visit',
          description: `Referral visit: ${referral_code}`,
          metadata: {
            referrer_wallet: referralLink.wallet_address,
            bonus_entries_awarded: 10
          }
        });

      return new Response(
        JSON.stringify({ 
          success: true,
          referrer_wallet: referralLink.wallet_address,
          entries_awarded: 10
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Get referral stats for a wallet
    if (action === 'get_stats') {
      if (!wallet_address) {
        return new Response(
          JSON.stringify({ error: 'Wallet address required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: stats } = await supabase
        .from('referral_links')
        .select('*')
        .eq('wallet_address', wallet_address)
        .single();

      return new Response(
        JSON.stringify({ 
          success: true,
          stats: stats || { share_count: 0, visit_count: 0, bonus_entries: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Referral tracking error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
