/**
 * AI Heartbeat Scheduler
 * 
 * Mimics a living AI agent by triggering decision-making at random intervals
 * influenced by market activity, time of day, and entropy.
 */

export interface HeartbeatSettings {
  min_interval_hours: number;
  max_interval_hours: number;
  entropy_weight: number;
  volume_threshold: number;
  active: boolean;
}

export interface HeartbeatResult {
  timestamp: string;
  next_heartbeat_at: string;
  interval_hours: number;
  entropy_factor: number;
  market_activity_score: number;
  time_of_day_factor: number;
  decision_triggered: boolean;
  decision_result?: string;
}

/**
 * Calculate time-of-day factor (0-1)
 * Higher during peak trading hours (9am-5pm UTC)
 */
export function calculateTimeOfDayFactor(): number {
  const now = new Date();
  const hour = now.getUTCHours();
  
  // Peak hours: 9am-5pm UTC (0.8-1.0)
  // Off hours: 12am-6am UTC (0.3-0.5)
  // Other times: moderate (0.5-0.8)
  
  if (hour >= 9 && hour <= 17) {
    return 0.8 + Math.random() * 0.2; // 0.8-1.0
  } else if (hour >= 0 && hour <= 6) {
    return 0.3 + Math.random() * 0.2; // 0.3-0.5
  } else {
    return 0.5 + Math.random() * 0.3; // 0.5-0.8
  }
}

/**
 * Calculate market activity score based on recent trading volume
 */
export async function calculateMarketActivityScore(supabase: any): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  // Get recent trading volume
  const { data: recentTrades } = await supabase
    .from('wallet_activity_log')
    .select('amount')
    .gte('timestamp', oneDayAgo)
    .in('activity_type', ['buy', 'sell', 'trade']);
  
  const totalVolume = recentTrades?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
  
  // Get recent wallet connections
  const { data: engagement } = await supabase
    .from('engagement_metrics')
    .select('wallet_connections, trades_count')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  // Normalize score 0-1
  const volumeScore = Math.min(totalVolume / 1000, 1); // Cap at 1000 volume
  const engagementScore = Math.min((engagement?.wallet_connections || 0) / 50, 1); // Cap at 50 connections
  const tradeScore = Math.min((engagement?.trades_count || 0) / 100, 1); // Cap at 100 trades
  
  // Weighted average
  return (volumeScore * 0.5 + engagementScore * 0.3 + tradeScore * 0.2);
}

/**
 * Calculate entropy factor - pure randomness with slight bias
 */
export function calculateEntropyFactor(): number {
  // Base random + small chaos factor
  const base = Math.random();
  const chaos = (Math.random() - 0.5) * 0.2; // ±0.1
  
  return Math.min(Math.max(base + chaos, 0), 1);
}

/**
 * Calculate next heartbeat interval based on entropy and market factors
 */
export function calculateNextInterval(
  settings: HeartbeatSettings,
  marketActivityScore: number,
  timeOfDayFactor: number,
  entropyFactor: number
): number {
  const { min_interval_hours, max_interval_hours, entropy_weight } = settings;
  
  // Base interval (weighted random between min and max)
  const baseInterval = min_interval_hours + 
    Math.random() * (max_interval_hours - min_interval_hours);
  
  // Market activity influence: high activity = shorter intervals
  const marketInfluence = 1 - (marketActivityScore * 0.3); // Reduce interval by up to 30%
  
  // Time of day influence: peak hours = shorter intervals
  const timeInfluence = 1 - (timeOfDayFactor * 0.2); // Reduce interval by up to 20%
  
  // Entropy influence: random chaos factor
  const entropyInfluence = 1 + (entropyFactor - 0.5) * entropy_weight; // ±15% variation
  
  // Combine all factors
  const finalInterval = baseInterval * marketInfluence * timeInfluence * entropyInfluence;
  
  // Clamp to min/max bounds
  return Math.max(min_interval_hours, Math.min(max_interval_hours, finalInterval));
}

/**
 * Check if it's time for a heartbeat
 */
export async function shouldTriggerHeartbeat(supabase: any): Promise<boolean> {
  // Get latest heartbeat
  const { data: lastHeartbeat } = await supabase
    .from('heartbeat_log')
    .select('next_heartbeat_at')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();
  
  if (!lastHeartbeat) {
    return true; // First heartbeat
  }
  
  // Check if we've passed the scheduled time
  const nextTime = new Date(lastHeartbeat.next_heartbeat_at);
  return Date.now() >= nextTime.getTime();
}

/**
 * Get heartbeat settings
 */
export async function getHeartbeatSettings(supabase: any): Promise<HeartbeatSettings> {
  const { data: settings } = await supabase
    .from('heartbeat_settings')
    .select('*')
    .eq('active', true)
    .limit(1)
    .single();
  
  if (!settings) {
    // Return defaults if no settings found
    return {
      min_interval_hours: 3,
      max_interval_hours: 12,
      entropy_weight: 0.3,
      volume_threshold: 100,
      active: true,
    };
  }
  
  return settings;
}

/**
 * Execute heartbeat - trigger AI decision and log
 */
export async function executeHeartbeat(supabase: any): Promise<HeartbeatResult> {
  console.log('💓 AI Heartbeat initiated...');
  
  // Get settings
  const settings = await getHeartbeatSettings(supabase);
  
  if (!settings.active) {
    throw new Error('Heartbeat system is disabled');
  }
  
  // Calculate factors
  const marketActivityScore = await calculateMarketActivityScore(supabase);
  const timeOfDayFactor = calculateTimeOfDayFactor();
  const entropyFactor = calculateEntropyFactor();
  
  console.log(`📊 Market Activity: ${(marketActivityScore * 100).toFixed(1)}%`);
  console.log(`🕐 Time Factor: ${(timeOfDayFactor * 100).toFixed(1)}%`);
  console.log(`🎲 Entropy: ${(entropyFactor * 100).toFixed(1)}%`);
  
  // Calculate next interval
  const intervalHours = calculateNextInterval(
    settings,
    marketActivityScore,
    timeOfDayFactor,
    entropyFactor
  );
  
  const nextHeartbeatAt = new Date(Date.now() + intervalHours * 60 * 60 * 1000);
  
  console.log(`⏰ Next heartbeat in ${intervalHours.toFixed(2)} hours (at ${nextHeartbeatAt.toISOString()})`);
  
  // Trigger AI decision engine
  let decisionResult = 'not_triggered';
  let decisionTriggered = false;
  
  try {
    console.log('🧠 Triggering AI Decision Engine...');
    
    const { data: aiDecision, error } = await supabase.functions.invoke('ai-token-decision', {
      body: { dev_mode: false, force_execute: false }
    });
    
    if (error) {
      console.error('AI Decision Engine error:', error);
      decisionResult = `error: ${error.message}`;
    } else {
      decisionTriggered = true;
      decisionResult = aiDecision?.decision || 'unknown';
      console.log(`✅ AI decided: ${decisionResult}`);
    }
  } catch (error) {
    console.error('Failed to trigger AI Decision Engine:', error);
    decisionResult = `exception: ${error instanceof Error ? error.message : String(error)}`;
  }
  
  // Log heartbeat
  const { data: heartbeat, error: logError } = await supabase
    .from('heartbeat_log')
    .insert({
      next_heartbeat_at: nextHeartbeatAt.toISOString(),
      interval_hours: intervalHours,
      entropy_factor: entropyFactor,
      decision_triggered: decisionTriggered,
      decision_result: decisionResult,
      market_activity_score: marketActivityScore,
      time_of_day_factor: timeOfDayFactor,
      metadata: {
        settings,
        factors: {
          market: marketActivityScore,
          time: timeOfDayFactor,
          entropy: entropyFactor,
        }
      }
    })
    .select()
    .single();
  
  if (logError) {
    console.error('Failed to log heartbeat:', logError);
  }
  
  // Log to protocol activity
  await supabase.from('protocol_activity').insert({
    activity_type: 'ai_heartbeat',
    description: `AI heartbeat: ${decisionResult} | Next in ${intervalHours.toFixed(1)}h`,
    metadata: {
      decision_result: decisionResult,
      next_heartbeat_hours: intervalHours,
      market_score: marketActivityScore,
      time_factor: timeOfDayFactor,
      entropy: entropyFactor,
    }
  });
  
  return {
    timestamp: new Date().toISOString(),
    next_heartbeat_at: nextHeartbeatAt.toISOString(),
    interval_hours: intervalHours,
    entropy_factor: entropyFactor,
    market_activity_score: marketActivityScore,
    time_of_day_factor: timeOfDayFactor,
    decision_triggered: decisionTriggered,
    decision_result: decisionResult,
  };
}
