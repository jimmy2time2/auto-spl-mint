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

    const { title, description, wallet_address, tags, payout_address, payout_amount } = await req.json();

    console.log('[DAO] Creating proposal:', title);

    // Validate inputs
    if (!title || title.length < 5 || title.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Title must be between 5 and 200 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!description || description.length < 20 || description.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Description must be between 20 and 5000 characters' }),
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
        JSON.stringify({ error: 'Wallet not eligible to create proposals' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('dao_proposals')
      .insert({
        title,
        description,
        created_by: wallet_address,
        tags: tags || [],
        payout_address: payout_address || null,
        payout_amount: payout_amount || null
      })
      .select()
      .single();

    if (proposalError) throw proposalError;

    // Log to protocol activity
    await supabase.from('protocol_activity').insert({
      activity_type: 'dao_proposal_created',
      description: `New DAO proposal: ${title}`,
      metadata: {
        proposal_id: proposal.id,
        created_by: wallet_address,
        tags
      }
    });

    console.log('[DAO] ✅ Proposal created:', proposal.id);

    return new Response(
      JSON.stringify({ success: true, proposal }),
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
