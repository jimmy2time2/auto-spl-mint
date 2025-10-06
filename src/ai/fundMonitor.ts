/**
 * Fund Monitor - Wallet Balance Tracking
 * 
 * Monitors AI wallet and system wallet balances
 * Alerts when funds are low and pauses minting if necessary
 */

import { supabase } from "@/integrations/supabase/client";

export interface WalletStatus {
  address: string;
  balance: number;
  isLow: boolean;
  threshold: number;
}

export interface FundStatus {
  aiWallet: WalletStatus;
  systemWallet: WalletStatus;
  canMint: boolean;
  alerts: string[];
}

export class FundMonitor {
  private readonly AI_WALLET_THRESHOLD = 1000; // Minimum balance for AI wallet
  private readonly SYSTEM_WALLET_THRESHOLD = 500; // Minimum balance for system wallet
  
  /**
   * Check all wallet balances
   */
  async checkFunds(): Promise<FundStatus> {
    console.log('💰 [FUND MONITOR] Checking wallet balances...');

    try {
      const aiWallet = await this.checkWallet('ai_wallet', this.AI_WALLET_THRESHOLD);
      const systemWallet = await this.checkWallet('system_wallet', this.SYSTEM_WALLET_THRESHOLD);

      const alerts: string[] = [];
      
      if (aiWallet.isLow) {
        alerts.push(`⚠️ AI Wallet balance low: ${aiWallet.balance}`);
      }
      
      if (systemWallet.isLow) {
        alerts.push(`⚠️ System Wallet balance low: ${systemWallet.balance}`);
      }

      const canMint = !aiWallet.isLow && !systemWallet.isLow;

      if (!canMint) {
        console.warn('[FUND MONITOR] ❌ Cannot mint - insufficient funds');
        await this.logLowFundsAlert(aiWallet, systemWallet);
      }

      return {
        aiWallet,
        systemWallet,
        canMint,
        alerts
      };
    } catch (error) {
      console.error('[FUND MONITOR ERROR]:', error);
      
      // On error, assume we can't mint (fail safe)
      return {
        aiWallet: { address: 'unknown', balance: 0, isLow: true, threshold: this.AI_WALLET_THRESHOLD },
        systemWallet: { address: 'unknown', balance: 0, isLow: true, threshold: this.SYSTEM_WALLET_THRESHOLD },
        canMint: false,
        alerts: ['Error checking wallet balances']
      };
    }
  }

  /**
   * Check individual wallet balance
   */
  private async checkWallet(walletType: string, threshold: number): Promise<WalletStatus> {
    try {
      // Map internal wallet types to database enum
      type WalletType = "creator" | "lucky_distributor" | "public_lucky" | "router" | "treasury";
      
      const walletTypeMap: Record<string, WalletType> = {
        'ai_wallet': 'treasury',
        'system_wallet': 'router'
      };
      
      const dbWalletType = walletTypeMap[walletType] || 'treasury';
      
      // Get wallet info from database
      const { data: wallet } = await supabase
        .from('wallets')
        .select('address, balance')
        .eq('type', dbWalletType)
        .single();

      if (!wallet) {
        throw new Error(`Wallet not found: ${walletType}`);
      }

      const balance = Number(wallet.balance || 0);
      const isLow = balance < threshold;

      return {
        address: wallet.address,
        balance,
        isLow,
        threshold
      };
    } catch (error) {
      console.error(`[FUND MONITOR] Error checking ${walletType}:`, error);
      return {
        address: 'error',
        balance: 0,
        isLow: true,
        threshold
      };
    }
  }

  /**
   * Log low funds alert
   */
  private async logLowFundsAlert(aiWallet: WalletStatus, systemWallet: WalletStatus): Promise<void> {
    try {
      await supabase.from('protocol_activity').insert([{
        activity_type: 'low_funds_alert',
        description: 'Minting paused due to low wallet balances',
        metadata: {
          aiWallet: {
            balance: aiWallet.balance,
            threshold: aiWallet.threshold,
            isLow: aiWallet.isLow
          },
          systemWallet: {
            balance: systemWallet.balance,
            threshold: systemWallet.threshold,
            isLow: systemWallet.isLow
          },
          timestamp: new Date().toISOString()
        } as any
      }]);

      await supabase.from('logs').insert([{
        action: 'LOW_FUNDS_ALERT',
        details: {
          aiWallet: aiWallet.balance,
          systemWallet: systemWallet.balance,
          timestamp: new Date().toISOString()
        } as any
      }]);

      console.error('[FUND MONITOR] 🚨 LOW FUNDS ALERT SENT');
    } catch (error) {
      console.error('[FUND MONITOR] Error logging alert:', error);
    }
  }

  /**
   * Get current fund status summary
   */
  async getSummary(): Promise<string> {
    const status = await this.checkFunds();
    
    return `AI Wallet: ${status.aiWallet.balance.toFixed(2)} | ` +
           `System Wallet: ${status.systemWallet.balance.toFixed(2)} | ` +
           `Can Mint: ${status.canMint ? 'YES' : 'NO'}`;
  }

  /**
   * Force check and send alerts if needed
   */
  async checkAndAlert(): Promise<boolean> {
    const status = await this.checkFunds();
    
    if (!status.canMint) {
      console.error('[FUND MONITOR] 🚨 CRITICAL: Minting disabled due to low funds');
      // In production, send email/SMS/Discord alert here
      return false;
    }

    return true;
  }
}
