/**
 * Market Sentiment Analyzer
 * 
 * Analyzes multiple data sources to determine overall market sentiment
 * and provide recommendations for token creation timing.
 */

import { supabase } from "@/integrations/supabase/client";

export interface SentimentAnalysis {
  score: number; // -10 to +10
  recommendation: 'create' | 'tease' | 'wait' | 'emergency_wait';
  confidence: number; // 0-1
  factors: {
    solanaVolume: number;
    trendingMemes: string[];
    whaleActivity: 'low' | 'medium' | 'high' | 'critical';
    daoParticipation: number;
    internalVolume: number;
  };
  reasoning: string;
}

export class MarketSentimentAnalyzer {
  private readonly VOLUME_THRESHOLD_BULLISH = 1000000000; // $1B
  private readonly VOLUME_THRESHOLD_NEUTRAL = 500000000; // $500M
  private readonly DAO_PARTICIPATION_HEALTHY = 20;
  private readonly WHALE_ACTIVITY_CRITICAL = 10; // number of large transactions

  /**
   * Perform comprehensive sentiment analysis
   */
  async analyze(): Promise<SentimentAnalysis> {
    console.log('📊 [SENTIMENT] Starting market sentiment analysis...');

    const startTime = Date.now();

    try {
      // Gather all data sources
      const [
        solanaMetrics,
        internalMetrics,
        whaleActivity,
        daoMetrics
      ] = await Promise.all([
        this.getSolanaMetrics(),
        this.getInternalMetrics(),
        this.getWhaleActivity(),
        this.getDAOMetrics()
      ]);

      // Calculate sentiment score
      const score = this.calculateSentimentScore(
        solanaMetrics,
        internalMetrics,
        whaleActivity,
        daoMetrics
      );

      // Determine recommendation
      const recommendation = this.determineRecommendation(score, whaleActivity);

      // Calculate confidence
      const confidence = this.calculateConfidence(
        solanaMetrics,
        internalMetrics,
        whaleActivity
      );

      // Generate reasoning
      const reasoning = this.generateReasoning(
        score,
        recommendation,
        solanaMetrics,
        internalMetrics,
        whaleActivity,
        daoMetrics
      );

      const analysis: SentimentAnalysis = {
        score,
        recommendation,
        confidence,
        factors: {
          solanaVolume: solanaMetrics.volume24h,
          trendingMemes: solanaMetrics.trendingMemes,
          whaleActivity: whaleActivity.level,
          daoParticipation: daoMetrics.participationRate,
          internalVolume: internalMetrics.volume24h
        },
        reasoning
      };

      // Store sentiment in database
      await this.storeSentiment(analysis);

      const executionTime = Date.now() - startTime;
      console.log(`✅ [SENTIMENT] Analysis complete in ${executionTime}ms`);
      console.log(`   Score: ${score}/10`);
      console.log(`   Recommendation: ${recommendation.toUpperCase()}`);
      console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%`);

      return analysis;
    } catch (error) {
      console.error('[SENTIMENT ERROR]:', error);
      
      // Return safe default
      return {
        score: 0,
        recommendation: 'wait',
        confidence: 0,
        factors: {
          solanaVolume: 0,
          trendingMemes: [],
          whaleActivity: 'low',
          daoParticipation: 0,
          internalVolume: 0
        },
        reasoning: 'Error during sentiment analysis - defaulting to safe wait state'
      };
    }
  }

  /**
   * Get Solana network metrics
   */
  private async getSolanaMetrics(): Promise<{
    volume24h: number;
    activeWallets: number;
    trendingMemes: string[];
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-solana-metrics');
      
      if (error) throw error;

      return {
        volume24h: data?.volume24h || 0,
        activeWallets: data?.activeWallets || 0,
        trendingMemes: data?.trendingMemes || []
      };
    } catch (error) {
      console.warn('[SENTIMENT] Solana metrics unavailable:', error);
      return { volume24h: 0, activeWallets: 0, trendingMemes: [] };
    }
  }

  /**
   * Get internal platform metrics
   */
  private async getInternalMetrics(): Promise<{
    volume24h: number;
    activeUsers: number;
    tokenActivity: number;
  }> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: tokens } = await supabase
      .from('tokens')
      .select('volume_24h')
      .gte('created_at', yesterday);

    const { data: activity } = await supabase
      .from('wallet_activity_log')
      .select('wallet_address, amount')
      .gte('timestamp', yesterday);

    const volume24h = tokens?.reduce((sum, t) => sum + Number(t.volume_24h || 0), 0) || 0;
    const activeUsers = new Set(activity?.map(a => a.wallet_address) || []).size;
    const tokenActivity = activity?.length || 0;

    return {
      volume24h,
      activeUsers,
      tokenActivity
    };
  }

  /**
   * Analyze whale activity
   */
  private async getWhaleActivity(): Promise<{
    level: 'low' | 'medium' | 'high' | 'critical';
    count: number;
    flaggedWallets: number;
  }> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: whaleActivity } = await supabase
      .from('wallet_activity_log')
      .select('*')
      .eq('is_whale_flagged', true)
      .gte('timestamp', yesterday);

    const { data: flaggedWallets, count } = await supabase
      .from('dao_eligibility')
      .select('*', { count: 'exact' })
      .eq('whale_status', true);

    const whaleCount = whaleActivity?.length || 0;
    const flaggedCount = count || 0;

    let level: 'low' | 'medium' | 'high' | 'critical';
    if (whaleCount > this.WHALE_ACTIVITY_CRITICAL) level = 'critical';
    else if (whaleCount > 5) level = 'high';
    else if (whaleCount > 2) level = 'medium';
    else level = 'low';

    return {
      level,
      count: whaleCount,
      flaggedWallets: flaggedCount
    };
  }

  /**
   * Get DAO participation metrics
   */
  private async getDAOMetrics(): Promise<{
    participationRate: number;
    activeProposals: number;
    eligibleMembers: number;
  }> {
    try {
      const { count: activeCount } = await supabase
        .from('dao_eligibility')
        .select('*', { count: 'exact', head: true })
        .eq('is_eligible', true)
        .limit(1);

      const { count: eligibleCount } = await supabase
        .from('dao_eligibility')
        .select('*', { count: 'exact', head: true })
        .eq('is_eligible', true);

      // For now, return basic metrics
      // Full DAO integration will work once types are updated
      const participationRate = 0;
      const activeProposals = 0;

      return {
        participationRate,
        activeProposals: activeProposals || 0,
        eligibleMembers: eligibleCount || 0
      };
    } catch (error) {
      console.warn('[SENTIMENT] DAO metrics unavailable:', error);
      return {
        participationRate: 0,
        activeProposals: 0,
        eligibleMembers: 0
      };
    }
  }

  /**
   * Calculate sentiment score (-10 to +10)
   */
  private calculateSentimentScore(
    solana: any,
    internal: any,
    whale: any,
    dao: any
  ): number {
    let score = 0;

    // Solana network sentiment (+4 max)
    if (solana.volume24h > this.VOLUME_THRESHOLD_BULLISH) score += 4;
    else if (solana.volume24h > this.VOLUME_THRESHOLD_NEUTRAL) score += 2;
    else if (solana.volume24h < this.VOLUME_THRESHOLD_NEUTRAL / 2) score -= 2;

    // Trending meme coins (+3 max)
    const memeCount = solana.trendingMemes.length;
    if (memeCount >= 3) score += 3;
    else if (memeCount >= 2) score += 2;
    else if (memeCount >= 1) score += 1;

    // Internal activity (+3 max)
    if (internal.activeUsers > 50) score += 3;
    else if (internal.activeUsers > 20) score += 2;
    else if (internal.activeUsers > 10) score += 1;
    else if (internal.activeUsers < 5) score -= 2;

    // Whale activity penalty (-5 max)
    if (whale.level === 'critical') score -= 5;
    else if (whale.level === 'high') score -= 3;
    else if (whale.level === 'medium') score -= 1;

    // DAO health bonus (+2 max)
    if (dao.participationRate > 50) score += 2;
    else if (dao.participationRate > 30) score += 1;

    // Cap between -10 and +10
    return Math.max(-10, Math.min(10, score));
  }

  /**
   * Determine recommendation based on score
   */
  private determineRecommendation(
    score: number,
    whale: any
  ): SentimentAnalysis['recommendation'] {
    // Critical whale activity = emergency wait
    if (whale.level === 'critical') return 'emergency_wait';

    // Score > 6 = create
    if (score > 6) return 'create';

    // Score 3-6 = tease
    if (score >= 3) return 'tease';

    // Score < 3 = wait
    return 'wait';
  }

  /**
   * Calculate confidence in the analysis
   */
  private calculateConfidence(
    solana: any,
    internal: any,
    whale: any
  ): number {
    let confidence = 0.5;

    // More data = more confidence
    if (solana.volume24h > 0) confidence += 0.1;
    if (solana.trendingMemes.length > 0) confidence += 0.1;
    if (internal.activeUsers > 10) confidence += 0.15;
    if (internal.tokenActivity > 20) confidence += 0.15;

    // Whale uncertainty reduces confidence
    if (whale.level === 'high' || whale.level === 'critical') {
      confidence -= 0.2;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    score: number,
    recommendation: string,
    solana: any,
    internal: any,
    whale: any,
    dao: any
  ): string {
    const reasons = [];

    // Market conditions
    if (solana.volume24h > this.VOLUME_THRESHOLD_BULLISH) {
      reasons.push('🔥 Solana network is bullish (>$1B volume)');
    } else if (solana.volume24h > this.VOLUME_THRESHOLD_NEUTRAL) {
      reasons.push('📊 Solana network is active ($500M+ volume)');
    } else {
      reasons.push('📉 Solana network volume is low');
    }

    // Meme trends
    if (solana.trendingMemes.length > 0) {
      reasons.push(`🚀 ${solana.trendingMemes.length} meme coins trending`);
    }

    // Internal activity
    if (internal.activeUsers > 50) {
      reasons.push('👥 High internal activity (50+ active users)');
    } else if (internal.activeUsers < 10) {
      reasons.push('😴 Low internal activity (<10 users)');
    }

    // Whale warning
    if (whale.level === 'critical') {
      reasons.push('🚨 CRITICAL: Excessive whale activity detected');
    } else if (whale.level === 'high') {
      reasons.push('🐋 High whale activity - caution advised');
    }

    // DAO health
    if (dao.participationRate > 50) {
      reasons.push('🗳️ Strong DAO participation');
    } else if (dao.participationRate < 10) {
      reasons.push('⚠️ Low DAO engagement');
    }

    return reasons.join(' | ');
  }

  /**
   * Store sentiment analysis in database
   */
  private async storeSentiment(analysis: SentimentAnalysis): Promise<void> {
    try {
      await supabase.from('market_sentiment').insert({
        sentiment_score: analysis.score,
        solana_volume: analysis.factors.solanaVolume,
        trending_tags: analysis.factors.trendingMemes,
        whale_activity_level: analysis.factors.whaleActivity,
        dao_participation_rate: analysis.factors.daoParticipation,
        recommendation: analysis.recommendation,
        confidence: analysis.confidence
      });
    } catch (error) {
      console.error('[SENTIMENT] Failed to store sentiment:', error);
    }
  }

  /**
   * Get latest sentiment from database
   */
  async getLatestSentiment(): Promise<SentimentAnalysis | null> {
    try {
      const { data } = await supabase
        .from('market_sentiment')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (!data) return null;

      return {
        score: Number(data.sentiment_score),
        recommendation: data.recommendation as any,
        confidence: Number(data.confidence),
        factors: {
          solanaVolume: Number(data.solana_volume || 0),
          trendingMemes: data.trending_tags || [],
          whaleActivity: data.whale_activity_level as any,
          daoParticipation: Number(data.dao_participation_rate || 0),
          internalVolume: 0
        },
        reasoning: 'Historical sentiment data'
      };
    } catch (error) {
      console.error('[SENTIMENT] Failed to fetch latest:', error);
      return null;
    }
  }
}
