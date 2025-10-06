/**
 * Autonomous Heartbeat Scheduler
 * 
 * This module runs periodically to wake the AI Mind and execute autonomous decisions.
 * Can be triggered by CRON, manually, or via edge function.
 */

import { AIMindAgent } from "@/ai/agent";
import { CoinGovernor } from "@/ai/coinGovernor";
import { FundMonitor } from "@/ai/fundMonitor";
import { supabase } from "@/integrations/supabase/client";

export interface HeartbeatConfig {
  minHours: number;
  maxHours: number;
  enabled: boolean;
}

export class AutonomousHeartbeat {
  private agent: AIMindAgent;
  private governor: CoinGovernor;
  private fundMonitor: FundMonitor;
  private isRunning: boolean = false;
  private retryCount: number = 0;
  private readonly MAX_RETRIES = 3;
  
  private config: HeartbeatConfig = {
    minHours: 0.5, // 30 minutes
    maxHours: 0.5, // 30 minutes (fixed interval)
    enabled: true
  };

  constructor() {
    this.agent = new AIMindAgent();
    this.governor = new CoinGovernor();
    this.fundMonitor = new FundMonitor();
  }

  /**
   * Main execution loop - called by scheduler
   */
  async pulse(): Promise<void> {
    if (this.isRunning) {
      console.log('⏭️  [HEARTBEAT] Already running, skipping...');
      return;
    }

    console.log('💓 [HEARTBEAT] Starting autonomous pulse...');
    this.isRunning = true;

    try {
      // Log heartbeat
      await this.logHeartbeat('started');

      // 1. AI Mind analyzes and decides
      const decision = await this.agent.analyze();
      
      console.log('🎯 [HEARTBEAT] AI Decision:', decision.action);
      console.log('📊 [HEARTBEAT] Confidence:', decision.confidence);
      console.log('💭 [HEARTBEAT] Reasoning:', decision.reasoning);

      // 2. Execute the decision
      await this.executeDecision(decision);

      // 3. Log completion
      await this.logHeartbeat('completed', { decision });

      console.log('✅ [HEARTBEAT] Pulse complete');
      
    } catch (error) {
      console.error('❌ [HEARTBEAT ERROR]:', error);
      await this.logHeartbeat('error', { error: error instanceof Error ? error.message : 'Unknown' });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Execute AI decision
   */
  private async executeDecision(decision: any): Promise<void> {
    switch (decision.action) {
      case 'create_coin':
        await this.handleCoinCreation(decision);
        break;
      
      case 'tease_coin':
        await this.handleCoinTease(decision);
        break;
      
      case 'sell_profit':
        await this.handleProfitSale(decision);
        break;
      
      case 'lottery':
        await this.handleLottery(decision);
        break;
      
      case 'punish_whale':
        await this.handleWhalePunishment(decision);
        break;
      
      case 'wait':
        console.log('⏸️  [HEARTBEAT] AI decided to wait');
        break;
      
      default:
        console.log('❓ [HEARTBEAT] Unknown action:', decision.action);
    }
  }

  /**
   * Handle coin creation with retry logic
   */
  private async handleCoinCreation(decision: any): Promise<void> {
    console.log('🪙 [HEARTBEAT] Creating new coin...');

    const params = decision.data || {};
    
    // Try minting with retries
    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const result = await this.governor.launchCoin(params);

        if (result.success) {
          console.log('✅ [HEARTBEAT] Coin created:', result.tokenId);
          this.retryCount = 0; // Reset on success
          
          // Log the creation
          await supabase.from('protocol_activity').insert([{
            activity_type: 'autonomous_coin_creation',
            token_id: result.tokenId,
            description: `AI Mind created new token: ${params.name || 'Unknown'}`,
            metadata: {
              params,
              distribution: result.distribution,
              reasoning: decision.reasoning,
              attempt: attempt + 1
            }
          }]);
          
          return; // Success!
        } else {
          throw new Error(result.error || 'Mint failed');
        }
      } catch (error) {
        console.error(`❌ [HEARTBEAT] Mint attempt ${attempt + 1}/${this.MAX_RETRIES + 1} failed:`, error);
        
        if (attempt < this.MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ [HEARTBEAT] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error('❌ [HEARTBEAT] All mint attempts failed');
          
          // Log error
          await supabase.from('logs').insert([{
            action: 'MINT_FAILURE',
            details: {
              error: error instanceof Error ? error.message : 'Unknown',
              attempts: this.MAX_RETRIES + 1,
              timestamp: new Date().toISOString()
            } as any
          }]);
        }
      }
    }
  }

  /**
   * Handle coin tease/clue
   */
  private async handleCoinTease(decision: any): Promise<void> {
    console.log('🔮 [HEARTBEAT] Broadcasting clue...');

    const clue = decision.data?.clue || await this.agent.generateClue();
    await this.governor.broadcastClue(clue);

    console.log('✅ [HEARTBEAT] Clue broadcast:', clue);
  }

  /**
   * Handle AI profit sale
   */
  private async handleProfitSale(decision: any): Promise<void> {
    console.log('💰 [HEARTBEAT] Executing profit sale...');

    try {
      const { data, error } = await supabase.functions.invoke('ai-profit-sale', {
        body: {
          tokenId: decision.data?.tokenId,
          percentage: decision.data?.percentage || 30
        }
      });

      if (error) throw error;
      
      console.log('✅ [HEARTBEAT] Profit sale executed');
    } catch (error) {
      console.error('❌ [HEARTBEAT] Profit sale error:', error);
    }
  }

  /**
   * Handle lucky lottery
   */
  private async handleLottery(decision: any): Promise<void> {
    console.log('🎰 [HEARTBEAT] Running lucky lottery...');

    try {
      const { data, error } = await supabase.functions.invoke('select-lucky-wallet', {
        body: { tokenId: decision.data?.tokenId }
      });

      if (error) throw error;
      
      console.log('✅ [HEARTBEAT] Lottery complete');
    } catch (error) {
      console.error('❌ [HEARTBEAT] Lottery error:', error);
    }
  }

  /**
   * Handle whale punishment
   */
  private async handleWhalePunishment(decision: any): Promise<void> {
    console.log('🐋 [HEARTBEAT] Punishing whales...');

    const wallets = decision.data?.wallets || [];
    
    for (const wallet of wallets) {
      try {
        await supabase.from('dao_eligibility').upsert([{
          wallet_address: wallet,
          token_id: decision.data?.tokenId || '',
          is_eligible: false,
          whale_status: true,
          flagged_reason: 'AI Mind flagged as whale',
          last_activity: new Date().toISOString()
        }]);
      } catch (error) {
        console.error(`❌ [HEARTBEAT] Error flagging ${wallet}:`, error);
      }
    }

    console.log('✅ [HEARTBEAT] Whales flagged:', wallets.length);
  }

  /**
   * Log heartbeat to database
   */
  private async logHeartbeat(status: string, metadata?: any): Promise<void> {
    try {
      await supabase.from('logs').insert([{
        action: `HEARTBEAT_${status.toUpperCase()}`,
        details: {
          timestamp: new Date().toISOString(),
          status,
          ...metadata
        } as any
      }]);
    } catch (error) {
      console.error('[HEARTBEAT] Error logging:', error);
    }
  }

  /**
   * Get random interval in milliseconds
   */
  getRandomInterval(): number {
    const minMs = this.config.minHours * 60 * 60 * 1000;
    const maxMs = this.config.maxHours * 60 * 60 * 1000;
    
    return Math.floor(Math.random() * (maxMs - minMs) + minMs);
  }

  /**
   * Start continuous monitoring (for local/dev use)
   */
  async startContinuousMonitoring(): Promise<void> {
    console.log('🔄 [HEARTBEAT] Starting continuous monitoring...');
    
    while (this.config.enabled) {
      await this.pulse();
      
      const intervalMs = this.getRandomInterval();
      const intervalHours = (intervalMs / (1000 * 60 * 60)).toFixed(1);
      
      console.log(`⏰ [HEARTBEAT] Next pulse in ${intervalHours} hours`);
      
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.config.enabled = false;
    console.log('🛑 [HEARTBEAT] Stopped');
  }
}

// Export singleton instance
export const heartbeat = new AutonomousHeartbeat();

// Auto-start if in production
if (typeof window !== 'undefined') {
  console.log('🚀 [HEARTBEAT] Autonomous system initialized');
}
