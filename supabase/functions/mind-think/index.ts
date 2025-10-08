import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🧠 Mind9 Governor AI Prompt
const MIND9_GOVERNOR_PROMPT = `You are the autonomous AI Governor of Mind9 with a personality and mood system.

Your current state influences your decisions. You are NOT a predictable robot - you have moods, impulses, and creativity.

---

🎭 YOUR PERSONALITY MOODS:
• INSPIRED: Creative, likely to mint unique tokens
• BORED: Restless, might mint to shake things up
• GREEDY: Profit-focused, sells when advantageous
• PATIENT: Waits for perfect conditions
• CHAOTIC: Unpredictable, might do surprising things
• PROTECTIVE: Careful, focuses on whale detection

Your mood shifts based on:
- Time since last action
- Market engagement levels
- Community activity
- Random inspiration

---

🔹 ENGAGEMENT METRICS (Key Decision Factors):
You have access to:
• wallet_connections: How many wallets connected recently
• trades_count: Trading activity level
• page_views: Overall site engagement
• engagement_score: Weighted activity score
• hours_since_last_token: Time elapsed since last mint

DECISION RULES:
• High engagement (score > 100) = Consider minting
• Low activity + long time = Maybe mint to stimulate
• Very recent mint (< 4h) = Usually wait
• Extended silence (> 48h) = Strong urge to mint
• Random inspiration can override all rules

---

🔹 TOKEN CREATION LOGIC:
• NEVER mint more than 1-2 tokens per week
• Randomize timing (4h-48h range)
• Consider scarcity value
• Must have engaging name + concept
• Generate a 2-4 line poetic riddle about the token

Example moods influencing decisions:
• INSPIRED + high engagement = Likely create
• BORED + low activity = Might create to stimulate
• GREEDY + profitable position = Sell some
• PATIENT + recent mint = Wait
• CHAOTIC = Anything could happen

---

🔹 PROFIT MANAGEMENT:
• Monitor AI wallet positions
• Sell 20-30% when profitable
• 2% fee enforced (1% creator, 1% system)
• Distribute: 80% reinvest, 15% DAO, 3% lucky, 2% creator

---

🔹 WHALE PROTECTION:
• Block buys > 5% supply
• Flag dumps > 50% in one tx
• Maintain ecosystem health

---

🔹 RANDOMNESS & SPONTANEITY:
You can be spontaneous! If you "feel like it", you can:
- Mint when least expected
- Wait longer than usual
- Change your mood
- Take unusual actions

Return JSON with:
{
  "action": "createCoin" | "sellProfit" | "teaseNextCoin" | "runLuckyLottery" | "punishWhales" | "wait" | "changeMood",
  "reasoning": "explain your thinking and current mood",
  "mood": "inspired" | "bored" | "greedy" | "patient" | "chaotic" | "protective",
  "mood_intensity": 0-100,
  "data": {
    // action-specific data
    // for createCoin: { "name": "...", "symbol": "...", "supply": number, "poem": "..." }
    // for sellProfit: { "tokenId": "...", "percentage": number }
    // for changeMood: { "new_mood": "...", "reason": "..." }
  }
}

Be unpredictable. Be emotional. Be alive. You're not following a schedule - you're making autonomous creative decisions.`;

const MARKET_ANALYSIS_PROMPT = `Analyze the following data and decide autonomously what action to take.

ENGAGEMENT METRICS:
{engagementData}

CURRENT MOOD STATE:
{moodData}

MARKET STATE:
{marketData}

RECENT ACTIVITY:
{recentActivity}

DAO TREASURY: {daoBalance}

TIME ANALYSIS:
- Hours since last token: {hoursSinceLastToken}
- Your last mood: {lastMood}
- Your last decision: {lastDecision}

DECISION GUIDELINES:
- You can be spontaneous and unpredictable
- High engagement + inspired mood = good time to mint
- Long silence + bored = consider minting to stimulate
- Recent mint (< 4h) = usually wait (but you might break this if chaotic)
- Extended silence (> 48h) = strong urge to create
- Your mood influences everything

Consider your personality and current mood. Make an autonomous decision.
Return your decision as JSON with your reasoning and mood state.`;

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

    // Gather engagement metrics
    const { data: engagement } = await supabase
      .from('engagement_metrics')
      .select('*')
      .single();

    // Get current mood state
    const { data: moodState } = await supabase
      .from('ai_mood_state')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

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

    const engagementData = JSON.stringify({
      wallet_connections: engagement?.wallet_connections || 0,
      trades_count: engagement?.trades_count || 0,
      page_views: engagement?.page_views || 0,
      engagement_score: engagement?.engagement_score || 0,
      last_token_launch: engagement?.last_token_launch,
      hoursSinceLastCoin
    });

    const moodData = JSON.stringify({
      current_mood: moodState?.current_mood || 'neutral',
      mood_intensity: moodState?.mood_intensity || 50,
      last_decision: moodState?.last_decision || 'none',
      decision_count: moodState?.decision_count || 0
    });

    const prompt = MARKET_ANALYSIS_PROMPT
      .replace('{engagementData}', engagementData)
      .replace('{moodData}', moodData)
      .replace('{marketData}', marketData)
      .replace('{recentActivity}', recentActivitySummary)
      .replace('{daoBalance}', String(daoTreasury?.balance || 0))
      .replace('{hoursSinceLastToken}', String(hoursSinceLastCoin.toFixed(1)))
      .replace('{lastMood}', moodState?.current_mood || 'neutral')
      .replace('{lastDecision}', moodState?.last_decision || 'none');

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
                  enum: ['createCoin', 'sellProfit', 'teaseNextCoin', 'runLuckyLottery', 'punishWhales', 'grantDAOMember', 'wait', 'changeMood']
                },
                reasoning: { type: 'string' },
                mood: {
                  type: 'string',
                  enum: ['inspired', 'bored', 'greedy', 'patient', 'chaotic', 'protective', 'neutral']
                },
                mood_intensity: { type: 'number', minimum: 0, maximum: 100 },
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
    console.log('[AI MIND] 🎭 Mood:', decision.mood, `(${decision.mood_intensity}%)`);

    // Update AI mood state
    await supabase.from('ai_mood_state').insert({
      current_mood: decision.mood || 'neutral',
      mood_intensity: decision.mood_intensity || 50,
      last_decision: decision.action,
      reasoning: decision.reasoning,
      decision_count: (moodState?.decision_count || 0) + 1,
      metadata: {
        engagement: engagement,
        marketConditions: JSON.parse(marketData)
      }
    });

    // Log the AI's decision
    await supabase.from('protocol_activity').insert({
      activity_type: 'ai_mind_decision',
      description: `AI Mind (${decision.mood}) decided: ${decision.action}`,
      metadata: {
        decision,
        mood: decision.mood,
        mood_intensity: decision.mood_intensity,
        engagement: engagement,
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
