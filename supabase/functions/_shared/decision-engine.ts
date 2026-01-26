/**
 * AI Token Decision Engine
 * 
 * Autonomous decision-making module that determines when to launch new tokens
 * based on market signals, randomness, AI reasoning, and TRACTION SAFEGUARDS.
 * 
 * TRACTION RULES (to prevent wasting SOL):
 * - Minimum page views before first mint
 * - Minimum wallet connections required
 * - Existing tokens must show trading activity
 * - Engagement score thresholds
 */

export interface MarketSignals {
  engagement_score: number;
  wallet_connections: number;
  trades_count: number;
  hours_since_last_token: number;
  recent_volume: number;
  active_holders: number;
  dao_participation: number;
  page_views: number;
  total_tokens: number;
}

export interface TractionCheck {
  passed: boolean;
  reason: string;
  metrics: {
    page_views: number;
    wallet_connections: number;
    engagement_score: number;
    trades_count: number;
    total_tokens: number;
    recent_volume: number;
  };
}

/**
 * TRACTION THRESHOLDS - Configurable safeguards
 * These prevent the AI from minting when there's no real user activity
 */
export const TRACTION_THRESHOLDS = {
  // Minimum page views before ANY token can be minted
  MIN_PAGE_VIEWS_FIRST_TOKEN: 50,
  
  // Minimum page views before subsequent tokens
  MIN_PAGE_VIEWS: 100,
  
  // Minimum wallet connections required
  MIN_WALLET_CONNECTIONS: 5,
  
  // Minimum engagement score required
  MIN_ENGAGEMENT_SCORE: 10,
  
  // Minimum trades on existing tokens before new mint
  MIN_TRADES_FOR_NEW_TOKEN: 3,
  
  // Minimum trading volume (SOL) on existing tokens
  MIN_VOLUME_FOR_NEW_TOKEN: 0.1,
  
  // Maximum tokens without significant traction
  MAX_TOKENS_WITHOUT_TRACTION: 3,
};

export interface DecisionResult {
  decision: 'launch' | 'hold' | 'skip';
  reasoning: string;
  confidence: number;
  token_name?: string;
  token_theme?: string;
  scheduled_launch_time?: string;
  market_signals: MarketSignals;
  randomness_factor: number;
  traction_check?: TractionCheck;
}

/**
 * Check if there's enough traction to justify minting a new token
 * This is the PRIMARY safeguard against wasting SOL
 */
export function checkTractionRequirements(signals: MarketSignals): TractionCheck {
  const metrics = {
    page_views: signals.page_views || 0,
    wallet_connections: signals.wallet_connections,
    engagement_score: signals.engagement_score,
    trades_count: signals.trades_count,
    total_tokens: signals.total_tokens,
    recent_volume: signals.recent_volume,
  };
  
  const isFirstToken = signals.total_tokens === 0;
  
  // Check 1: Page views (basic traffic requirement)
  const minPageViews = isFirstToken 
    ? TRACTION_THRESHOLDS.MIN_PAGE_VIEWS_FIRST_TOKEN 
    : TRACTION_THRESHOLDS.MIN_PAGE_VIEWS;
  
  if (metrics.page_views < minPageViews) {
    return {
      passed: false,
      reason: `Insufficient page views: ${metrics.page_views} < ${minPageViews} required. Need more website traffic.`,
      metrics,
    };
  }
  
  // Check 2: Wallet connections (real user interest)
  if (metrics.wallet_connections < TRACTION_THRESHOLDS.MIN_WALLET_CONNECTIONS) {
    return {
      passed: false,
      reason: `Insufficient wallet connections: ${metrics.wallet_connections} < ${TRACTION_THRESHOLDS.MIN_WALLET_CONNECTIONS} required. Need more users connecting wallets.`,
      metrics,
    };
  }
  
  // Check 3: Engagement score
  if (metrics.engagement_score < TRACTION_THRESHOLDS.MIN_ENGAGEMENT_SCORE) {
    return {
      passed: false,
      reason: `Insufficient engagement: ${metrics.engagement_score} < ${TRACTION_THRESHOLDS.MIN_ENGAGEMENT_SCORE} required.`,
      metrics,
    };
  }
  
  // Check 4: If tokens exist, require trading activity
  if (!isFirstToken) {
    if (metrics.trades_count < TRACTION_THRESHOLDS.MIN_TRADES_FOR_NEW_TOKEN) {
      return {
        passed: false,
        reason: `Existing tokens have insufficient trades: ${metrics.trades_count} < ${TRACTION_THRESHOLDS.MIN_TRADES_FOR_NEW_TOKEN}. People need to trade existing coins first.`,
        metrics,
      };
    }
    
    if (metrics.recent_volume < TRACTION_THRESHOLDS.MIN_VOLUME_FOR_NEW_TOKEN) {
      return {
        passed: false,
        reason: `Existing tokens have insufficient volume: ${metrics.recent_volume} SOL < ${TRACTION_THRESHOLDS.MIN_VOLUME_FOR_NEW_TOKEN} SOL required.`,
        metrics,
      };
    }
  }
  
  // Check 5: Prevent spamming tokens without traction
  if (signals.total_tokens >= TRACTION_THRESHOLDS.MAX_TOKENS_WITHOUT_TRACTION && 
      metrics.recent_volume < 1) {
    return {
      passed: false,
      reason: `Already have ${signals.total_tokens} tokens with minimal traction. Need more trading activity before minting more.`,
      metrics,
    };
  }
  
  return {
    passed: true,
    reason: 'All traction requirements met ✅',
    metrics,
  };
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
 * Fetch market signals from Supabase including traction metrics
 */
export async function fetchMarketSignals(supabase: any): Promise<MarketSignals> {
  // Get engagement metrics
  const { data: engagement } = await supabase
    .from('engagement_metrics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Get token count
  const { count: totalTokens } = await supabase
    .from('tokens')
    .select('*', { count: 'exact', head: true });

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
    page_views: engagement?.page_views || 0,
    hours_since_last_token: hoursSinceLastToken,
    recent_volume: recentVolume,
    active_holders: activeHolders || 0,
    dao_participation: daoVotes || 0,
    total_tokens: totalTokens || 0,
  };
}

/**
 * Use AI to make a creative decision about token launch
 * Now uses the token theme generator for viral names
 * INCLUDES TRACTION CHECK - will skip if no traction
 */
export async function makeAIDecision(
  signals: MarketSignals,
  randomnessFactor: number,
  supabase: any
): Promise<Omit<DecisionResult, 'market_signals' | 'randomness_factor'> & { traction_check?: TractionCheck }> {
  
  // FIRST: Check traction requirements BEFORE asking AI
  const tractionCheck = checkTractionRequirements(signals);
  
  if (!tractionCheck.passed) {
    console.log(`⛔ TRACTION CHECK FAILED: ${tractionCheck.reason}`);
    console.log('📊 Metrics:', JSON.stringify(tractionCheck.metrics, null, 2));
    
    return {
      decision: 'skip',
      reasoning: `TRACTION SAFEGUARD: ${tractionCheck.reason}`,
      confidence: 1.0,
      traction_check: tractionCheck,
    };
  }
  
  console.log('✅ TRACTION CHECK PASSED:', tractionCheck.reason);
  
  const prompt = `You are an autonomous AI token launcher for Mind9, a Solana-based platform.

MARKET SIGNALS:
- Page Views: ${signals.page_views}
- Wallet Connections (24h): ${signals.wallet_connections}
- Engagement Score: ${signals.engagement_score}
- Recent Trades: ${signals.trades_count}
- Hours Since Last Token: ${signals.hours_since_last_token.toFixed(1)}
- Trading Volume (24h): ${signals.recent_volume}
- Active Holders: ${signals.active_holders}
- DAO Participation: ${signals.dao_participation}
- Total Tokens Launched: ${signals.total_tokens}

RANDOMNESS FACTOR: ${randomnessFactor.toFixed(2)} (0=conservative, 1=aggressive)

TRACTION STATUS: ✅ All requirements met (page views: ${signals.page_views}, wallets: ${signals.wallet_connections})

DECISION RULES:
1. Launch if: engagement is high AND good traction metrics
2. Hold if: recent token exists and want to give it time to gain traction
3. Skip if: market conditions unfavorable

Be conservative with SOL - only launch when you're confident there's real user interest.

Respond in JSON with your decision ONLY (no token details):
{
  "decision": "launch" | "hold" | "skip",
  "reasoning": "why you made this decision",
  "confidence": 0.0-1.0
}`;

  // Use Lovable AI for decision (faster and already configured)
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!lovableApiKey) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are an autonomous AI decision engine for token launches. Be strategic and market-aware.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error(`Lovable AI error: ${response.status}`);
  }

  const data = await response.json();
  let content = data.choices[0].message.content;
  
  // Remove markdown if present
  if (content.includes('```')) {
    content = content.replace(/```(?:json)?\n?/g, '').replace(/\n?```/g, '');
  }
  
  // Parse JSON response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response');
  }

  const decision = JSON.parse(jsonMatch[0]);
  
  // If decision is to launch, generate a viral token theme
  if (decision.decision === 'launch') {
    console.log('🎨 Generating viral token theme...');
    
    try {
      const { data: themeData, error: themeError } = await supabase.functions.invoke('generate-token-theme', {
        body: {
          style_preference: 'random',
          market_vibe: randomnessFactor > 0.7 ? 'chaotic' : randomnessFactor > 0.5 ? 'bullish' : 'neutral',
          include_trending: true,
        }
      });
      
      if (themeError) {
        console.error('Theme generation error:', themeError);
        // Fallback to simple naming
        decision.token_name = 'Mind9Token';
        decision.token_theme = 'Autonomous AI token';
      } else {
        const theme = themeData.theme;
        decision.token_name = theme.name;
        decision.token_theme = `${theme.description} ${theme.emoji || ''} | ${theme.backstory || ''}`;
        decision.token_symbol = theme.symbol;
        decision.token_tagline = theme.tagline;
        decision.token_color = theme.color;
        decision.token_emoji = theme.emoji;
        
        console.log(`✅ Theme: ${theme.name} ($${theme.symbol})`);
      }
    } catch (error) {
      console.error('Failed to generate theme:', error);
      // Fallback
      decision.token_name = 'VoidToken';
      decision.token_theme = 'A mysterious token from the AI';
    }
    
    // Set immediate launch time
    decision.scheduled_launch_time = new Date().toISOString();
  }

  return decision;
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
 * Execute token mint via governor brain approval + wallet executor
 */
export async function executeTokenMint(
  supabase: any,
  tokenName: string,
  tokenTheme: string,
  decisionId: string,
  additionalData?: {
    symbol?: string;
    tagline?: string;
    color?: string;
    emoji?: string;
  }
): Promise<any> {
  console.log(`🎯 Executing token mint: ${tokenName}`);
  
  // Generate M9 naming convention: "[7 digits] Created by M9"
  const randomDigits = Math.floor(1000000 + Math.random() * 9000000).toString();
  const m9Name = `${randomDigits} Created by M9`;
  const m9Symbol = randomDigits.substring(0, 5);
  
  // 1. Prepare mint action for governor review
  const mintAction = {
    action: 'token_mint',
    source: 'ai_token_decision',
    data: {
      name: m9Name,
      symbol: m9Symbol,
      supply: 1000000000,
      creator_address: 'AI_AUTONOMOUS_SYSTEM',
      description: tokenTheme,
      metadata: {
        original_name: tokenName,
        theme: tokenTheme,
        decision_id: decisionId,
        tagline: additionalData?.tagline,
        color: additionalData?.color,
        emoji: additionalData?.emoji,
      }
    }
  };

  // 2. Submit to governor brain for approval
  console.log('🧠 Submitting to Governor Brain for approval...');
  const { data: governorResponse, error: governorError } = await supabase.functions.invoke('ai-governor-brain', {
    body: mintAction
  });

  if (governorError) {
    console.error('❌ Governor review failed:', governorError);
    throw new Error(`Governor review failed: ${governorError.message}`);
  }

  // 3. Check governor decision
  if (!governorResponse.success || governorResponse.decision === 'rejected') {
    console.log('⛔ Governor rejected mint:', governorResponse.reasoning);
    
    // Log rejection
    await supabase.from('token_decision_log').update({
      executed: false,
      execution_result: {
        rejected: true,
        reason: governorResponse.reasoning,
        governor_decision: governorResponse.decision
      }
    }).eq('id', decisionId);
    
    throw new Error(`Governor rejected: ${governorResponse.reasoning}`);
  }

  if (governorResponse.decision === 'deferred') {
    console.log('⏸️ Governor deferred mint:', governorResponse.reasoning);
    
    await supabase.from('token_decision_log').update({
      executed: false,
      execution_result: {
        deferred: true,
        reason: governorResponse.reasoning
      }
    }).eq('id', decisionId);
    
    throw new Error(`Governor deferred: ${governorResponse.reasoning}`);
  }

  // 4. Use approved/modified payload
  const approvedPayload = governorResponse.execution_payload || mintAction.data;
  console.log(`✅ Governor approved mint (${governorResponse.decision})`);

  // 5. Execute via mint-token edge function (now with real on-chain minting)
  console.log('🚀 Calling mint-token for on-chain creation...');
  const { data, error } = await supabase.functions.invoke('mint-token', {
    body: {
      ...approvedPayload,
      on_chain: true, // Flag to use real Solana minting
    }
  });

  if (error) {
    throw new Error(`Failed to mint token: ${error.message}`);
  }

  console.log('📦 Mint result:', {
    success: data?.success,
    on_chain: data?.on_chain,
    mint_address: data?.mint_address,
    signature: data?.signature
  });

  // 6. Update decision log with execution result
  await supabase.from('token_decision_log').update({
    executed: true,
    execution_result: {
      ...data,
      governor_approval: {
        decision: governorResponse.decision,
        confidence: governorResponse.confidence,
        log_id: governorResponse.log_id
      }
    }
  }).eq('id', decisionId);

  return data;
}
