/**
 * Market Analyzer - External Data Integration
 * 
 * Fetches and analyzes:
 * - Solana on-chain data (volume, wallet activity)
 * - Twitter/X trending hashtags
 * - Token metrics and market conditions
 */

import { supabase } from "@/integrations/supabase/client";

export interface MarketMetrics {
  solanaVolume24h: number;
  activeWallets: number;
  trendingHashtags: string[];
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  recommendMint: boolean;
  confidence: number;
}

export class MarketAnalyzer {
  private readonly MIN_HOURS_BETWEEN_CHECKS = 0.5; // 30 minutes
  private lastAnalysisTime: Date | null = null;

  /**
   * Main analysis function - fetches all external data
   */
  async analyze(): Promise<MarketMetrics> {
    console.log('📊 [MARKET ANALYZER] Starting market analysis...');

    try {
      // Check rate limiting
      if (!this.canAnalyze()) {
        throw new Error('Analysis rate limit - wait 30 minutes');
      }

      // Parallel data fetching
      const [
        solanaData,
        twitterData,
        internalMetrics
      ] = await Promise.all([
        this.fetchSolanaMetrics(),
        this.fetchTwitterTrends(),
        this.fetchInternalMetrics()
      ]);

      // Analyze and combine
      const metrics = this.calculateMetrics(solanaData, twitterData, internalMetrics);
      
      this.lastAnalysisTime = new Date();
      
      // Log analysis
      await this.logAnalysis(metrics);

      return metrics;
    } catch (error) {
      console.error('[MARKET ANALYZER ERROR]:', error);
      
      // Return safe defaults on error
      return {
        solanaVolume24h: 0,
        activeWallets: 0,
        trendingHashtags: [],
        marketSentiment: 'neutral',
        recommendMint: false,
        confidence: 0
      };
    }
  }

  /**
   * Check if we can run analysis (rate limiting)
   */
  private canAnalyze(): boolean {
    if (!this.lastAnalysisTime) return true;
    
    const hoursSinceLast = (Date.now() - this.lastAnalysisTime.getTime()) / (1000 * 60 * 60);
    return hoursSinceLast >= this.MIN_HOURS_BETWEEN_CHECKS;
  }

  /**
   * Fetch Solana on-chain metrics
   * In production, replace with real Solana RPC calls
   */
  private async fetchSolanaMetrics(): Promise<any> {
    try {
      // TODO: Replace with real Solana RPC endpoint
      // const connection = new Connection(clusterApiUrl('mainnet-beta'));
      // const slot = await connection.getSlot();
      
      // For now, use edge function that calls Solana APIs
      const { data, error } = await supabase.functions.invoke('fetch-solana-metrics');
      
      if (error) throw error;
      
      return data || {
        volume24h: 0,
        activeWallets: 0,
        transactionCount: 0
      };
    } catch (error) {
      console.error('[MARKET ANALYZER] Solana fetch error:', error);
      return { volume24h: 0, activeWallets: 0, transactionCount: 0 };
    }
  }

  /**
   * Fetch Twitter/X trending topics
   * Uses edge function to call Twitter API
   */
  private async fetchTwitterTrends(): Promise<string[]> {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-twitter-trends');
      
      if (error) throw error;
      
      return data?.trends || [];
    } catch (error) {
      console.error('[MARKET ANALYZER] Twitter fetch error:', error);
      return [];
    }
  }

  /**
   * Fetch internal platform metrics
   */
  private async fetchInternalMetrics(): Promise<any> {
    try {
      // Get recent token activity
      const { data: tokens } = await supabase
        .from('tokens')
        .select('volume_24h, holders, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      // Get recent wallet activity
      const { data: walletActivity } = await supabase
        .from('wallet_activity_log')
        .select('wallet_address, amount, timestamp')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(100);

      // Get last mint time
      const lastToken = tokens?.[0];
      const hoursSinceLastMint = lastToken
        ? (Date.now() - new Date(lastToken.created_at).getTime()) / (1000 * 60 * 60)
        : 999;

      return {
        tokens,
        walletActivity,
        hoursSinceLastMint,
        totalVolume: tokens?.reduce((sum, t) => sum + Number(t.volume_24h || 0), 0) || 0,
        uniqueWallets: new Set(walletActivity?.map(w => w.wallet_address)).size
      };
    } catch (error) {
      console.error('[MARKET ANALYZER] Internal metrics error:', error);
      return {
        tokens: [],
        walletActivity: [],
        hoursSinceLastMint: 999,
        totalVolume: 0,
        uniqueWallets: 0
      };
    }
  }

  /**
   * Calculate final metrics and recommendation
   */
  private calculateMetrics(
    solanaData: any,
    twitterData: string[],
    internalData: any
  ): MarketMetrics {
    // Calculate sentiment based on data
    let sentimentScore = 0;

    // Solana volume factor
    if (solanaData.volume24h > 1000000) sentimentScore += 2;
    else if (solanaData.volume24h > 500000) sentimentScore += 1;

    // Active wallets factor
    if (solanaData.activeWallets > 10000) sentimentScore += 2;
    else if (solanaData.activeWallets > 5000) sentimentScore += 1;

    // Internal activity factor
    if (internalData.uniqueWallets > 20) sentimentScore += 2;
    else if (internalData.uniqueWallets > 10) sentimentScore += 1;

    // Twitter buzz factor
    const cryptoHashtags = twitterData.filter(tag => 
      tag.toLowerCase().includes('crypto') || 
      tag.toLowerCase().includes('solana') ||
      tag.toLowerCase().includes('defi')
    );
    if (cryptoHashtags.length > 3) sentimentScore += 2;
    else if (cryptoHashtags.length > 0) sentimentScore += 1;

    // Determine sentiment
    let sentiment: MarketMetrics['marketSentiment'] = 'neutral';
    if (sentimentScore >= 5) sentiment = 'bullish';
    else if (sentimentScore <= 2) sentiment = 'bearish';

    // Decide if we should recommend minting
    const recommendMint = 
      sentiment === 'bullish' &&
      internalData.hoursSinceLastMint >= 24 &&
      internalData.uniqueWallets > 10;

    // Calculate confidence
    const confidence = Math.min(1, sentimentScore / 8);

    return {
      solanaVolume24h: solanaData.volume24h,
      activeWallets: solanaData.activeWallets,
      trendingHashtags: twitterData,
      marketSentiment: sentiment,
      recommendMint,
      confidence
    };
  }

  /**
   * Log analysis to database
   */
  private async logAnalysis(metrics: MarketMetrics): Promise<void> {
    try {
      await supabase.from('protocol_activity').insert([{
        activity_type: 'market_analysis',
        description: `Market: ${metrics.marketSentiment} | Confidence: ${(metrics.confidence * 100).toFixed(0)}%`,
        metadata: {
          metrics,
          timestamp: new Date().toISOString()
        } as any
      }]);
    } catch (error) {
      console.error('[MARKET ANALYZER] Error logging:', error);
    }
  }

  /**
   * Get current market summary
   */
  async getSummary(): Promise<string> {
    const metrics = await this.analyze();
    
    return `Market is ${metrics.marketSentiment.toUpperCase()} (${(metrics.confidence * 100).toFixed(0)}% confidence) | ` +
           `Volume: $${(metrics.solanaVolume24h / 1000000).toFixed(2)}M | ` +
           `Active Wallets: ${metrics.activeWallets.toLocaleString()} | ` +
           `Trending: ${metrics.trendingHashtags.slice(0, 3).join(', ') || 'None'}`;
  }
}
