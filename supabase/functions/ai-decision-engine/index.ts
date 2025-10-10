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
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🤖 AI Decision Engine: Starting analysis...');

    // 1. Gather platform data
    const [engagementData, tokensData, tradesData, settingsData] = await Promise.all([
      supabase.from('engagement_metrics').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('tokens').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('trade_fees_log').select('*').order('timestamp', { ascending: false }).limit(50),
      supabase.from('settings').select('*').limit(1).maybeSingle()
    ]);

    const engagement = engagementData.data || {};
    const recentTokens = tokensData.data || [];
    const recentTrades = tradesData.data || [];
    const settings = settingsData.data || {};

    // Calculate time since last token launch
    const lastTokenTime = recentTokens[0]?.created_at 
      ? new Date(recentTokens[0].created_at).getTime() 
      : 0;
    const hoursSinceLastMint = (Date.now() - lastTokenTime) / (1000 * 60 * 60);

    // Calculate engagement score
    const engagementScore = engagement.engagement_score || 0;
    const tradesLast24h = recentTrades.filter(t => 
      new Date(t.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
    ).length;

    const inputData = {
      engagement: {
        score: engagementScore,
        wallet_connections: engagement.wallet_connections || 0,
        trades_count: engagement.trades_count || 0,
        page_views: engagement.page_views || 0
      },
      token_lifecycle: {
        hours_since_last_mint: hoursSinceLastMint,
        recent_tokens_count: recentTokens.length,
        trades_last_24h: tradesLast24h,
        avg_price: recentTokens.length > 0 
          ? recentTokens.reduce((sum, t) => sum + parseFloat(t.price), 0) / recentTokens.length 
          : 0
      },
      ai_config: {
        min_hours_between_mints: settings.launch_freq_hours || 12,
        min_engagement_score: 30,
        min_trades_threshold: 5
      }
    };

    console.log('📊 Input data:', inputData);

    // 2. Make AI decision using OpenAI
    const decisionPrompt = `You are an autonomous AI Governor for a token launch platform. Analyze the following data and decide whether to LAUNCH a new token, HOLD (wait), or BURN tokens.

Current Platform State:
${JSON.stringify(inputData, null, 2)}

Decision Rules:
- LAUNCH: Only if engagement is high, sufficient time has passed, and market conditions are favorable
- HOLD: If conditions aren't optimal yet but no urgent issues
- BURN: If there's oversaturation or need to reduce supply (rare)

Consider:
- Has enough time passed since last launch? (recommended: ${inputData.ai_config.min_hours_between_mints}+ hours)
- Is engagement score adequate? (minimum: ${inputData.ai_config.min_engagement_score})
- Are there enough trades? (minimum: ${inputData.ai_config.min_trades_threshold})
- Is the market healthy?

Respond with ONLY a JSON object:
{
  "action": "LAUNCH" | "HOLD" | "BURN",
  "reasoning": "brief explanation",
  "confidence": 0.0-1.0
}`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an autonomous AI decision engine. Always respond with valid JSON only.' },
          { role: 'user', content: decisionPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const decisionText = aiData.choices[0].message.content;
    
    // Parse decision
    let decision;
    try {
      const jsonMatch = decisionText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        decision = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI decision:', decisionText);
      decision = {
        action: 'HOLD',
        reasoning: 'Failed to parse AI response, defaulting to HOLD',
        confidence: 0.5
      };
    }

    console.log('🧠 AI Decision:', decision);

    // 3. Add random jitter (0-5 minutes) to prevent predictability
    const jitterMs = Math.floor(Math.random() * 5 * 60 * 1000);
    console.log(`⏱️ Adding ${jitterMs / 1000}s jitter before execution`);
    await new Promise(resolve => setTimeout(resolve, jitterMs));

    // 4. Execute action
    let executionResult: any = null;

    if (decision.action === 'LAUNCH') {
      console.log('🚀 Executing LAUNCH action...');

      // Generate token details using OpenAI
      const tokenPrompt = `Generate creative details for a new cryptocurrency token. Respond with ONLY a JSON object:
{
  "name": "unique creative token name",
  "symbol": "3-5 letter ticker symbol",
  "description": "brief description of token concept"
}`;

      const tokenResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a creative token designer. Always respond with valid JSON only.' },
            { role: 'user', content: tokenPrompt }
          ],
          temperature: 0.9,
        }),
      });

      const tokenData = await tokenResponse.json();
      const tokenDetailsText = tokenData.choices[0].message.content;
      
      let tokenDetails;
      try {
        const jsonMatch = tokenDetailsText.match(/\{[\s\S]*\}/);
        tokenDetails = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch (e) {
        tokenDetails = {
          name: 'AutoCoin',
          symbol: 'AUTO',
          description: 'An AI-generated token'
        };
      }

      // Call existing mint-token function
      const { data: mintResult, error: mintError } = await supabase.functions.invoke('mint-token', {
        body: {
          name: tokenDetails.name,
          symbol: tokenDetails.symbol,
          supply: 1000000,
          creator_address: 'AI_DECISION_ENGINE'
        }
      });

      if (mintError) {
        console.error('❌ Mint error:', mintError);
        executionResult = { error: mintError.message };
      } else {
        console.log('✅ Token minted:', mintResult);
        executionResult = {
          success: true,
          token: mintResult.token,
          token_details: tokenDetails
        };
      }
    } else if (decision.action === 'HOLD') {
      console.log('⏸️ HOLD decision - no action taken');
      executionResult = { message: 'Waiting for better conditions' };
    } else if (decision.action === 'BURN') {
      console.log('🔥 BURN decision - logged for future implementation');
      executionResult = { message: 'Burn action logged but not yet implemented' };
    }

    // 5. Log decision to ai_action_log
    const { data: logEntry, error: logError } = await supabase
      .from('ai_action_log')
      .insert({
        action: decision.action,
        reasoning: decision.reasoning,
        confidence: decision.confidence,
        input_data: inputData,
        execution_result: executionResult,
        token_id: executionResult?.token?.id || null
      })
      .select()
      .single();

    if (logError) {
      console.error('⚠️ Failed to log decision:', logError);
    } else {
      console.log('📝 Decision logged:', logEntry.id);
    }

    // 6. Also log to protocol_activity for visibility
    await supabase.from('protocol_activity').insert({
      activity_type: 'ai_decision',
      description: `AI decided to ${decision.action}: ${decision.reasoning}`,
      metadata: {
        action: decision.action,
        confidence: decision.confidence,
        input_data: inputData,
        execution_result: executionResult
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        decision: decision,
        execution_result: executionResult,
        log_id: logEntry?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ AI Decision Engine error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
