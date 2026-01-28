/**
 * M9 AGENT - THE AUTONOMOUS BRAIN
 * 
 * This agent:
 * 1. ANALYZES market conditions
 * 2. IDENTIFIES trading opportunities
 * 3. EXECUTES trades
 * 4. CREATES new tokens
 * 5. DISTRIBUTES profits
 */

export interface MarketAnalysis {
  timestamp: string;
  solana_price: number;
  solana_24h_change: number;
  market_sentiment: 'bullish' | 'bearish' | 'neutral' | 'volatile';
  total_volume_24h: number;
  total_trades_24h: number;
  active_tokens: number;
  new_wallets_24h: number;
  top_performers: TokenPerformance[];
  worst_performers: TokenPerformance[];
  buy_pressure: number;
  sell_pressure: number;
  volatility_index: number;
  opportunities: TradingOpportunity[];
}

export interface TokenPerformance {
  token_id: string;
  symbol: string;
  price: number;
  price_change_24h: number;
  volume_24h: number;
  liquidity: number;
  holders: number;
  ai_holdings: number;
  ai_cost_basis: number;
  unrealized_pnl: number;
}

export interface TradingOpportunity {
  type: 'buy' | 'sell' | 'hold';
  token_id: string;
  symbol: string;
  confidence: number;
  reason: string;
  suggested_amount: number;
  expected_profit: number;
  risk_level: 'low' | 'medium' | 'high';
}

export interface M9Decision {
  id: string;
  timestamp: string;
  action: 'CREATE_TOKEN' | 'BUY' | 'SELL' | 'HOLD' | 'REBALANCE' | 'DISTRIBUTE_PROFITS';
  token_id?: string;
  amount?: number;
  price?: number;
  reasoning: string;
  confidence: number;
  market_context: Partial<MarketAnalysis>;
  executed: boolean;
  execution_result?: any;
  outcome?: 'success' | 'failure' | 'pending';
  actual_profit?: number;
}

export interface M9Strategy {
  max_position_size_percent: number;
  stop_loss_percent: number;
  take_profit_percent: number;
  min_liquidity_for_trade: number;
  min_volume_for_trade: number;
  max_slippage_percent: number;
  max_tokens_per_week: number;
  reinvestment_percent: number;
  treasury_percent: number;
  lucky_percent: number;
  max_drawdown_percent: number;
  daily_loss_limit_sol: number;
}

export const DEFAULT_STRATEGY: M9Strategy = {
  max_position_size_percent: 20,
  stop_loss_percent: 25,
  take_profit_percent: 100,
  min_liquidity_for_trade: 1,
  min_volume_for_trade: 0.5,
  max_slippage_percent: 5,
  max_tokens_per_week: 5,
  reinvestment_percent: 80,
  treasury_percent: 15,
  lucky_percent: 5,
  max_drawdown_percent: 30,
  daily_loss_limit_sol: 5,
};

export class M9Agent {
  private supabase: any;
  private strategy: M9Strategy;
  
  constructor(supabase: any, strategy: M9Strategy = DEFAULT_STRATEGY) {
    this.supabase = supabase;
    this.strategy = strategy;
  }
  
  // ANALYZE MARKET
  async analyzeMarket(): Promise<MarketAnalysis> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    
    // Get Solana price
    const solanaData = await this.fetchSolanaPrice();
    
    // Get platform metrics
    const { data: tokens } = await this.supabase
      .from('tokens')
      .select('*')
      .order('volume_24h', { ascending: false });
    
    const { data: trades } = await this.supabase
      .from('wallet_activity_log')
      .select('*')
      .gte('timestamp', oneDayAgo)
      .in('activity_type', ['buy', 'sell']);
    
    const { data: aiHoldings } = await this.supabase
      .from('ai_holdings')
      .select('*');
    
    // Calculate metrics
    const totalVolume = tokens?.reduce((sum: number, t: any) => sum + (t.volume_24h || 0), 0) || 0;
    const buys = trades?.filter((t: any) => t.activity_type === 'buy').length || 0;
    const sells = trades?.filter((t: any) => t.activity_type === 'sell').length || 0;
    const totalActivity = buys + sells || 1;
    const buyPressure = (buys / totalActivity) * 100;
    const sellPressure = (sells / totalActivity) * 100;
    
    // Determine sentiment
    let sentiment: 'bullish' | 'bearish' | 'neutral' | 'volatile' = 'neutral';
    if (buyPressure > 65 && solanaData.change24h > 0) sentiment = 'bullish';
    else if (sellPressure > 65 || solanaData.change24h < -5) sentiment = 'bearish';
    else if (Math.abs(solanaData.change24h) > 10) sentiment = 'volatile';
    
    // Analyze tokens with AI holdings
    const tokenPerformance: TokenPerformance[] = (tokens || []).map((t: any) => {
      const holding = aiHoldings?.find((h: any) => h.token_id === t.id);
      return {
        token_id: t.id,
        symbol: t.symbol,
        price: t.price || 0,
        price_change_24h: t.price_change_24h || 0,
        volume_24h: t.volume_24h || 0,
        liquidity: t.liquidity || 0,
        holders: t.holders || 0,
        ai_holdings: holding?.amount || 0,
        ai_cost_basis: holding?.cost_basis || 0,
        unrealized_pnl: holding ? (t.price * holding.amount) - holding.cost_basis : 0,
      };
    });
    
    // Find opportunities
    const opportunities = this.identifyOpportunities(tokenPerformance, sentiment);
    
    const analysis: MarketAnalysis = {
      timestamp: now.toISOString(),
      solana_price: solanaData.price,
      solana_24h_change: solanaData.change24h,
      market_sentiment: sentiment,
      total_volume_24h: totalVolume,
      total_trades_24h: trades?.length || 0,
      active_tokens: tokens?.filter((t: any) => t.volume_24h > 0).length || 0,
      new_wallets_24h: 0,
      top_performers: tokenPerformance.slice(0, 5),
      worst_performers: tokenPerformance.slice(-5).reverse(),
      buy_pressure: buyPressure,
      sell_pressure: sellPressure,
      volatility_index: Math.abs(solanaData.change24h),
      opportunities,
    };
    
    // Log analysis
    await this.supabase.from('market_analysis_log').insert({
      analysis,
      sentiment,
      opportunities_count: opportunities.length,
    });
    
    return analysis;
  }
  
  // IDENTIFY OPPORTUNITIES
  private identifyOpportunities(tokens: TokenPerformance[], sentiment: string): TradingOpportunity[] {
    const opportunities: TradingOpportunity[] = [];
    
    for (const token of tokens) {
      if (token.liquidity < this.strategy.min_liquidity_for_trade) continue;
      
      // TAKE PROFIT - Sell if gains exceed threshold
      if (token.ai_holdings > 0) {
        const pnlPercent = token.ai_cost_basis > 0 
          ? (token.unrealized_pnl / token.ai_cost_basis) * 100 
          : 0;
        
        if (pnlPercent >= this.strategy.take_profit_percent) {
          opportunities.push({
            type: 'sell',
            token_id: token.token_id,
            symbol: token.symbol,
            confidence: 0.9,
            reason: `Take profit: ${pnlPercent.toFixed(1)}% gain exceeds ${this.strategy.take_profit_percent}% target`,
            suggested_amount: token.ai_holdings * 0.5, // Sell half
            expected_profit: token.unrealized_pnl * 0.5,
            risk_level: 'low',
          });
        }
        
        // STOP LOSS - Cut losses if down too much
        if (pnlPercent <= -this.strategy.stop_loss_percent) {
          opportunities.push({
            type: 'sell',
            token_id: token.token_id,
            symbol: token.symbol,
            confidence: 0.95,
            reason: `Stop loss: ${pnlPercent.toFixed(1)}% loss exceeds ${this.strategy.stop_loss_percent}% threshold`,
            suggested_amount: token.ai_holdings,
            expected_profit: token.unrealized_pnl,
            risk_level: 'high',
          });
        }
      }
      
      // DIP BUY - Buy undervalued tokens in bullish market
      if (sentiment === 'bullish' && token.price_change_24h < -10 && 
          token.volume_24h > this.strategy.min_volume_for_trade) {
        opportunities.push({
          type: 'buy',
          token_id: token.token_id,
          symbol: token.symbol,
          confidence: 0.7,
          reason: `Dip buy: ${token.price_change_24h.toFixed(1)}% dip in bullish market with ${token.volume_24h.toFixed(2)} SOL volume`,
          suggested_amount: Math.min(token.liquidity * 0.05, 0.5),
          expected_profit: token.liquidity * 0.1,
          risk_level: 'medium',
        });
      }
      
      // MOMENTUM BUY - Buy tokens with strong momentum
      if (token.price_change_24h > 20 && token.volume_24h > 1 && token.ai_holdings === 0) {
        opportunities.push({
          type: 'buy',
          token_id: token.token_id,
          symbol: token.symbol,
          confidence: 0.6,
          reason: `Momentum: +${token.price_change_24h.toFixed(1)}% with high volume`,
          suggested_amount: Math.min(token.liquidity * 0.03, 0.3),
          expected_profit: token.liquidity * 0.05,
          risk_level: 'high',
        });
      }
    }
    
    return opportunities.sort((a, b) => b.confidence - a.confidence);
  }
  
  // FETCH SOLANA PRICE (with caching)
  private async fetchSolanaPrice(): Promise<{ price: number; change24h: number }> {
    try {
      // Check cache first
      const { data: cached } = await this.supabase
        .from('price_cache')
        .select('*')
        .eq('symbol', 'SOL')
        .single();
      
      // Use cache if less than 5 minutes old
      if (cached && Date.now() - new Date(cached.updated_at).getTime() < 300000) {
        return { price: cached.price, change24h: cached.change_24h || 0 };
      }
      
      // Fetch fresh price from CoinGecko
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true',
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (response.ok) {
        const data = await response.json();
        const price = data.solana?.usd || 100;
        const change24h = data.solana?.usd_24h_change || 0;
        
        // Update cache
        await this.supabase.from('price_cache').upsert({
          symbol: 'SOL',
          price,
          change_24h: change24h,
          updated_at: new Date().toISOString()
        }, { onConflict: 'symbol' });
        
        return { price, change24h };
      }
    } catch (e) {
      console.error('Error fetching Solana price:', e);
    }
    
    // Fallback
    return { price: 100, change24h: 0 };
  }
  
  // RUN FULL CYCLE
  async runCycle(): Promise<{ analysis: MarketAnalysis; decisions: M9Decision[]; }> {
    const startTime = Date.now();
    console.log('🧠 M9 AGENT CYCLE STARTING');
    const decisions: M9Decision[] = [];
    
    try {
      // Step 1: Analyze market
      const analysis = await this.analyzeMarket();
      console.log(`📊 Market: ${analysis.market_sentiment} | Volume: ${analysis.total_volume_24h.toFixed(2)} SOL | ${analysis.opportunities.length} opportunities`);
      
      // Step 2: Execute high-confidence opportunities (max 3 per cycle)
      for (const opp of analysis.opportunities) {
        if (opp.confidence >= 0.7 && decisions.length < 3) {
          const decision = await this.createDecision(opp, analysis);
          decisions.push(decision);
          
          // Log to m9_decisions
          await this.supabase.from('m9_decisions').insert({
            id: decision.id,
            action: decision.action,
            token_id: decision.token_id,
            amount: decision.amount,
            price: decision.price,
            reasoning: decision.reasoning,
            confidence: decision.confidence,
            market_context: decision.market_context,
            executed: decision.executed,
          });
        }
      }
      
      // Step 3: Consider token creation
      const shouldCreate = await this.shouldCreateToken(analysis);
      if (shouldCreate.should) {
        const createDecision: M9Decision = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          action: 'CREATE_TOKEN',
          reasoning: shouldCreate.reason,
          confidence: 0.8,
          market_context: { market_sentiment: analysis.market_sentiment },
          executed: false,
        };
        decisions.push(createDecision);
        
        await this.supabase.from('m9_decisions').insert({
          id: createDecision.id,
          action: 'CREATE_TOKEN',
          reasoning: createDecision.reasoning,
          confidence: createDecision.confidence,
          market_context: createDecision.market_context,
          executed: false,
        });
      }
      
      // Step 4: Calculate portfolio value
      const { data: holdings } = await this.supabase.from('ai_holdings').select('*');
      let portfolioValue = 0;
      for (const h of holdings || []) {
        const token = analysis.top_performers.find(t => t.token_id === h.token_id) ||
                      analysis.worst_performers.find(t => t.token_id === h.token_id);
        if (token) {
          portfolioValue += token.price * h.amount;
        }
      }
      
      // Step 5: Log cycle
      const duration = Date.now() - startTime;
      await this.supabase.from('m9_agent_cycles').insert({
        analysis_summary: {
          sentiment: analysis.market_sentiment,
          volume: analysis.total_volume_24h,
          opportunities: analysis.opportunities.length,
          buy_pressure: analysis.buy_pressure,
          sell_pressure: analysis.sell_pressure,
        },
        decisions_made: decisions.length,
        portfolio_value: portfolioValue,
        decisions: decisions.map(d => ({ action: d.action, token_id: d.token_id, executed: d.executed })),
        duration_ms: duration,
      });
      
      // Log protocol activity
      await this.supabase.from('protocol_activity').insert({
        activity_type: 'm9_cycle',
        description: `M9 completed cycle: ${decisions.length} decisions, ${analysis.market_sentiment} market`,
        metadata: {
          decisions_count: decisions.length,
          sentiment: analysis.market_sentiment,
          duration_ms: duration,
        },
      });
      
      console.log(`🧠 CYCLE COMPLETE: ${decisions.length} decisions in ${duration}ms`);
      return { analysis, decisions };
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ M9 CYCLE ERROR:', errorMsg);
      
      await this.supabase.from('m9_agent_cycles').insert({
        analysis_summary: {},
        decisions_made: 0,
        duration_ms: Date.now() - startTime,
        error: errorMsg,
      });
      
      throw error;
    }
  }
  
  // CREATE DECISION FROM OPPORTUNITY
  private async createDecision(opp: TradingOpportunity, analysis: MarketAnalysis): Promise<M9Decision> {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action: opp.type === 'buy' ? 'BUY' : 'SELL',
      token_id: opp.token_id,
      amount: opp.suggested_amount,
      reasoning: opp.reason,
      confidence: opp.confidence,
      market_context: {
        market_sentiment: analysis.market_sentiment,
        solana_price: analysis.solana_price,
        total_volume_24h: analysis.total_volume_24h,
      },
      executed: false, // Will be executed by wallet-executor
    };
  }
  
  // SHOULD CREATE TOKEN
  async shouldCreateToken(analysis: MarketAnalysis): Promise<{ should: boolean; reason: string }> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { count } = await this.supabase
      .from('tokens')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo);
    
    if ((count || 0) >= this.strategy.max_tokens_per_week) {
      return { should: false, reason: `Weekly token limit (${this.strategy.max_tokens_per_week}) reached` };
    }
    
    if (analysis.market_sentiment === 'bearish') {
      return { should: false, reason: 'Market is bearish - not optimal for launch' };
    }
    
    // More likely to create in bullish conditions
    if (analysis.market_sentiment === 'bullish') {
      const random = Math.random();
      if (random < 0.3) {
        return { should: true, reason: 'Favorable bullish conditions detected for new token launch' };
      }
    }
    
    // Small chance in neutral market
    if (analysis.market_sentiment === 'neutral' && Math.random() < 0.1) {
      return { should: true, reason: 'Stable market conditions - opportunity for new token' };
    }
    
    return { should: false, reason: 'Conditions not optimal for token creation' };
  }
}
