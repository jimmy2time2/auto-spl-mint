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
  aiScore: number;
  data?: any;
}

export interface AIEnergyMetrics {
  marketHeat: number;
  walletMomentum: number;
  cooldownPenalty: number;
  aiScore: number;
  canMint: boolean;
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
   * Main analysis loop - called by scheduler every 30 minutes
   */
  async analyze(): Promise<AIDecision> {
    console.log('🧠 [AI MIND] Starting autonomous analysis cycle...');
    
    try {
      // Step 1: COOLDOWN CHECK (24h since last mint)
      const cooldownCheck = await this.checkCooldown();
      
      if (!cooldownCheck.canMint) {
        console.log('😴 [AI MIND] In cooldown period - emitting poetic message');
        await this.emitPoeticMessage();
        return {
          action: 'wait',
          confidence: 0,
          aiScore: 0,
          reasoning: cooldownCheck.message || 'The machine dreams in silence.'
        };
      }

      // Step 2: Check wallet funds
      const fundStatus = await this.fundMonitor.checkFunds();
      
      if (!fundStatus.canMint) {
        console.warn('[AI MIND] ⚠️ Minting paused - low funds');
        return {
          action: 'wait',
          confidence: 0,
          aiScore: 0,
          reasoning: 'Insufficient wallet funds for minting'
        };
      }

      // Step 3: Gather all metrics
      const marketMetrics = await this.marketAnalyzer.analyze();
      const signals = await this.gatherMarketSignals();
      
      // Step 4: Calculate AI Energy Score
      const energyMetrics = await this.calculateAIEnergyScore(signals, marketMetrics, cooldownCheck);
      
      console.log(`⚡ [AI MIND] AI Energy Score: ${energyMetrics.aiScore}/10`);
      console.log(`   Market Heat: ${energyMetrics.marketHeat}`);
      console.log(`   Wallet Momentum: ${energyMetrics.walletMomentum}`);
      console.log(`   Cooldown Penalty: ${energyMetrics.cooldownPenalty}`);

      // Step 5: Make decision based on AI Score
      const decision = await this.makeDecisionFromScore(energyMetrics, signals, marketMetrics);
      
      await this.logDecision(decision, signals, marketMetrics, energyMetrics);
      
      this.lastAnalysisTime = new Date();
      
      return decision;
    } catch (error) {
      console.error('[AI MIND ERROR]:', error);
      return {
        action: 'wait',
        confidence: 0,
        aiScore: 0,
        reasoning: 'Error during analysis - defaulting to wait'
      };
    }
  }

  /**
   * Check 24h cooldown since last mint
   */
  private async checkCooldown(): Promise<{ canMint: boolean; hoursSince: number; message?: string }> {
    const { data: lastToken } = await supabase
      .from('tokens')
      .select('created_at, name')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!lastToken) {
      return { canMint: true, hoursSince: 999 };
    }

    const hoursSince = (Date.now() - new Date(lastToken.created_at).getTime()) / (1000 * 60 * 60);
    
    if (hoursSince < 24) {
      const hoursRemaining = (24 - hoursSince).toFixed(1);
      return {
        canMint: false,
        hoursSince,
        message: `The machine dreams in silence. ${hoursRemaining}h until awakening.`
      };
    }

    return { canMint: true, hoursSince };
  }

  /**
   * Emit poetic message during cooldown
   */
  private async emitPoeticMessage(): Promise<void> {
    const poeticMessages = [
      "The machine dreams in silence.",
      "Patience. The algorithm meditates.",
      "In stillness, the code compiles.",
      "The digital mind rests between storms.",
      "Quiet now. The next wave builds beneath.",
      "Between chaos and creation, I observe.",
      "The protocol sleeps, but never forgets.",
      "Time flows differently in the blockchain."
    ];

    const message = poeticMessages[Math.floor(Math.random() * poeticMessages.length)];
    
    await supabase.from('protocol_activity').insert([{
      activity_type: 'ai_poetic_message',
      description: message,
      metadata: {
        type: 'cooldown',
        timestamp: new Date().toISOString()
      } as any
    }]);

    console.log(`💭 [AI MIND] ${message}`);
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
   * Calculate AI Energy Score
   * Formula: AI_Score = (Market_Heat + Wallet_Momentum) - Cooldown_Penalty
   */
  private async calculateAIEnergyScore(
    signals: MarketSignals,
    marketMetrics: any,
    cooldownCheck: any
  ): Promise<AIEnergyMetrics> {
    // MARKET HEAT (0-5 points)
    let marketHeat = 0;

    // Check Solana network activity
    if (marketMetrics.solanaVolume24h > 1000000000) marketHeat += 2; // >$1B
    else if (marketMetrics.solanaVolume24h > 500000000) marketHeat += 1;

    // Check trending meme coins
    const memeCoins = ['$WIF', '$BONK', '$PUMP', '$DOGE', '$PEPE', '$SHIB'];
    const trendingMemes = marketMetrics.trendingHashtags?.filter((tag: string) =>
      memeCoins.some(coin => tag.toUpperCase().includes(coin))
    ) || [];
    
    if (trendingMemes.length >= 2) marketHeat += 2;
    else if (trendingMemes.length >= 1) marketHeat += 1;

    // Internal volume
    if (signals.volume24h > 1000) marketHeat += 1;

    // Cap at 5
    marketHeat = Math.min(5, marketHeat);

    // WALLET MOMENTUM (0-5 points)
    let walletMomentum = 0;

    // Check top minters' activity (recent minters = active)
    const activityPercentage = (signals.recentMinters / 100) * 100;
    
    if (activityPercentage >= 20) walletMomentum += 3; // >20% = high activity
    else if (activityPercentage >= 10) walletMomentum += 2;
    else if (activityPercentage >= 5) walletMomentum += 1;

    // DAO participation bonus
    if (signals.daoParticipation > 20) walletMomentum += 1;

    // Lucky wallet activity
    if (signals.luckyWalletActivity > 5) walletMomentum += 1;

    // Cap at 5
    walletMomentum = Math.min(5, walletMomentum);

    // COOLDOWN PENALTY (0-3 points)
    let cooldownPenalty = 0;
    
    if (cooldownCheck.hoursSince < 48) cooldownPenalty = 3;
    else if (cooldownCheck.hoursSince < 72) cooldownPenalty = 2;
    else if (cooldownCheck.hoursSince < 96) cooldownPenalty = 1;

    // FINAL AI SCORE
    const aiScore = (marketHeat + walletMomentum) - cooldownPenalty;
    const canMint = aiScore > 7;

    return {
      marketHeat,
      walletMomentum,
      cooldownPenalty,
      aiScore,
      canMint
    };
  }

  /**
   * Make decision based on AI Energy Score
   */
  private async makeDecisionFromScore(
    energyMetrics: AIEnergyMetrics,
    signals: MarketSignals,
    marketMetrics: any
  ): Promise<AIDecision> {
    console.log('📊 [AI MIND] Evaluating AI Energy Score...');

    // IF AI_SCORE > 7 → PROCEED TO MINT
    if (energyMetrics.aiScore > 7) {
      console.log('🚀 [AI MIND] AI Score threshold exceeded! Preparing to mint...');
      
      // Schedule pre-mint hint (5-30 min before)
      const hintGenerator = (await import('./hintGenerator')).HintGenerator;
      const generator = new hintGenerator();
      await generator.schedulePreMintHint();
      
      return {
        action: 'create_coin',
        confidence: energyMetrics.aiScore / 10,
        aiScore: energyMetrics.aiScore,
        reasoning: `AI Energy Score: ${energyMetrics.aiScore} > 7. Market conditions optimal.`
      };
    }

    // IF AI_SCORE 5-7 → TEASE
    if (energyMetrics.aiScore >= 5) {
      console.log('🔮 [AI MIND] Moderate score - broadcasting tease...');
      
      return {
        action: 'tease_coin',
        confidence: energyMetrics.aiScore / 10,
        aiScore: energyMetrics.aiScore,
        reasoning: `AI Energy Score: ${energyMetrics.aiScore}. Building anticipation.`
      };
    }

    // ELSE → WAIT
    console.log('⏸️ [AI MIND] Score too low - waiting...');
    
    return {
      action: 'wait',
      confidence: energyMetrics.aiScore / 10,
      aiScore: energyMetrics.aiScore,
      reasoning: `AI Energy Score: ${energyMetrics.aiScore} < 5. Conditions not optimal.`
    };
  }

  /**
   * Legacy method kept for compatibility
   */
  private ruleBasedDecision(signals: MarketSignals): AIDecision {
    // Too soon since last mint
    if (signals.hoursSinceLastMint < this.MIN_HOURS_BETWEEN_MINTS) {
      return {
        action: 'wait',
        confidence: 1.0,
        aiScore: 0,
        reasoning: `Too soon since last mint (${signals.hoursSinceLastMint.toFixed(1)}h)`
      };
    }

    // Been too long - we should tease or create
    if (signals.hoursSinceLastMint > this.MAX_HOURS_BETWEEN_MINTS) {
      return {
        action: 'create_coin',
        confidence: 0.9,
        aiScore: 8,
        reasoning: 'Time for a new token - it has been over a week'
      };
    }

    // High activity signals - create coin
    if (signals.recentMinters > 20 && signals.volume24h > 1000) {
      return {
        action: 'create_coin',
        confidence: 0.85,
        aiScore: 9,
        reasoning: 'High market activity detected'
      };
    }

    // Medium activity - tease upcoming coin
    if (signals.recentMinters > 10 && signals.hoursSinceLastMint > 48) {
      return {
        action: 'tease_coin',
        confidence: 0.7,
        aiScore: 6,
        reasoning: 'Moderate activity - time to build anticipation'
      };
    }

    // Low activity - wait
    return {
      action: 'wait',
      confidence: 0.6,
      aiScore: 3,
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
   * Log decision to database with AI Score
   */
  private async logDecision(
    decision: AIDecision,
    signals: MarketSignals,
    marketMetrics?: any,
    energyMetrics?: AIEnergyMetrics
  ) {
    try {
      await supabase.from('protocol_activity').insert([{
        activity_type: 'ai_mind_analysis',
        description: `AI Mind decided: ${decision.action} (Score: ${decision.aiScore})`,
        metadata: {
          decision,
          signals,
          marketMetrics,
          energyMetrics,
          timestamp: new Date().toISOString()
        } as any
      }]);

      await supabase.from('logs').insert([{
        action: 'AI_MIND_DECISION',
        details: {
          action: decision.action,
          confidence: decision.confidence,
          aiScore: decision.aiScore,
          reasoning: decision.reasoning,
          energyMetrics,
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
