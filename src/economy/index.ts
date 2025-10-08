/**
 * Economy System - Central Exports
 * 
 * Complete 4-wallet token economy implementation
 * All modules for distribution, fees, profits, and validation
 */

// Configuration
export { WALLETS, getWalletAddress, isProtocolWallet, getAllProtocolWallets } from './wallets';
export type { WalletConfig } from './wallets';

// Distribution & Fees
export {
  DISTRIBUTION,
  TRADING_FEES,
  PROFIT_SPLIT,
  calculateDistribution,
  calculateTradingFees,
  calculateProfitSplit,
  validateTradeAmount,
  createDistributionLog
} from './distribution';

export type {
  DistributionConfig,
  FeeConfig,
  ProfitDistribution,
  DistributionLog
} from './distribution';

/**
 * Quick Reference:
 * 
 * Token Mint Distribution:
 * - AI Wallet: 7%
 * - Creator Wallet: 5%
 * - Lucky Wallet: 3% (random active user)
 * - System Wallet: 2%
 * - Public Supply: 83%
 * 
 * Trading Fees (2% total):
 * - Creator: 1%
 * - System: 1%
 * 
 * AI Profit Split:
 * - Reinvestment: 80%
 * - DAO Treasury: 15%
 * - Creator: 2%
 * - Lucky Wallet: 3%
 * 
 * Anti-Whale Protection:
 * - Max Buy: 5% of supply
 * - Max Sell: 50% of holdings
 */
