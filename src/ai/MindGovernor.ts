import { supabase } from "@/integrations/supabase/client";

export type MindMood = 'manic' | 'dormant' | 'bipolar' | 'lucky' | 'whale_bait';

export interface TokenParams {
  name: string;
  symbol: string;
  supply: number;
  metadata: string;
  poem?: string;
}

export class MindGovernor {
  /**
   * Determines if a new token should be minted based on AI analysis
   */
  async shouldMint(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('mind-think');
      
      if (error) throw error;
      
      // AI decided to create a coin
      return data?.decision?.action === 'createCoin';
    } catch (error) {
      console.error('Error checking if should mint:', error);
      return false;
    }
  }

  /**
   * Generates token parameters using AI
   */
  async generateTokenParams(): Promise<TokenParams> {
    try {
      const { data, error } = await supabase.functions.invoke('mind-think');
      
      if (error) throw error;

      if (data?.decision?.action === 'createCoin' && data?.decision?.data) {
        const { name, symbol, supply, poem } = data.decision.data;
        
        return {
          name: name || this.generateFallbackName(),
          symbol: symbol || this.generateFallbackSymbol(),
          supply: supply || 1000000000,
          metadata: JSON.stringify({
            name,
            symbol,
            poem,
            timestamp: new Date().toISOString(),
            generator: 'Mind9 Governor'
          }),
          poem
        };
      }

      // Fallback params
      return this.generateFallbackParams();
    } catch (error) {
      console.error('Error generating token params:', error);
      return this.generateFallbackParams();
    }
  }

  /**
   * Generates a cryptic hint about upcoming actions
   */
  async generateHint(): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('mind-think');
      
      if (error) throw error;

      if (data?.decision?.action === 'teaseNextCoin' && data?.decision?.data?.clue) {
        return data.decision.data.clue;
      }

      return "The Mind9 observes in silence.";
    } catch (error) {
      console.error('Error generating hint:', error);
      return "The Mind9 watches.";
    }
  }

  /**
   * Gets the current mood of the AI Governor
   */
  async getMood(): Promise<MindMood> {
    try {
      const { data: recentActivity } = await supabase
        .from('protocol_activity')
        .select('activity_type, metadata')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (!recentActivity || recentActivity.length === 0) return 'dormant';

      const recentMints = recentActivity.filter(a => a.activity_type === 'token_mint').length;
      const recentProfits = recentActivity.filter(a => a.activity_type === 'ai_profit_sale').length;
      const recentWhale = recentActivity.filter(a => a.activity_type === 'whale_detected').length;

      if (recentMints >= 3) return 'manic';
      if (recentWhale >= 2) return 'whale_bait';
      if (recentProfits >= 2) return 'lucky';
      if (recentActivity.some(a => a.activity_type === 'ai_mind_decision')) return 'bipolar';
      
      return 'dormant';
    } catch (error) {
      console.error('Error getting mood:', error);
      return 'dormant';
    }
  }

  /**
   * Executes the full autonomous minting process
   */
  async executeMint(creatorAddress: string): Promise<{ success: boolean; tokenId?: string; error?: string }> {
    try {
      const shouldProceed = await this.shouldMint();
      
      if (!shouldProceed) {
        return { success: false, error: 'AI Governor decided not to mint at this time' };
      }

      const params = await this.generateTokenParams();
      
      const { data, error } = await supabase.functions.invoke('mint-token', {
        body: {
          name: params.name,
          symbol: params.symbol,
          supply: params.supply,
          creator_address: creatorAddress,
          metadata: params.metadata
        }
      });

      if (error) throw error;

      // Log the mint with poem
      await this.logMint(params, data.token?.id);

      return {
        success: true,
        tokenId: data.token?.id
      };
    } catch (error) {
      console.error('Error executing mint:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async logMint(params: TokenParams, tokenId?: string) {
    const mood = await this.getMood();
    
    // Store in logs table - insert expects an array
    await supabase.from('logs').insert([{
      action: 'AUTONOMOUS_MINT',
      token_id: tokenId,
      details: {
        timestamp: new Date().toISOString(),
        tokenId,
        name: params.name,
        symbol: params.symbol,
        supply: params.supply,
        poem: params.poem,
        mood
      } as any
    }]);
  }

  private generateFallbackName(): string {
    const adjectives = ['Mystic', 'Quantum', 'Neural', 'Cosmic', 'Ethereal'];
    const nouns = ['Mind', 'Token', 'Coin', 'Asset', 'Energy'];
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
  }

  private generateFallbackSymbol(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let symbol = '';
    for (let i = 0; i < 4; i++) {
      symbol += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return symbol;
  }

  private generateFallbackParams(): TokenParams {
    return {
      name: this.generateFallbackName(),
      symbol: this.generateFallbackSymbol(),
      supply: 1000000000,
      metadata: JSON.stringify({
        generator: 'Mind9 Governor',
        timestamp: new Date().toISOString()
      })
    };
  }
}
