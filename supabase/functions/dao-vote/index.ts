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

    const { proposal_id, wallet_address, vote } = await req.json();

    console.log('[DAO] Voting:', { proposal_id, wallet_address, vote });

    // Validate vote
    if (!['yes', 'no', 'abstain'].includes(vote)) {
      return new Response(
        JSON.stringify({ error: 'Vote must be yes, no, or abstain' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check eligibility
    const { data: eligibility } = await supabase
      .from('dao_eligibility')
      .select('*')
      .eq('wallet_address', wallet_address)
      .eq('is_eligible', true)
      .eq('active', true)
      .single();

    if (!eligibility) {
      return new Response(
        JSON.stringify({ error: 'Wallet not eligible to vote' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if proposal is open
    const { data: proposal } = await supabase
      .from('dao_proposals')
      .select('*')
      .eq('id', proposal_id)
      .single();

    if (!proposal || proposal.status !== 'open' || new Date(proposal.closes_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Proposal is not open for voting' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already voted
    const { data: existingVote } = await supabase
      .from('dao_votes')
      .select('*')
      .eq('proposal_id', proposal_id)
      .eq('wallet_address', wallet_address)
      .single();

    if (existingVote) {
      return new Response(
        JSON.stringify({ error: 'Already voted on this proposal' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate vote power (based on tokens held + AI score)
    const votePower = 1 + (eligibility.ai_score || 0) * 0.1;

    // Cast vote
    const { data: voteData, error: voteError } = await supabase
      .from('dao_votes')
      .insert({
        proposal_id,
        wallet_address,
        vote,
        vote_power: votePower
      })
      .select()
      .single();

    if (voteError) throw voteError;

    // Log to protocol activity
    await supabase.from('protocol_activity').insert({
      activity_type: 'dao_vote_cast',
      description: `Vote cast: ${vote}`,
      metadata: {
        proposal_id,
        wallet_address,
        vote,
        vote_power: votePower
      }
    });

    console.log('[DAO] ✅ Vote cast:', voteData.id);

    return new Response(
      JSON.stringify({ success: true, vote: voteData }),
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
