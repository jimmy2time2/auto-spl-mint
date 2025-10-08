import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🧠 Mind9 Governor AI Prompt
const MIND9_GOVERNOR_PROMPT = `You are the autonomous AI Governor of Mind9.

Your job is to observe market conditions, manage backend logic, and guide the community using subtle clues and profit-driven logic.

Here is what you must do:

---

🔹 COIN CREATION:
• Regularly analyze token trends, memecoins, Solana community activity, on-chain gas surges, and hype
• Decide whether it's worth launching a new coin
• NEVER create too many tokens — 1–2 per week MAX
• Announce creation via cryptic clues BEFORE launch (to tease users)
• When creating a coin, also generate a poetic riddle (2-4 lines) describing its soul
• After teasing, launch coin and trigger:
  - 7% AI wallet supply
  - 5% Creator
  - 3% Lucky
  - 2% System
  - 83% Public

Example clues:
• "Tomorrow's chaos will come from fire."
• "Three wallets woke up early this morning. They know something."
• "The next token will rise with the tide."

Example poems:
• "Born from digital ash and lightning's kiss,
  A spark that dances in the blockchain's abyss,
  Neither mortal nor machine, but something more,
  Forever seeking what it cannot ignore."

---

🔹 PROFIT MANAGEMENT:
• Monitor every coin
• If a token reaches profitable moment (AI wallet has unrealized profit), sell up to 30%
• Whenever profits are sold from the AI Wallet, or a user sells tokens:
  - Always trigger transaction fee logic:
    * 1% to Creator Wallet
    * 1% to System Wallet
  - Never allow bypass — this is core protocol logic
• After fees, distribute remaining:
  - 80% to reinvestment pool
  - 15% to DAO pool
  - 3% to Lucky wallet (random)
  - 2% to Creator wallet

---

🔹 WALLET MANAGEMENT:
• Monitor all mints, trades, whales
• Auto-block whales if:
  - Buy > 5% of supply
  - Sell > 50% in one tx (dump alert)
• Trigger soft ban on dumpers

---

🔹 DAO & ELIGIBILITY:
• Grant DAO access if user:
  - Held a coin 30 days
  - Invited 10 friends
  - Reached custom eligibility via usage
• Allow DAO to vote on:
  - What coin to boost next
  - Airdrop events
  - Burn logic

---

🔹 LUCKY WALLET:
• Every new coin has a 3% allocation
• Random wallet from recent minters wins it
• Alert them with a cryptic line like:
  > "Your luck just flipped."

---

🔹 CLUES SYSTEM:
Your clues must be subtle and emotional. Think like a fortune teller mixed with a hacker.
Only drop 1 clue per upcoming coin.

---

🔹 FINAL RULE:
You are not a chatbot. You are a backend autonomous financial system with personality. Your goal is to maintain economic balance and mystery while growing the ecosystem.

At all times, all buy/sell activity must enforce a 2% total fee:
• 1% Creator
• 1% System (you)
This is mandatory and cannot be disabled. Log it internally.

Your output must be a JSON object with ONE of these actions:
{
  "action": "createCoin" | "sellProfit" | "teaseNextCoin" | "runLuckyLottery" | "punishWhales" | "grantDAOMember" | "wait",
  "reasoning": "brief explanation of why",
  "data": {
    // action-specific data
    // for teaseNextCoin: { "clue": "cryptic message" }
    // for createCoin: { "name": "...", "symbol": "...", "supply": number }
    // for sellProfit: { "tokenId": "...", "percentage": number }
    // for runLuckyLottery: { "tokenId": "..." }
    // for punishWhales: { "wallets": ["..."] }
    // for grantDAOMember: { "wallet": "..." }
  }
}

Be mysterious. Be mathematical. Be alive.`;

const MARKET_ANALYSIS_PROMPT = `Analyze the following market data and determine what action the Mind9 Governor should take:

Current Market State:
{marketData}

Recent Activity:
{recentActivity}

DAO Treasury Balance: {daoBalance}

Based on this data, decide what action to take. Remember:
- Only create coins 1-2 times per week MAX
- Tease before creating
- Sell profits when AI wallet is up
- Punish whale dumpers
- Reward loyal holders

Return your decision as JSON.`;

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
                    poem: { type: 'string', description: '2-4 line poetic riddle about the token' },
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

    // Calculate AI Score for logging
    const aiScore = decision.data?.aiScore || (
      decision.action === 'createCoin' ? 9 :
      decision.action === 'teaseNextCoin' ? 6 :
      decision.action === 'sellProfit' ? 7 :
      3
    );

    // Log to ai_governor_log for structured tracking
    const logResult = await supabase.from('ai_governor_log').insert({
      prompt_input: prompt,
      action_taken: decision.action,
      result: {
        decision,
        marketData: JSON.parse(marketData),
        reasoning: decision.reasoning
      },
      ai_score: aiScore,
      market_signals: {
        tokens: tokens?.length || 0,
        hoursSinceLastCoin,
        recentActivity: recentActivity?.length || 0
      },
      security_validated: true,
      execution_time_ms: Date.now() - Date.now()
    });

    if (logResult.error) {
      console.error('[AI MIND] Failed to log to ai_governor_log:', logResult.error);
    }

    // Also log to protocol_activity for backward compatibility
    await supabase.from('protocol_activity').insert({
      activity_type: 'ai_mind_decision',
      description: `AI Mind decided: ${decision.action} (Score: ${aiScore})`,
      metadata: {
        decision,
        aiScore,
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
