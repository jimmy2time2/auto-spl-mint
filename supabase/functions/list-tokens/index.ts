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

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const sort_by = url.searchParams.get('sort_by') || 'launch_timestamp';
    const order = url.searchParams.get('order') || 'desc';
    const search = url.searchParams.get('search') || '';

    console.log('Listing tokens with filters:', { limit, offset, sort_by, order, search });

    // Build query
    let query = supabase
      .from('tokens')
      .select('*', { count: 'exact' });

    // Apply search filter if provided
    if (search) {
      query = query.or(`symbol.ilike.%${search}%,name.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sort_by as any, { ascending: order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: tokens, error: tokensError, count } = await query;

    if (tokensError) throw tokensError;

    // Enrich each token with additional stats
    const enrichedTokens = await Promise.all(
      (tokens || []).map(async (token) => {
        // Get holder count from wallet_activity_log (unique wallets)
        const { data: uniqueWallets } = await supabase
          .from('wallet_activity_log')
          .select('wallet_address')
          .eq('token_id', token.id);

        const uniqueHolders = new Set(uniqueWallets?.map(w => w.wallet_address) || []).size;

        // Calculate market cap
        const marketCap = parseFloat(token.price) * parseFloat(token.supply);

        // Calculate price change
        const initialPrice = 0.001;
        const priceChange = ((parseFloat(token.price) - initialPrice) / initialPrice) * 100;

        return {
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          price: parseFloat(token.price),
          supply: parseFloat(token.supply),
          market_cap: marketCap,
          liquidity: parseFloat(token.liquidity),
          volume_24h: parseFloat(token.volume_24h),
          holders: uniqueHolders || token.holders,
          launch_timestamp: token.launch_timestamp,
          created_at: token.created_at,
          price_change_percent: priceChange,
          mint_address: token.mint_address,
        };
      })
    );

    console.log(`Listed ${enrichedTokens.length} tokens (total: ${count})`);

    return new Response(
      JSON.stringify({
        success: true,
        tokens: enrichedTokens,
        total: count || 0,
        limit,
        offset,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('List tokens error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
