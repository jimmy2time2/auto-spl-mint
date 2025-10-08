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

    const { token_id } = await req.json();

    if (!token_id) {
      throw new Error('token_id is required');
    }

    console.log('Fetching stats for token:', token_id);

    // Get token basic info
    const { data: token, error: tokenError } = await supabase
      .from('tokens')
      .select('*')
      .eq('id', token_id)
      .single();

    if (tokenError) throw tokenError;
    if (!token) throw new Error('Token not found');

    // Get distribution info
    const { data: distribution, error: distError } = await supabase
      .from('coin_distributions')
      .select('*')
      .eq('token_id', token_id)
      .single();

    if (distError) console.warn('Distribution not found:', distError);

    // Calculate market cap
    const marketCap = parseFloat(token.price) * parseFloat(token.supply);

    // Calculate price change since launch
    const initialPrice = 0.001; // From mint logic
    const priceChange = ((parseFloat(token.price) - initialPrice) / initialPrice) * 100;

    // Get recent trade count
    const { count: tradeCount } = await supabase
      .from('wallet_activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('token_id', token_id);

    // Get creator profit total
    const { data: creatorProfits } = await supabase
      .from('creator_wallet_profits')
      .select('amount')
      .eq('token_id', token_id);

    const totalCreatorProfit = creatorProfits?.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;

    // Build comprehensive stats response
    const stats = {
      token_id: token.id,
      name: token.name,
      symbol: token.symbol,
      price: parseFloat(token.price),
      supply: parseFloat(token.supply),
      market_cap: marketCap,
      liquidity: parseFloat(token.liquidity),
      volume_24h: parseFloat(token.volume_24h),
      holders: token.holders,
      launch_timestamp: token.launch_timestamp,
      created_at: token.created_at,
      mint_address: token.mint_address,
      pool_address: token.pool_address,
      price_change_percent: priceChange,
      total_trades: tradeCount || 0,
      distribution: distribution ? {
        ai_wallet: parseFloat(distribution.ai_wallet_amount.toString()),
        creator_wallet: parseFloat(distribution.creator_wallet_amount.toString()),
        lucky_wallet: parseFloat(distribution.lucky_wallet_amount.toString()),
        system_wallet: parseFloat(distribution.system_wallet_amount.toString()),
        public_sale: parseFloat(distribution.public_sale_amount.toString()),
      } : null,
      creator_profit_total: totalCreatorProfit,
    };

    console.log('Token stats compiled successfully');

    return new Response(
      JSON.stringify({ success: true, stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Get token stats error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
