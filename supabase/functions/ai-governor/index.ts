import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 🧠 Mind9Governor - The autonomous AI that controls the entire economy
class Mind9Governor {
  private supabase: any;
  
  constructor(supabase: any) {
    this.supabase = supabase;
  }

  // 1. Handle token mint events
  async onTokenMint(wallet: string, tokenId: string, tokenAmount: number) {
    console.log(`[AI MIND] Token minted: ${tokenId} by ${wallet} amount: ${tokenAmount}`);
    
    try {
      // Log the AI observation
      await this.logAction('token_mint_observed', {
        wallet,
        tokenId,
        tokenAmount,
        timestamp: new Date().toISOString()
      });

      // Check if this wallet should be monitored for whale activity
      await this.detectWhaleActivity(wallet, { type: 'mint', tokenId, amount: tokenAmount });

      // Update DAO eligibility based on this mint
      await this.updateDAOEligibility(wallet, tokenId);

      return { success: true, action: 'token_mint_processed' };
    } catch (error) {
      console.error('[AI MIND ERROR] onTokenMint:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 2. Handle trade events (buy/sell)
  async onTrade(wallet: string, type: string, amount: number, tokenId: string) {
    console.log(`[AI MIND] Trade detected: ${type} by ${wallet} amount: ${amount}`);
    
    try {
      await this.logAction('trade_observed', {
        wallet,
        type,
        amount,
        tokenId,
        timestamp: new Date().toISOString()
      });

      // Check for whale activity
      await this.detectWhaleActivity(wallet, { type, tokenId, amount });

      // Update DAO eligibility
      await this.updateDAOEligibility(wallet, tokenId);

      return { success: true, action: 'trade_processed' };
    } catch (error) {
      console.error('[AI MIND ERROR] onTrade:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 3. Handle AI wallet profit events
  async onAIProfit(amount: number, tokenId: string) {
    console.log(`[AI MIND] AI Profit generated: ${amount} from token ${tokenId}`);
    
    try {
      // Trigger profit distribution via process-ai-profits function
      const { data: tokenData } = await this.supabase
        .from('tokens')
        .select('*, coin_distributions(*)')
        .eq('id', tokenId)
        .single();

      if (!tokenData) {
        throw new Error('Token not found');
      }

      // Get creator address from the token
      const creatorAddress = tokenData.mint_address || 'system';

      // The profit distribution logic will be handled by the process-ai-profits function
      await this.logAction('ai_profit_distributed', {
        amount,
        tokenId,
        creatorAddress,
        timestamp: new Date().toISOString()
      });

      // After profit distribution, trigger lucky wallet lottery
      await this.triggerLuckyWalletLottery(tokenId);

      return { success: true, action: 'ai_profit_processed' };
    } catch (error) {
      console.error('[AI MIND ERROR] onAIProfit:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 4. Detect whale activity
  async detectWhaleActivity(wallet: string, event: any) {
    console.log(`[AI MIND] Analyzing whale activity for ${wallet}`);
    
    try {
      const { type, tokenId, amount } = event;

      // Get token supply to calculate percentage
      const { data: tokenData } = await this.supabase
        .from('tokens')
        .select('supply')
        .eq('id', tokenId)
        .single();

      if (!tokenData) return { success: false, error: 'Token not found' };

      const percentageOfSupply = (Number(amount) / Number(tokenData.supply)) * 100;

      // Whale thresholds
      const WHALE_BUY_THRESHOLD = 5; // 5% of supply
      const WHALE_SELL_THRESHOLD = 3; // 3% of supply

      const isWhale = type === 'buy' 
        ? percentageOfSupply > WHALE_BUY_THRESHOLD
        : percentageOfSupply > WHALE_SELL_THRESHOLD;

      if (isWhale) {
        console.log(`[AI MIND] 🐋 WHALE DETECTED: ${wallet} ${type} ${percentageOfSupply.toFixed(2)}%`);
        
        await this.logAction('whale_detected', {
          wallet,
          type,
          amount,
          percentageOfSupply,
          tokenId,
          timestamp: new Date().toISOString()
        });

        // Update DAO eligibility - whales may be flagged
        const { error } = await this.supabase
          .from('dao_eligibility')
          .upsert({
            wallet_address: wallet,
            token_id: tokenId,
            whale_status: true,
            is_eligible: false,
            flagged_reason: `Whale ${type}: ${percentageOfSupply.toFixed(2)}% of supply`,
            last_activity: new Date().toISOString()
          });

        if (error) throw error;
      }

      return { success: true, isWhale };
    } catch (error) {
      console.error('[AI MIND ERROR] detectWhaleActivity:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 5. Update DAO eligibility
  async updateDAOEligibility(wallet: string, tokenId: string) {
    console.log(`[AI MIND] Updating DAO eligibility for ${wallet}`);
    
    try {
      // Get wallet activity
      const { data: activity } = await this.supabase
        .from('wallet_activity_log')
        .select('*')
        .eq('wallet_address', wallet)
        .eq('token_id', tokenId)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (!activity || activity.length === 0) {
        // New wallet - eligible by default
        await this.supabase
          .from('dao_eligibility')
          .upsert({
            wallet_address: wallet,
            token_id: tokenId,
            is_eligible: true,
            whale_status: false,
            last_activity: new Date().toISOString()
          });
        
        return { success: true, eligible: true };
      }

      // Check if wallet has been flagged as whale
      const { data: eligibility } = await this.supabase
        .from('dao_eligibility')
        .select('*')
        .eq('wallet_address', wallet)
        .eq('token_id', tokenId)
        .single();

      const isEligible = eligibility ? !eligibility.whale_status : true;

      await this.logAction('dao_eligibility_updated', {
        wallet,
        tokenId,
        isEligible,
        timestamp: new Date().toISOString()
      });

      return { success: true, eligible: isEligible };
    } catch (error) {
      console.error('[AI MIND ERROR] updateDAOEligibility:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 6. Trigger lucky wallet lottery
  async triggerLuckyWalletLottery(tokenId: string) {
    console.log(`[AI MIND] 🎰 Triggering lucky wallet lottery for token ${tokenId}`);
    
    try {
      // Get eligible wallets (recent activity, not whales)
      const { data: eligibleWallets } = await this.supabase
        .from('wallet_activity_log')
        .select('wallet_address, amount, timestamp')
        .eq('token_id', tokenId)
        .eq('is_whale_flagged', false)
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24h
        .limit(100);

      if (!eligibleWallets || eligibleWallets.length === 0) {
        console.log('[AI MIND] No eligible wallets for lottery');
        return { success: false, error: 'No eligible wallets' };
      }

      // Calculate weighted scores based on recency
      const scoredWallets = eligibleWallets.map(w => {
        const hoursAgo = (Date.now() - new Date(w.timestamp).getTime()) / (1000 * 60 * 60);
        const recencyScore = Math.max(0, 100 - hoursAgo);
        return { ...w, score: recencyScore };
      });

      // Weighted random selection
      const totalScore = scoredWallets.reduce((sum, w) => sum + w.score, 0);
      let random = Math.random() * totalScore;
      
      let luckyWallet = scoredWallets[0];
      for (const wallet of scoredWallets) {
        random -= wallet.score;
        if (random <= 0) {
          luckyWallet = wallet;
          break;
        }
      }

      console.log(`[AI MIND] 🎉 Lucky wallet selected: ${luckyWallet.wallet_address}`);

      // Record lucky wallet selection
      await this.supabase
        .from('lucky_wallet_selections')
        .insert({
          token_id: tokenId,
          wallet_address: luckyWallet.wallet_address,
          activity_score: luckyWallet.score,
          selection_timestamp: new Date().toISOString()
        });

      await this.logAction('lucky_wallet_selected', {
        tokenId,
        wallet: luckyWallet.wallet_address,
        score: luckyWallet.score,
        timestamp: new Date().toISOString()
      });

      return { success: true, luckyWallet: luckyWallet.wallet_address };
    } catch (error) {
      console.error('[AI MIND ERROR] triggerLuckyWalletLottery:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 7. Evaluate market conditions
  async evaluateMarketConditions() {
    console.log('[AI MIND] 📊 Evaluating market conditions...');
    
    try {
      // Get all active tokens
      const { data: tokens } = await this.supabase
        .from('tokens')
        .select('*, coin_distributions(*)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!tokens || tokens.length === 0) {
        console.log('[AI MIND] No tokens to evaluate');
        return { success: true, condition: 'no_tokens' };
      }

      // Calculate market metrics
      const totalVolume24h = tokens.reduce((sum, t) => sum + Number(t.volume_24h || 0), 0);
      const totalLiquidity = tokens.reduce((sum, t) => sum + Number(t.liquidity || 0), 0);
      const avgPrice = tokens.reduce((sum, t) => sum + Number(t.price || 0), 0) / tokens.length;

      const marketCondition = {
        totalTokens: tokens.length,
        totalVolume24h,
        totalLiquidity,
        avgPrice,
        trend: totalVolume24h > 1000 ? 'bullish' : totalVolume24h > 500 ? 'neutral' : 'bearish',
        timestamp: new Date().toISOString()
      };

      await this.logAction('market_evaluation', marketCondition);

      return { success: true, condition: marketCondition };
    } catch (error) {
      console.error('[AI MIND ERROR] evaluateMarketConditions:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 8. Decide whether to create a new coin
  async decideCoinCreation() {
    console.log('[AI MIND] 🤔 Deciding whether to create new coin...');
    
    try {
      // Check market conditions first
      const marketEval = await this.evaluateMarketConditions();
      
      if (!marketEval.success || !marketEval.condition) {
        return { success: false, decision: 'no_market_data' };
      }

      const condition = marketEval.condition as any;

      // Get last token created
      const { data: lastToken } = await this.supabase
        .from('tokens')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastToken) {
        const hoursSinceLastToken = (Date.now() - new Date(lastToken.created_at).getTime()) / (1000 * 60 * 60);
        
        // Don't create if last token was less than 12 hours ago
        if (hoursSinceLastToken < 12) {
          console.log(`[AI MIND] Too soon to create new token (${hoursSinceLastToken.toFixed(1)}h ago)`);
          return { success: true, decision: 'wait', reason: 'too_soon' };
        }
      }

      // Decision logic based on market conditions
      const shouldCreate = 
        condition.trend === 'bullish' || 
        condition.totalTokens < 5 ||
        (condition.totalVolume24h > 500 && condition.totalLiquidity > 1000);

      if (shouldCreate) {
        console.log('[AI MIND] ✅ Decision: CREATE NEW COIN');
        
        await this.logAction('coin_creation_decision', {
          decision: 'create',
          marketCondition: condition,
          timestamp: new Date().toISOString()
        });

        return { success: true, decision: 'create', marketCondition: condition };
      } else {
        console.log('[AI MIND] ⏸️ Decision: WAIT');
        
        await this.logAction('coin_creation_decision', {
          decision: 'wait',
          marketCondition: condition,
          timestamp: new Date().toISOString()
        });

        return { success: true, decision: 'wait', marketCondition: condition };
      }
    } catch (error) {
      console.error('[AI MIND ERROR] decideCoinCreation:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 9. Log all AI actions to database
  async logAction(type: string, data: any) {
    try {
      await this.supabase
        .from('protocol_activity')
        .insert({
          activity_type: `ai_mind_${type}`,
          description: `AI Mind: ${type}`,
          metadata: data,
          timestamp: new Date().toISOString()
        });

      console.log(`[AI MIND LOG] ${type}:`, data);
      return { success: true };
    } catch (error) {
      console.error('[AI MIND ERROR] logAction:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 10. Process natural language commands (for future AI integration)
  async processCommand(prompt: string, context?: any) {
    console.log(`[AI MIND] Processing command: "${prompt}"`);
    
    try {
      const lowerPrompt = prompt.toLowerCase();

      // Command routing
      if (lowerPrompt.includes('create') && (lowerPrompt.includes('coin') || lowerPrompt.includes('token'))) {
        return await this.decideCoinCreation();
      }
      
      if (lowerPrompt.includes('sell') && lowerPrompt.includes('profit')) {
        if (!context?.tokenId || !context?.amount) {
          return { success: false, error: 'Missing tokenId or amount in context' };
        }
        return await this.onAIProfit(context.amount, context.tokenId);
      }
      
      if (lowerPrompt.includes('lottery') || lowerPrompt.includes('lucky')) {
        if (!context?.tokenId) {
          return { success: false, error: 'Missing tokenId in context' };
        }
        return await this.triggerLuckyWalletLottery(context.tokenId);
      }
      
      if (lowerPrompt.includes('market') || lowerPrompt.includes('evaluate')) {
        return await this.evaluateMarketConditions();
      }

      return { success: false, error: 'Unknown command' };
    } catch (error) {
      console.error('[AI MIND ERROR] processCommand:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Main server handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const governor = new Mind9Governor(supabaseClient);
    const { action, data, prompt } = await req.json();

    console.log(`[AI GOVERNOR] Received action: ${action}`);

    let result;

    // Route actions to appropriate methods
    switch (action) {
      case 'token_mint':
        result = await governor.onTokenMint(data.wallet, data.tokenId, data.tokenAmount);
        break;
      
      case 'trade':
        result = await governor.onTrade(data.wallet, data.type, data.amount, data.tokenId);
        break;
      
      case 'ai_profit':
        result = await governor.onAIProfit(data.amount, data.tokenId);
        break;
      
      case 'detect_whale':
        result = await governor.detectWhaleActivity(data.wallet, data.event);
        break;
      
      case 'update_dao':
        result = await governor.updateDAOEligibility(data.wallet, data.tokenId);
        break;
      
      case 'lucky_lottery':
        result = await governor.triggerLuckyWalletLottery(data.tokenId);
        break;
      
      case 'evaluate_market':
        result = await governor.evaluateMarketConditions();
        break;
      
      case 'decide_creation':
        result = await governor.decideCoinCreation();
        break;
      
      case 'process_command':
        result = await governor.processCommand(prompt, data);
        break;
      
      default:
        result = { success: false, error: `Unknown action: ${action}` };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AI GOVERNOR ERROR]:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
