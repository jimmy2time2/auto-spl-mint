import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  generateTokenTheme,
  generateThemeOptions,
  getTrendingKeywords,
  determineMarketVibe,
  type TokenThemeInput,
} from "../_shared/token-theme-generator.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const {
      seed_phrase,
      style_preference,
      market_vibe,
      generate_options = false,
      option_count = 3,
      include_trending = true,
    } = await req.json().catch(() => ({}));

    console.log('🎨 Token Theme Generator started...');
    if (seed_phrase) console.log(`Seed: "${seed_phrase}"`);
    if (style_preference) console.log(`Style: ${style_preference}`);

    // Get past token names to avoid repetition
    const { data: pastTokens } = await supabase
      .from('tokens')
      .select('name')
      .order('created_at', { ascending: false })
      .limit(20);

    const past_token_names = pastTokens?.map((t: any) => t.name) || [];

    // Get trending keywords if requested
    let trending_keywords: string[] = [];
    if (include_trending) {
      trending_keywords = await getTrendingKeywords(supabase);
      console.log(`📈 Trending: ${trending_keywords.slice(0, 5).join(', ')}`);
    }

    // Determine market vibe if not provided
    const vibe = market_vibe || await determineMarketVibe(supabase);
    console.log(`🌊 Market vibe: ${vibe}`);

    // Build input
    const input: TokenThemeInput = {
      seed_phrase,
      past_token_names,
      trending_keywords,
      market_vibe: vibe,
      style_preference: style_preference || 'random',
    };

    let result;

    if (generate_options) {
      // Generate multiple options
      console.log(`🎲 Generating ${option_count} theme options...`);
      const themes = await generateThemeOptions(input, lovableApiKey, option_count);
      
      result = {
        success: true,
        themes,
        count: themes.length,
        market_vibe: vibe,
        trending_keywords,
      };
    } else {
      // Generate single theme
      console.log('🎯 Generating single theme...');
      const theme = await generateTokenTheme(input, lovableApiKey);
      
      result = {
        success: true,
        theme,
        market_vibe: vibe,
        trending_keywords,
      };
    }

    // Log to protocol activity
    await supabase.from('protocol_activity').insert({
      activity_type: 'token_theme_generated',
      description: generate_options 
        ? `Generated ${option_count} token theme options`
        : `Generated token theme: ${result.theme?.name}`,
      metadata: {
        seed_phrase,
        style_preference,
        market_vibe: vibe,
        result: generate_options ? { count: result.themes?.length } : result.theme,
      },
    });

    console.log('✅ Theme generation complete');

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-token-theme:', error);
    
    // Check for specific error types
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isRateLimit = errorMessage.includes('Rate limit') || errorMessage.includes('429');
    const isPayment = errorMessage.includes('credits') || errorMessage.includes('402');
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        type: isRateLimit ? 'rate_limit' : isPayment ? 'payment_required' : 'error',
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: isRateLimit ? 429 : isPayment ? 402 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
