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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🤖 Autonomous mint check initiated...');

    // 1. Collect system data
    const [tokensData, walletData, tradesData, engagementData, marketData] = await Promise.all([
      supabase.from('tokens').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('wallets').select('*'),
      supabase.from('trade_fees_log').select('*').order('timestamp', { ascending: false }).limit(20),
      supabase.from('engagement_metrics').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('market_sentiment').select('*').order('timestamp', { ascending: false }).limit(1).maybeSingle()
    ]);

    const systemStats = {
      recent_tokens: tokensData.data || [],
      wallet_balances: walletData.data || [],
      recent_trades: tradesData.data || [],
      engagement: engagementData.data || {},
      market_sentiment: marketData.data || {}
    };

    // 2. Ask AI if we should mint
    const decisionPrompt = `You are an autonomous token minting AI. Analyze the following system data and decide if a new token should be minted RIGHT NOW.

System Data:
- Recent Tokens (last 10): ${JSON.stringify(systemStats.recent_tokens, null, 2)}
- Wallet Balances: ${JSON.stringify(systemStats.wallet_balances, null, 2)}
- Recent Trades (last 20): ${JSON.stringify(systemStats.recent_trades, null, 2)}
- Engagement Metrics: ${JSON.stringify(systemStats.engagement, null, 2)}
- Market Sentiment: ${JSON.stringify(systemStats.market_sentiment, null, 2)}

Consider:
1. Is there enough trading activity?
2. Are wallet balances healthy?
3. When was the last token minted?
4. Is engagement high enough?
5. Is market sentiment positive?

Respond with ONLY a JSON object in this exact format:
{
  "should_mint": true or false,
  "reasoning": "brief explanation of decision",
  "token_name": "suggested name if minting" or null,
  "token_symbol": "suggested symbol if minting" or null,
  "token_description": "brief description if minting" or null
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an autonomous token minting AI. Always respond with valid JSON only.' },
          { role: 'user', content: decisionPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiDecisionText = aiData.choices[0].message.content;
    
    // Parse AI decision
    let aiDecision;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiDecisionText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiDecision = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiDecisionText);
      aiDecision = {
        should_mint: false,
        reasoning: 'Failed to parse AI response',
        token_name: null,
        token_symbol: null,
        token_description: null
      };
    }

    console.log('AI Decision:', aiDecision);

    // 3. Execute decision
    if (aiDecision.should_mint && aiDecision.token_name && aiDecision.token_symbol) {
      console.log('✅ AI decided to MINT a new token!');
      
      // Call mint-token function
      const { data: mintData, error: mintError } = await supabase.functions.invoke('mint-token', {
        body: {
          name: aiDecision.token_name,
          symbol: aiDecision.token_symbol,
          supply: 1000000,
          creator_address: 'AI_AUTONOMOUS_SYSTEM'
        }
      });

      if (mintError) {
        throw new Error(`Mint error: ${mintError.message}`);
      }

      // Log success to protocol_activity
      await supabase.from('protocol_activity').insert({
        activity_type: 'autonomous_mint_decision',
        description: `AI autonomously decided to MINT token: ${aiDecision.token_name}`,
        metadata: {
          decision: aiDecision,
          result: mintData,
          system_stats: systemStats
        }
      });

      return new Response(
        JSON.stringify({ 
          success: true,
          action: 'minted',
          decision: aiDecision,
          mint_result: mintData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      console.log('⏸️ AI decided NOT to mint');
      
      // Log decision to protocol_activity
      await supabase.from('protocol_activity').insert({
        activity_type: 'autonomous_mint_decision',
        description: `AI decided NOT to mint. Reason: ${aiDecision.reasoning}`,
        metadata: {
          decision: aiDecision,
          system_stats: systemStats
        }
      });

      return new Response(
        JSON.stringify({ 
          success: true,
          action: 'no_mint',
          decision: aiDecision
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Autonomous mint check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
