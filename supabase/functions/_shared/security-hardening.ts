/**
 * SECURITY HARDENING MODULE
 * Rate limiting, whale detection, transaction validation
 */

export const SECURITY_CONFIG = {
  rate_limits: {
    trades_per_minute: 5,
    trades_per_hour: 50,
    trades_per_day: 200,
  },
  trade_limits: {
    min_trade_sol: 0.001,
    max_trade_sol: 100,
    max_percentage_of_supply: 10,
  },
  whale_detection: {
    single_trade_threshold: 5, // % of supply in single trade
    cumulative_threshold: 15, // % cumulative holdings
    whale_status_threshold: 20, // % to be flagged as whale
  },
  blocked_countries: ['US', 'CN', 'KP', 'IR', 'SY', 'CU'],
};

export interface RateLimitResult {
  limited: boolean;
  retry_after?: number;
  remaining?: number;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export interface WhaleCheckResult {
  isWhale: boolean;
  holdingsPercent: number;
  flaggedReason?: string;
}

/**
 * Check if a wallet is rate limited for a specific action
 */
export async function checkRateLimit(
  supabase: any,
  wallet: string,
  action: string
): Promise<RateLimitResult> {
  const now = Date.now();
  const oneMinuteAgo = new Date(now - 60 * 1000).toISOString();
  const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  
  try {
    // Check minute limit
    const { data: minuteData } = await supabase
      .from('rate_limit_log')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('action_type', action)
      .gte('timestamp', oneMinuteAgo);
    
    if ((minuteData?.length || 0) >= SECURITY_CONFIG.rate_limits.trades_per_minute) {
      return { 
        limited: true, 
        retry_after: 60,
        remaining: 0 
      };
    }
    
    // Check hour limit
    const { data: hourData } = await supabase
      .from('rate_limit_log')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('action_type', action)
      .gte('timestamp', oneHourAgo);
    
    if ((hourData?.length || 0) >= SECURITY_CONFIG.rate_limits.trades_per_hour) {
      return { 
        limited: true, 
        retry_after: 3600,
        remaining: 0 
      };
    }
    
    // Check day limit
    const { data: dayData } = await supabase
      .from('rate_limit_log')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('action_type', action)
      .gte('timestamp', oneDayAgo);
    
    if ((dayData?.length || 0) >= SECURITY_CONFIG.rate_limits.trades_per_day) {
      return { 
        limited: true, 
        retry_after: 86400,
        remaining: 0 
      };
    }
    
    return { 
      limited: false,
      remaining: SECURITY_CONFIG.rate_limits.trades_per_minute - (minuteData?.length || 0)
    };
    
  } catch (e) {
    console.error('Rate limit check error:', e);
    return { limited: false }; // Fail open but log
  }
}

/**
 * Log a rate-limited action
 */
export async function logRateLimitAction(
  supabase: any,
  wallet: string,
  action: string
): Promise<void> {
  await supabase.from('rate_limit_log').insert({
    wallet_address: wallet,
    action_type: action,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Validate a transaction before execution
 */
export async function validateTransaction(
  supabase: any,
  wallet: string,
  tokenId: string,
  amount: number,
  tokenSupply: number,
  tradeType: 'buy' | 'sell'
): Promise<ValidationResult> {
  // Check minimum trade amount
  if (amount < SECURITY_CONFIG.trade_limits.min_trade_sol) {
    return { 
      valid: false, 
      reason: `Below minimum trade of ${SECURITY_CONFIG.trade_limits.min_trade_sol} SOL` 
    };
  }
  
  // Check maximum trade amount
  if (amount > SECURITY_CONFIG.trade_limits.max_trade_sol) {
    return { 
      valid: false, 
      reason: `Exceeds maximum trade of ${SECURITY_CONFIG.trade_limits.max_trade_sol} SOL` 
    };
  }
  
  // Check percentage of supply (anti-whale)
  const percentOfSupply = (amount / tokenSupply) * 100;
  if (percentOfSupply > SECURITY_CONFIG.trade_limits.max_percentage_of_supply) {
    return { 
      valid: false, 
      reason: `Exceeds max ${SECURITY_CONFIG.trade_limits.max_percentage_of_supply}% of supply per trade` 
    };
  }
  
  // Check rate limit
  const rateLimit = await checkRateLimit(supabase, wallet, 'trade');
  if (rateLimit.limited) {
    return { 
      valid: false, 
      reason: `Rate limited. Try again in ${rateLimit.retry_after} seconds` 
    };
  }
  
  // Check whale status for buys
  if (tradeType === 'buy') {
    const whaleCheck = await checkWhaleStatus(supabase, wallet, tokenId);
    if (whaleCheck.isWhale) {
      return { 
        valid: false, 
        reason: `Whale restriction: ${whaleCheck.flaggedReason}` 
      };
    }
  }
  
  return { valid: true };
}

/**
 * Check if a wallet is flagged as a whale
 */
export async function checkWhaleStatus(
  supabase: any,
  wallet: string,
  tokenId?: string
): Promise<WhaleCheckResult> {
  try {
    // Get wallet activity
    let query = supabase
      .from('wallet_activity_log')
      .select('*')
      .eq('wallet_address', wallet);
    
    if (tokenId) {
      query = query.eq('token_id', tokenId);
    }
    
    const { data } = await query;
    
    if (!data || data.length === 0) {
      return { isWhale: false, holdingsPercent: 0 };
    }
    
    const buys = data.filter((a: any) => a.activity_type === 'buy');
    const sells = data.filter((a: any) => a.activity_type === 'sell');
    
    const totalBoughtPercent = buys.reduce((sum: number, a: any) => 
      sum + (a.percentage_of_supply || 0), 0);
    const totalSoldPercent = sells.reduce((sum: number, a: any) => 
      sum + (a.percentage_of_supply || 0), 0);
    const holdingsPercent = totalBoughtPercent - totalSoldPercent;
    
    // Check single trade threshold
    const maxSingleTrade = Math.max(...buys.map((a: any) => a.percentage_of_supply || 0), 0);
    if (maxSingleTrade > SECURITY_CONFIG.whale_detection.single_trade_threshold) {
      return {
        isWhale: true,
        holdingsPercent,
        flaggedReason: `Single trade exceeded ${SECURITY_CONFIG.whale_detection.single_trade_threshold}% of supply`,
      };
    }
    
    // Check whale status threshold
    if (holdingsPercent > SECURITY_CONFIG.whale_detection.whale_status_threshold) {
      return {
        isWhale: true,
        holdingsPercent,
        flaggedReason: `Holdings exceed ${SECURITY_CONFIG.whale_detection.whale_status_threshold}% of supply`,
      };
    }
    
    return { isWhale: false, holdingsPercent };
    
  } catch (e) {
    console.error('Whale check error:', e);
    return { isWhale: false, holdingsPercent: 0 };
  }
}

/**
 * Log a security event
 */
export async function logSecurityEvent(
  supabase: any,
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  walletAddress?: string,
  details?: Record<string, any>
): Promise<void> {
  await supabase.from('security_events').insert({
    event_type: eventType,
    severity,
    wallet_address: walletAddress,
    details,
    resolved: false,
  });
}

/**
 * Detect potential pump-and-dump activity
 */
export async function detectPumpDump(
  supabase: any,
  wallet: string,
  tokenId: string
): Promise<{ detected: boolean; count: number }> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data } = await supabase
    .from('wallet_activity_log')
    .select('*')
    .eq('wallet_address', wallet)
    .eq('token_id', tokenId)
    .gte('timestamp', twentyFourHoursAgo)
    .order('timestamp', { ascending: true });
  
  if (!data || data.length < 4) {
    return { detected: false, count: 0 };
  }
  
  // Look for buy-sell pairs within short time windows
  let pumpDumpCount = 0;
  for (let i = 0; i < data.length - 1; i++) {
    const current = data[i];
    const next = data[i + 1];
    
    if (current.activity_type === 'buy' && next.activity_type === 'sell') {
      const timeDiff = new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime();
      // If sell happens within 30 minutes of buy
      if (timeDiff < 30 * 60 * 1000) {
        pumpDumpCount++;
      }
    }
  }
  
  const detected = pumpDumpCount >= 2; // 2+ round-trips in 24h
  
  if (detected) {
    await logSecurityEvent(supabase, 'pump_dump_detected', 'high', wallet, {
      token_id: tokenId,
      round_trips: pumpDumpCount,
    });
  }
  
  return { detected, count: pumpDumpCount };
}
