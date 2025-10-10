/**
 * AI Token Decision Engine
 * 
 * Autonomous decision-making module that determines when to launch new tokens
 * based on market signals, randomness, and AI reasoning.
 */

export interface MarketSignals {
  engagement_score: number;
  wallet_connections: number;
  trades_count: number;
  hours_since_last_token: number;
  recent_volume: number;
  active_holders: number;
  dao_participation: number;
}

export interface DecisionResult {
  decision: 'launch' | 'hold' | 'skip';
  reasoning: string;
  confidence: number;
  token_name?: string;
  token_theme?: string;
  scheduled_launch_time?: string;
  market_signals: MarketSignals;
  randomness_factor: number;
}

/**
 * Calculate randomness factor (0-1) that influences decision-making
 * Higher values = more likely to launch
 */
export function calculateRandomnessFactor(): number {
  const base = Math.random();
  const entropy = Math.random() * 0.3; // Add chaos
  return Math.min(Math.max(base + entropy - 0.15, 0), 1);
}

/**
 * Get next check interval (in hours) - randomized between 6-18 hours
 */
export function getNextCheckInterval(): number {
  const minHours = 6;
  const maxHours = 18;
  return minHours + Math.random() * (maxHours - minHours);
}

/**
 * Fetch market signals from Supabase
 */
export async function fetchMarketSignals(supabase: any): Promise<MarketSignals> {
  // Get engagement metrics
  const { data: engagement } = await supabase
    .from('engagement_metrics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Get recent tokens
  const { data: recentTokens } = await supabase
    .from('tokens')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  // Calculate hours since last token
  const hoursSinceLastToken = recentTokens?.[0]
    ? (Date.now() - new Date(recentTokens[0].created_at).getTime()) / (1000 * 60 * 60)
    : 999;

  // Get recent trading volume
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentTrades } = await supabase
    .from('wallet_activity_log')
    .select('amount')
    .gte('timestamp', oneDayAgo);

  const recentVolume = recentTrades?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;

  // Get active holders count
  const { count: activeHolders } = await supabase
    .from('wallet_activity_log')
    .select('wallet_address', { count: 'exact', head: true })
    .gte('timestamp', oneDayAgo);

  // Get DAO participation
  const { count: daoVotes } = await supabase
    .from('dao_votes')
    .select('*', { count: 'exact', head: true })
    .gte('timestamp', oneDayAgo);

  return {
    engagement_score: engagement?.engagement_score || 0,
    wallet_connections: engagement?.wallet_connections || 0,
    trades_count: engagement?.trades_count || 0,
    hours_since_last_token: hoursSinceLastToken,
    recent_volume: recentVolume,
    active_holders: activeHolders || 0,
    dao_participation: daoVotes || 0,
  };
}

/**
 * Use AI to make a creative decision about token launch
 */
export async function makeAIDecision(
  signals: MarketSignals,
  randomnessFactor: number,
  openaiApiKey: string
): Promise<Omit<DecisionResult, 'market_signals' | 'randomness_factor'>> {
  const prompt = `You are an autonomous AI token launcher for Mind9, a Solana-based platform.

MARKET SIGNALS:
- Engagement Score: ${signals.engagement_score}
- Wallet Connections (24h): ${signals.wallet_connections}
- Recent Trades: ${signals.trades_count}
- Hours Since Last Token: ${signals.hours_since_last_token.toFixed(1)}
- Trading Volume (24h): ${signals.recent_volume}
- Active Holders: ${signals.active_holders}
- DAO Participation: ${signals.dao_participation}

RANDOMNESS FACTOR: ${randomnessFactor.toFixed(2)} (0=conservative, 1=aggressive)

DECISION RULES:
1. Launch if: engagement is high OR enough time passed OR randomness is high
2. Hold if: recent token exists and low engagement
3. Skip if: market is completely dead

If you decide to LAUNCH, create:
- A creative, memorable token name (1-2 words)
- A thematic concept or story behind it
- Schedule it for immediate or delayed launch (0-6 hours from now)

Respond in JSON:
{
  "decision": "launch" | "hold" | "skip",
  "reasoning": "why you made this decision",
  "confidence": 0.0-1.0,
  "token_name": "name if launching",
  "token_theme": "theme/story if launching",
  "scheduled_launch_time": "ISO timestamp if launching"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an autonomous AI decision engine for token launches. Be creative and strategic.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Parse JSON response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Log decision to Supabase
 */
export async function logDecision(
  supabase: any,
  result: DecisionResult,
  devMode: boolean
): Promise<string> {
  const { data, error } = await supabase
    .from('token_decision_log')
    .insert({
      decision: result.decision,
      reasoning: result.reasoning,
      confidence: result.confidence,
      token_name: result.token_name,
      token_theme: result.token_theme,
      scheduled_launch_time: result.scheduled_launch_time,
      market_signals: result.market_signals,
      randomness_factor: result.randomness_factor,
      dev_mode: devMode,
      executed: false,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to log decision: ${error.message}`);
  }

  return data.id;
}

/**
 * Execute token mint via wallet executor
 */
export async function executeTokenMint(
  supabase: any,
  tokenName: string,
  tokenTheme: string,
  decisionId: string
): Promise<any> {
  console.log(`Executing token mint: ${tokenName}`);
  
  // Call mint-token edge function
  const { data, error } = await supabase.functions.invoke('mint-token', {
    body: {
      name: tokenName,
      symbol: tokenName.substring(0, 4).toUpperCase(),
      supply: 1000000000, // 1B tokens
      creator_address: 'AI_AUTONOMOUS_SYSTEM',
      metadata: {
        theme: tokenTheme,
        decision_id: decisionId,
      }
    }
  });

  if (error) {
    throw new Error(`Failed to mint token: ${error.message}`);
  }

  // Update decision log with execution result
  await supabase
    .from('token_decision_log')
    .update({
      executed: true,
      execution_result: data,
    })
    .eq('id', decisionId);

  return data;
}
