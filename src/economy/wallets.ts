/**
 * Wallet Configuration for Token Economy
 * Centralized wallet addresses for all protocol operations
 */

export interface WalletConfig {
  ai: string;
  creator: string;
  system: string;
  dao: string;
}

/**
 * Protocol Wallet Addresses
 * These wallets receive allocations based on the economy rules
 */
export const WALLETS: WalletConfig = {
  // AI Wallet - Receives 7% on mint, manages autonomous trading
  ai: 'AI_WALLET_7PCT',
  
  // Creator Wallet - Receives 5% on mint + 1% trade fees + 2% AI profits
  creator: 'CREATOR_WALLET_5PCT',
  
  // System Wallet - Receives 2% on mint + 1% trade fees
  system: 'SYSTEM_WALLET_2PCT',
  
  // DAO Treasury - Receives 15% of AI profits
  dao: 'DAO_TREASURY_15PCT'
};

/**
 * Lucky Wallet is NOT a fixed address
 * It's dynamically selected from active traders
 * See: supabase/functions/select-lucky-wallet/index.ts
 */

/**
 * Get wallet address by type
 */
export function getWalletAddress(type: keyof WalletConfig): string {
  return WALLETS[type];
}

/**
 * Validate if an address is a protocol wallet
 */
export function isProtocolWallet(address: string): boolean {
  return Object.values(WALLETS).includes(address);
}

/**
 * Get all protocol wallet addresses
 */
export function getAllProtocolWallets(): string[] {
  return Object.values(WALLETS);
}
