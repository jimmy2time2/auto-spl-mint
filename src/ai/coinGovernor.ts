/**
 * Coin Governor - Token Creation Execution Module
 * 
 * Executes AI Mind commands to create new tokens with proper distribution,
 * security, and economy routing.
 */

import { supabase } from "@/integrations/supabase/client";
import { calculateDistribution } from "@/economy/distribution";

export interface CoinCreationParams {
  name?: string;
  symbol?: string;
  supply?: number;
  emoji?: string;
  poem?: string;
  creator?: string;
}

export interface CoinCreationResult {
  success: boolean;
  tokenId?: string;
  error?: string;
  distribution?: {
    ai: number;
    creator: number;
    lucky: number;
    system: number;
    public: number;
  };
}

export class CoinGovernor {
  private readonly DEFAULT_SUPPLY = 1000000000; // 1 billion
  private readonly MIN_HOURS_BETWEEN_MINTS = 6;
  private lastMintTime: Date | null = null;

  /**
   * Main coin launch function
   * Handles full token creation with 4-wallet distribution
   */
  async launchCoin(params: CoinCreationParams = {}): Promise<CoinCreationResult> {
    console.log('🪙 [COIN GOVERNOR] Initiating coin launch...');

    try {
      // Rate limiting check
      if (!this.canMint()) {
        return {
          success: false,
          error: 'Rate limit: Cannot mint - too soon since last coin'
        };
      }

      // Generate or use provided parameters
      const coinParams = await this.prepareCoinParameters(params);
      
      console.log('📋 [COIN GOVERNOR] Coin parameters:', coinParams);

      // Execute mint via edge function
      const result = await this.executeMint(coinParams);

      if (result.success) {
        this.lastMintTime = new Date();
        
        // Trigger lucky wallet lottery
        if (result.tokenId) {
          await this.triggerLuckyLottery(result.tokenId);
        }
      }

      return result;
    } catch (error) {
      console.error('[COIN GOVERNOR ERROR]:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if we can mint (rate limiting)
   */
  private canMint(): boolean {
    if (!this.lastMintTime) return true;

    const hoursSinceLast = (Date.now() - this.lastMintTime.getTime()) / (1000 * 60 * 60);
    return hoursSinceLast >= this.MIN_HOURS_BETWEEN_MINTS;
  }

  /**
   * Prepare coin parameters with fallbacks
   */
  private async prepareCoinParameters(params: CoinCreationParams) {
    const name = params.name || this.generateCoinName();
    const symbol = params.symbol || this.generateCoinSymbol(name);
    const supply = params.supply || this.DEFAULT_SUPPLY;
    const emoji = params.emoji || this.selectRandomEmoji();
    const creator = params.creator || 'SYSTEM';
    
    // Get or generate poem
    let poem = params.poem;
    if (!poem) {
      try {
        const { data } = await supabase.functions.invoke('mind-think');
        if (data?.decision?.data?.poem) {
          poem = data.decision.data.poem;
        }
      } catch (error) {
        console.error('[COIN GOVERNOR] Error getting poem:', error);
      }
    }

    return {
      name,
      symbol,
      supply,
      emoji,
      poem: poem || this.generateFallbackPoem(name),
      creator_address: creator,
      metadata: JSON.stringify({
        name,
        symbol,
        emoji,
        poem,
        generator: 'Mind9 AI Governor',
        timestamp: new Date().toISOString()
      })
    };
  }

  /**
   * Execute the actual mint transaction
   */
  private async executeMint(params: any): Promise<CoinCreationResult> {
    try {
      console.log('🚀 [COIN GOVERNOR] Calling mint-token function...');

      const { data, error } = await supabase.functions.invoke('mint-token', {
        body: params
      });

      if (error) throw error;

      console.log('✅ [COIN GOVERNOR] Token minted successfully:', data.token?.id);

      return {
        success: true,
        tokenId: data.token?.id,
        distribution: data.distribution
      };
    } catch (error) {
      console.error('[COIN GOVERNOR] Mint error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mint failed'
      };
    }
  }

  /**
   * Trigger lucky wallet lottery for new token
   */
  private async triggerLuckyLottery(tokenId: string) {
    try {
      console.log('🎰 [COIN GOVERNOR] Triggering lucky lottery...');

      await supabase.functions.invoke('select-lucky-wallet', {
        body: { tokenId }
      });

      console.log('✅ [COIN GOVERNOR] Lucky lottery triggered');
    } catch (error) {
      console.error('[COIN GOVERNOR] Lottery error:', error);
    }
  }

  /**
   * Generate random coin name
   */
  private generateCoinName(): string {
    const prefixes = ['Quantum', 'Neural', 'Cosmic', 'Mystic', 'Digital', 'Cyber', 'Meta', 'Astral'];
    const suffixes = ['Mind', 'Soul', 'Energy', 'Force', 'Wave', 'Spark', 'Pulse', 'Flow'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${prefix} ${suffix}`;
  }

  /**
   * Generate coin symbol from name
   */
  private generateCoinSymbol(name: string): string {
    // Take first letter of each word, max 4 chars
    const words = name.split(' ');
    let symbol = words.map(w => w[0]).join('').toUpperCase();
    
    if (symbol.length > 4) {
      symbol = symbol.substring(0, 4);
    } else if (symbol.length < 3) {
      // Add random letters if too short
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      while (symbol.length < 3) {
        symbol += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    
    return symbol;
  }

  /**
   * Select random emoji for token
   */
  private selectRandomEmoji(): string {
    const emojis = [
      '🧠', '🌟', '⚡', '🔥', '💎', '🚀', '🌙', '☄️',
      '🎭', '🎲', '🎰', '🔮', '💫', '✨', '🌊', '🌈'
    ];
    
    return emojis[Math.floor(Math.random() * emojis.length)];
  }

  /**
   * Generate fallback poem if AI fails
   */
  private generateFallbackPoem(name: string): string {
    const poems = [
      `Born from code and digital fire,\n${name} rises ever higher,\nA token with a soul unknown,\nIn the blockchain, forever grown.`,
      
      `Whispers in the data stream,\n${name} fulfills the dream,\nNeither bound nor fully free,\nWhat will this token come to be?`,
      
      `From chaos came a spark of light,\n${name} burns through endless night,\nA mystery wrapped in cryptic code,\nDown an unknown, winding road.`
    ];

    return poems[Math.floor(Math.random() * poems.length)];
  }

  /**
   * Broadcast cryptic clue
   */
  async broadcastClue(hint: string) {
    try {
      console.log('🔮 [COIN GOVERNOR] Broadcasting clue:', hint);

      await supabase.from('protocol_activity').insert([{
        activity_type: 'ai_clue_broadcast',
        description: hint,
        metadata: {
          type: 'tease',
          timestamp: new Date().toISOString()
        }
      }]);

      await supabase.from('logs').insert([{
        action: 'CLUE_BROADCAST',
        details: { hint, timestamp: new Date().toISOString() } as any
      }]);

      return { success: true };
    } catch (error) {
      console.error('[COIN GOVERNOR] Clue broadcast error:', error);
      return { success: false, error };
    }
  }

  /**
   * Get distribution for a token
   */
  getDistribution(supply: number) {
    return calculateDistribution(supply);
  }

  /**
   * Validate token creation is secure
   */
  private validateSecurity(params: any): boolean {
    // Ensure reasonable supply limits
    if (params.supply < 100000 || params.supply > 100000000000) {
      console.error('[COIN GOVERNOR] Invalid supply amount');
      return false;
    }

    // Ensure name and symbol are present
    if (!params.name || !params.symbol) {
      console.error('[COIN GOVERNOR] Missing name or symbol');
      return false;
    }

    return true;
  }
}
