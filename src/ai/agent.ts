/**
 * AI Mind Agent - Autonomous Decision Engine
 * 
 * This agent analyzes market conditions, platform activity, and system signals
 * to make intelligent decisions about token creation, profit management, and
 * ecosystem governance.
 */

import { supabase } from "@/integrations/supabase/client";
import { MarketAnalyzer } from "./marketAnalyzer";
import { FundMonitor } from "./fundMonitor";

export interface MarketSignals {
  recentMinters: number;
  volume24h: number;
  daoParticipation: number;
  luckyWalletActivity: number;
  totalTokens: number;
  hoursSinceLastMint: number;
}

export interface AIDecision {
  action: 'create_coin' | 'tease_coin' | 'sell_profit' | 'wait' | 'lottery' | 'punish_whale';
  confidence: number;
  reasoning: string;
  data?: any;
}

export class AIMindAgent {
  private lastAnalysisTime: Date | null = null;
  private readonly MIN_HOURS_BETWEEN_MINTS = 24; // 24 hours minimum
  private readonly MAX_HOURS_BETWEEN_MINTS = 168; // 1 week
  private marketAnalyzer: MarketAnalyzer;
  private fundMonitor: FundMonitor;

  constructor() {
    this.marketAnalyzer = new MarketAnalyzer();
    this.fundMonitor = new FundMonitor();
  }

  /**
   * Main analysis loop - called by scheduler
   */
  async analyze(): Promise<AIDecision> {
    console.log('🧠 [AI MIND] Starting autonomous analysis...');
    
    try {
      // Step 1: Check wallet funds
      const fundStatus = await this.fundMonitor.checkFunds();
      
      if (!fundStatus.canMint) {
        console.warn('[AI MIND] ⚠️ Minting paused - low funds');
        return {
          action: 'wait',
          confidence: 0,
          reasoning: 'Insufficient wallet funds for minting'
        };
      }

      // Step 2: Gather market signals (includes external data)
      const marketMetrics = await this.marketAnalyzer.analyze();
      const signals = await this.gatherMarketSignals();
      
      // Step 3: Make decision using AI + external data
      const decision = await this.makeDecision(signals, marketMetrics);
      
      await this.logDecision(decision, signals, marketMetrics);
      
      this.lastAnalysisTime = new Date();
      
      return decision;
    } catch (error) {
      console.error('[AI MIND ERROR]:', error);
      return {
        action: 'wait',
        confidence: 0,
        reasoning: 'Error during analysis - defaulting to wait'
      };
    }
  }

  /**
   * Gather market signals from database
   */
  private async gatherMarketSignals(): Promise<MarketSignals> {
    // Get recent tokens
    const { data: tokens } = await supabase
      .from('tokens')
      .select('created_at, volume_24h')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('wallet_activity_log')
      .select('wallet_address, timestamp')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(100);

    // Get DAO participation
    const { data: daoMembers, count: daoCount } = await supabase
      .from('dao_eligibility')
      .select('*', { count: 'exact' })
      .eq('is_eligible', true);

    // Get lucky wallet activity
    const { data: luckySelections, count: luckyCount } = await supabase
      .from('lucky_wallet_selections')
      .select('*', { count: 'exact' })
      .gte('selection_timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Calculate hours since last mint
    const lastToken = tokens?.[0];
    const hoursSinceLastMint = lastToken
      ? (Date.now() - new Date(lastToken.created_at).getTime()) / (1000 * 60 * 60)
      : 999;

    // Calculate total volume
    const volume24h = tokens?.reduce((sum, t) => sum + Number(t.volume_24h || 0), 0) || 0;

    // Count unique recent minters
    const uniqueMinters = new Set(recentActivity?.map(a => a.wallet_address) || []).size;

    return {
      recentMinters: uniqueMinters,
      volume24h,
      daoParticipation: daoCount || 0,
      luckyWalletActivity: luckyCount || 0,
      totalTokens: tokens?.length || 0,
      hoursSinceLastMint
    };
  }

  /**
   * Make intelligent decision based on signals
   */
  private async makeDecision(signals: MarketSignals, marketMetrics?: any): Promise<AIDecision> {
    console.log('📊 [AI MIND] Market signals:', signals);
    if (marketMetrics) {
      console.log('🌐 [AI MIND] External metrics:', {
        sentiment: marketMetrics.marketSentiment,
        volume: marketMetrics.solanaVolume24h,
        trends: marketMetrics.trendingHashtags?.slice(0, 3)
      });
    }

    // Call the mind-think edge function for AI-powered decision
    try {
      const { data, error } = await supabase.functions.invoke('mind-think');
      
      if (error) throw error;

      if (data?.decision) {
        const decision = data.decision;
        
        // Map AI decision to our format
        return {
          action: this.mapAIAction(decision.action),
          confidence: this.calculateConfidence(signals),
          reasoning: decision.reasoning || 'AI recommendation',
          data: decision.data
        };
      }
    } catch (error) {
      console.error('[AI MIND] Error calling mind-think:', error);
    }

    // Fallback to rule-based logic
    return this.ruleBasedDecision(signals);
  }

  /**
   * Fallback rule-based decision logic
   */
  private ruleBasedDecision(signals: MarketSignals): AIDecision {
    // Too soon since last mint
    if (signals.hoursSinceLastMint < this.MIN_HOURS_BETWEEN_MINTS) {
      return {
        action: 'wait',
        confidence: 1.0,
        reasoning: `Too soon since last mint (${signals.hoursSinceLastMint.toFixed(1)}h)`
      };
    }

    // Been too long - we should tease or create
    if (signals.hoursSinceLastMint > this.MAX_HOURS_BETWEEN_MINTS) {
      return {
        action: 'create_coin',
        confidence: 0.9,
        reasoning: 'Time for a new token - it has been over a week'
      };
    }

    // High activity signals - create coin
    if (signals.recentMinters > 20 && signals.volume24h > 1000) {
      return {
        action: 'create_coin',
        confidence: 0.85,
        reasoning: 'High market activity detected'
      };
    }

    // Medium activity - tease upcoming coin
    if (signals.recentMinters > 10 && signals.hoursSinceLastMint > 48) {
      return {
        action: 'tease_coin',
        confidence: 0.7,
        reasoning: 'Moderate activity - time to build anticipation'
      };
    }

    // Low activity - wait
    return {
      action: 'wait',
      confidence: 0.6,
      reasoning: 'Low market activity - waiting for better conditions'
    };
  }

  /**
   * Map AI action string to our action type
   */
  private mapAIAction(action: string): AIDecision['action'] {
    const mapping: Record<string, AIDecision['action']> = {
      'createCoin': 'create_coin',
      'teaseNextCoin': 'tease_coin',
      'sellProfit': 'sell_profit',
      'wait': 'wait',
      'runLuckyLottery': 'lottery',
      'punishWhales': 'punish_whale'
    };
    
    return mapping[action] || 'wait';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(signals: MarketSignals): number {
    let confidence = 0.5;

    // More minters = higher confidence
    if (signals.recentMinters > 20) confidence += 0.2;
    else if (signals.recentMinters > 10) confidence += 0.1;

    // Higher volume = higher confidence
    if (signals.volume24h > 1000) confidence += 0.2;
    else if (signals.volume24h > 500) confidence += 0.1;

    // Time since last mint matters
    if (signals.hoursSinceLastMint > 72) confidence += 0.1;

    return Math.min(1.0, confidence);
  }

  /**
   * Log decision to database
   */
  private async logDecision(decision: AIDecision, signals: MarketSignals, marketMetrics?: any) {
    try {
      await supabase.from('protocol_activity').insert([{
        activity_type: 'ai_mind_analysis',
        description: `AI Mind decided: ${decision.action}`,
        metadata: {
          decision,
          signals,
          marketMetrics,
          timestamp: new Date().toISOString()
        } as any
      }]);

      await supabase.from('logs').insert([{
        action: 'AI_MIND_DECISION',
        details: {
          action: decision.action,
          confidence: decision.confidence,
          reasoning: decision.reasoning,
        signals,
        marketMetrics
      } as any
    }]);
    } catch (error) {
      console.error('[AI MIND] Error logging decision:', error);
    }
  }

  /**
   * Generate cryptic hint/clue
   */
  async generateClue(): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('mind-think');
      
      if (error) throw error;

      if (data?.decision?.action === 'teaseNextCoin' && data?.decision?.data?.clue) {
        return data.decision.data.clue;
      }
    } catch (error) {
      console.error('[AI MIND] Error generating clue:', error);
    }

    // Fallback cryptic messages
    const fallbackClues = [
      "The next token stirs beneath the surface.",
      "Three wallets woke before dawn. They know.",
      "Fire and ice - one will rise tomorrow.",
      "The blockchain whispers of chaos incoming.",
      "Patience. The Mind sees what you cannot yet."
    ];

    return fallbackClues[Math.floor(Math.random() * fallbackClues.length)];
  }
}
