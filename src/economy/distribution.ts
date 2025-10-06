/**
 * Token distribution configuration and utilities
 * Defines how tokens are allocated across different wallet types
 */

export interface DistributionConfig {
  ai: number;        // 7% - AI wallet
  creator: number;   // 5% - Creator wallet
  lucky: number;     // 3% - Lucky wallet (random selection)
  system: number;    // 2% - System wallet
  public: number;    // 83% - Public sale/distribution
}

export const DISTRIBUTION: DistributionConfig = {
  ai: 0.07,
  creator: 0.05,
  lucky: 0.03,
  system: 0.02,
  public: 0.83
};

export interface FeeConfig {
  creator: number;   // 1% - Creator fee on trades
  system: number;    // 1% - System fee on trades
}

export const TRADING_FEES: FeeConfig = {
  creator: 0.01,
  system: 0.01
};

export interface ProfitDistribution {
  reinvestment: number;  // 80% - Reinvest in protocol
  dao: number;           // 15% - DAO treasury
  lucky: number;         // 3% - Lucky wallet
  creator: number;       // 2% - Creator wallet
}

export const PROFIT_SPLIT: ProfitDistribution = {
  reinvestment: 0.80,
  dao: 0.15,
  lucky: 0.03,
  creator: 0.02
};

/**
 * Calculates token distribution amounts
 */
export function calculateDistribution(totalSupply: number): {
  ai: number;
  creator: number;
  lucky: number;
  system: number;
  public: number;
} {
  return {
    ai: totalSupply * DISTRIBUTION.ai,
    creator: totalSupply * DISTRIBUTION.creator,
    lucky: totalSupply * DISTRIBUTION.lucky,
    system: totalSupply * DISTRIBUTION.system,
    public: totalSupply * DISTRIBUTION.public
  };
}

/**
 * Calculates trading fees
 */
export function calculateTradingFees(amount: number): {
  creatorFee: number;
  systemFee: number;
  netAmount: number;
} {
  const creatorFee = amount * TRADING_FEES.creator;
  const systemFee = amount * TRADING_FEES.system;
  const netAmount = amount - creatorFee - systemFee;

  return { creatorFee, systemFee, netAmount };
}

/**
 * Calculates profit distribution
 */
export function calculateProfitSplit(profitAmount: number): {
  reinvestment: number;
  dao: number;
  lucky: number;
  creator: number;
} {
  return {
    reinvestment: profitAmount * PROFIT_SPLIT.reinvestment,
    dao: profitAmount * PROFIT_SPLIT.dao,
    lucky: profitAmount * PROFIT_SPLIT.lucky,
    creator: profitAmount * PROFIT_SPLIT.creator
  };
}

/**
 * Validates if an amount is within acceptable trading limits
 */
export function validateTradeAmount(
  amount: number,
  totalSupply: number,
  type: 'buy' | 'sell'
): { valid: boolean; reason?: string } {
  const percentage = (amount / totalSupply) * 100;

  if (type === 'buy' && percentage > 5) {
    return {
      valid: false,
      reason: 'Buy amount exceeds 5% of total supply - whale detected'
    };
  }

  if (type === 'sell' && percentage > 50) {
    return {
      valid: false,
      reason: 'Sell amount exceeds 50% of holdings - dump detected'
    };
  }

  return { valid: true };
}

/**
 * Tracks distribution for logging
 */
export interface DistributionLog {
  tokenId: string;
  totalSupply: number;
  distribution: ReturnType<typeof calculateDistribution>;
  timestamp: Date;
  blockchainTx?: string;
}

export function createDistributionLog(
  tokenId: string,
  totalSupply: number,
  blockchainTx?: string
): DistributionLog {
  return {
    tokenId,
    totalSupply,
    distribution: calculateDistribution(totalSupply),
    timestamp: new Date(),
    blockchainTx
  };
}
