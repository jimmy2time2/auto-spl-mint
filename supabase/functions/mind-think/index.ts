import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { MIND9_GOVERNOR_PROMPT, MARKET_ANALYSIS_PROMPT } from "../ai-governor/prompt.ts";

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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('[AI MIND] 🧠 Starting autonomous thinking session...');

    // Gather current market data
    const { data: tokens } = await supabase
      .from('tokens')
      .select('id, name, symbol, supply, volume_24h, liquidity, price, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: recentActivity } = await supabase
      .from('protocol_activity')
      .select('activity_type, description, metadata, timestamp')
      .order('timestamp', { ascending: false })
      .limit(20);

    const { data: daoTreasury } = await supabase
      .from('dao_treasury')
      .select('balance')
      .single();

    const { data: lastThought } = await supabase
      .from('protocol_activity')
      .select('metadata, timestamp')
      .eq('activity_type', 'ai_mind_decision')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    // Check when last coin was created
    const lastCoinTime = tokens?.[0]?.created_at;
    const hoursSinceLastCoin = lastCoinTime 
      ? (Date.now() - new Date(lastCoinTime).getTime()) / (1000 * 60 * 60)
      : 999;

    // Build context for AI
    const marketData = JSON.stringify({
      totalTokens: tokens?.length || 0,
      tokens: tokens?.map(t => ({
        name: t.name,
        symbol: t.symbol,
        volume24h: t.volume_24h,
        liquidity: t.liquidity,
        price: t.price,
        ageHours: (Date.now() - new Date(t.created_at).getTime()) / (1000 * 60 * 60)
      })),
      hoursSinceLastCoin,
      daoBalance: daoTreasury?.balance || 0
    });

    const recentActivitySummary = JSON.stringify(
      recentActivity?.slice(0, 10).map(a => ({
        type: a.activity_type,
        description: a.description,
        time: new Date(a.timestamp).toISOString()
      }))
    );

    const prompt = MARKET_ANALYSIS_PROMPT
      .replace('{marketData}', marketData)
      .replace('{recentActivity}', recentActivitySummary)
      .replace('{daoBalance}', String(daoTreasury?.balance || 0));

    console.log('[AI MIND] Consulting AI Governor...');

    // Call Lovable AI with structured output
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: MIND9_GOVERNOR_PROMPT },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'make_decision',
            description: 'Make an autonomous decision about the Mind9 ecosystem',
            parameters: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['createCoin', 'sellProfit', 'teaseNextCoin', 'runLuckyLottery', 'punishWhales', 'grantDAOMember', 'wait']
                },
                reasoning: { type: 'string' },
                data: {
                  type: 'object',
                  properties: {
                    clue: { type: 'string' },
                    name: { type: 'string' },
                    symbol: { type: 'string' },
                    supply: { type: 'number' },
                    tokenId: { type: 'string' },
                    percentage: { type: 'number' },
                    wallets: { type: 'array', items: { type: 'string' } },
                    wallet: { type: 'string' }
                  }
                }
              },
              required: ['action', 'reasoning']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'make_decision' } }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[AI MIND ERROR] AI API failed:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No decision made by AI');
    }

    const decision = JSON.parse(toolCall.function.arguments);
    
    console.log('[AI MIND] 💡 Decision:', decision.action);
    console.log('[AI MIND] 🧐 Reasoning:', decision.reasoning);

    // Log the AI's decision
    await supabase.from('protocol_activity').insert({
      activity_type: 'ai_mind_decision',
      description: `AI Mind decided: ${decision.action}`,
      metadata: {
        decision,
        marketData: JSON.parse(marketData),
        timestamp: new Date().toISOString()
      }
    });

    // Execute the decision by calling the appropriate ai-governor action
    let executionResult;
    
    if (decision.action !== 'wait') {
      const governorResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-governor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            action: mapDecisionToAction(decision.action),
            data: decision.data,
            prompt: decision.reasoning
          })
        }
      );

      if (governorResponse.ok) {
        executionResult = await governorResponse.json();
        console.log('[AI MIND] ✅ Execution result:', executionResult);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        decision,
        execution: executionResult || { message: 'Waiting...' },
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AI MIND ERROR]:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function mapDecisionToAction(decision: string): string {
  const mapping: Record<string, string> = {
    'createCoin': 'decide_creation',
    'sellProfit': 'ai_profit',
    'teaseNextCoin': 'process_command',
    'runLuckyLottery': 'lucky_lottery',
    'punishWhales': 'detect_whale',
    'grantDAOMember': 'update_dao'
  };
  
  return mapping[decision] || 'evaluate_market';
}
