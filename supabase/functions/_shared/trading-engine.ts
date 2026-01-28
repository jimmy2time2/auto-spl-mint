/**
 * TRADING ENGINE
 * Handles buy/sell via bonding curve mathematics
 */

export interface BondingCurveState {
  virtual_sol_reserve: number;
  virtual_token_reserve: number;
  real_sol_reserve: number;
  real_token_reserve: number;
  total_supply: number;
}

export interface TradeResult {
  tokenAmount: number;
  solAmount: number;
  price: number;
  slippage: number;
  fee: number;
  newCurveState: BondingCurveState;
}

export const TRADING_FEES = {
  total: 0.02, // 2% total fee
  creator: 0.01, // 1% to creator
  protocol: 0.01, // 1% to protocol
};

export class TradingEngine {
  private supabase: any;
  
  constructor(supabase: any) {
    this.supabase = supabase;
  }
  
  /**
   * Initialize a bonding curve for a new token
   */
  initCurve(totalSupply: number = 1000000000): BondingCurveState {
    return {
      virtual_sol_reserve: 30, // Initial virtual SOL
      virtual_token_reserve: 300000000000, // Initial virtual tokens
      real_sol_reserve: 0,
      real_token_reserve: totalSupply * 0.83, // 83% for public sale
      total_supply: totalSupply,
    };
  }
  
  /**
   * Calculate price at current curve state
   */
  getPrice(curve: BondingCurveState): number {
    return curve.virtual_sol_reserve / curve.virtual_token_reserve;
  }
  
  /**
   * Calculate expected output for a buy (SOL -> Token)
   */
  calculateBuyOutput(curve: BondingCurveState, solInput: number): TradeResult {
    const fee = solInput * TRADING_FEES.total;
    const solAfterFee = solInput - fee;
    
    // Constant product: x * y = k
    // dy = y * dx / (x + dx)
    const tokenOut = (curve.virtual_token_reserve * solAfterFee) / 
                     (curve.virtual_sol_reserve + solAfterFee);
    
    const expectedPrice = this.getPrice(curve);
    const actualPrice = solAfterFee / tokenOut;
    const slippage = ((actualPrice - expectedPrice) / expectedPrice) * 100;
    
    const newCurve: BondingCurveState = {
      ...curve,
      virtual_sol_reserve: curve.virtual_sol_reserve + solAfterFee,
      virtual_token_reserve: curve.virtual_token_reserve - tokenOut,
      real_sol_reserve: curve.real_sol_reserve + solAfterFee,
      real_token_reserve: curve.real_token_reserve - tokenOut,
    };
    
    return {
      tokenAmount: tokenOut,
      solAmount: solAfterFee,
      price: actualPrice,
      slippage,
      fee,
      newCurveState: newCurve,
    };
  }
  
  /**
   * Calculate expected output for a sell (Token -> SOL)
   */
  calculateSellOutput(curve: BondingCurveState, tokenInput: number): TradeResult {
    // dx = x * dy / (y + dy)
    const solOutBeforeFee = (curve.virtual_sol_reserve * tokenInput) / 
                             (curve.virtual_token_reserve + tokenInput);
    
    const fee = solOutBeforeFee * TRADING_FEES.total;
    const solOut = solOutBeforeFee - fee;
    
    const expectedPrice = this.getPrice(curve);
    const actualPrice = solOut / tokenInput;
    const slippage = ((expectedPrice - actualPrice) / expectedPrice) * 100;
    
    const newCurve: BondingCurveState = {
      ...curve,
      virtual_sol_reserve: curve.virtual_sol_reserve - solOutBeforeFee,
      virtual_token_reserve: curve.virtual_token_reserve + tokenInput,
      real_sol_reserve: curve.real_sol_reserve - solOutBeforeFee,
      real_token_reserve: curve.real_token_reserve + tokenInput,
    };
    
    return {
      tokenAmount: tokenInput,
      solAmount: solOut,
      price: actualPrice,
      slippage,
      fee,
      newCurveState: newCurve,
    };
  }
  
  /**
   * Execute a buy trade
   */
  async buy(
    tokenId: string,
    solAmount: number,
    walletAddress: string,
    maxSlippage: number = 5
  ): Promise<TradeResult> {
    // Get token and curve
    const { data: token, error: tokenError } = await this.supabase
      .from('tokens')
      .select('*, bonding_curve_data')
      .eq('id', tokenId)
      .single();
    
    if (tokenError || !token) {
      throw new Error('Token not found');
    }
    
    const curve = token.bonding_curve_data || this.initCurve(token.supply);
    
    // Calculate trade
    const result = this.calculateBuyOutput(curve, solAmount);
    
    // Check slippage
    if (result.slippage > maxSlippage) {
      throw new Error(`Slippage too high: ${result.slippage.toFixed(2)}% exceeds max ${maxSlippage}%`);
    }
    
    // Check if enough tokens available
    if (result.tokenAmount > curve.real_token_reserve) {
      throw new Error('Insufficient token liquidity');
    }
    
    // Update token with new curve state
    await this.supabase.from('tokens').update({
      price: this.getPrice(result.newCurveState),
      liquidity: result.newCurveState.real_sol_reserve,
      volume_24h: (token.volume_24h || 0) + solAmount,
      bonding_curve_data: result.newCurveState,
    }).eq('id', tokenId);
    
    // Log activity
    await this.supabase.from('wallet_activity_log').insert({
      wallet_address: walletAddress,
      token_id: tokenId,
      activity_type: 'buy',
      amount: result.tokenAmount,
      percentage_of_supply: (result.tokenAmount / token.supply) * 100,
    });
    
    // Log fees
    const creatorFee = result.fee * 0.5;
    const protocolFee = result.fee * 0.5;
    
    await this.supabase.from('trade_fees_log').insert({
      token_id: tokenId,
      trade_amount: solAmount,
      trade_type: 'buy',
      trader_address: walletAddress,
      creator_fee: creatorFee,
      system_fee: protocolFee,
    });
    
    return result;
  }
  
  /**
   * Execute a sell trade
   */
  async sell(
    tokenId: string,
    tokenAmount: number,
    walletAddress: string,
    maxSlippage: number = 5
  ): Promise<TradeResult> {
    // Get token and curve
    const { data: token, error: tokenError } = await this.supabase
      .from('tokens')
      .select('*, bonding_curve_data')
      .eq('id', tokenId)
      .single();
    
    if (tokenError || !token) {
      throw new Error('Token not found');
    }
    
    const curve = token.bonding_curve_data || this.initCurve(token.supply);
    
    // Calculate trade
    const result = this.calculateSellOutput(curve, tokenAmount);
    
    // Check slippage
    if (result.slippage > maxSlippage) {
      throw new Error(`Slippage too high: ${result.slippage.toFixed(2)}% exceeds max ${maxSlippage}%`);
    }
    
    // Check if enough SOL available
    if (result.solAmount > curve.real_sol_reserve) {
      throw new Error('Insufficient SOL liquidity');
    }
    
    // Update token with new curve state
    await this.supabase.from('tokens').update({
      price: this.getPrice(result.newCurveState),
      liquidity: result.newCurveState.real_sol_reserve,
      volume_24h: (token.volume_24h || 0) + result.solAmount,
      bonding_curve_data: result.newCurveState,
    }).eq('id', tokenId);
    
    // Log activity
    await this.supabase.from('wallet_activity_log').insert({
      wallet_address: walletAddress,
      token_id: tokenId,
      activity_type: 'sell',
      amount: tokenAmount,
      percentage_of_supply: (tokenAmount / token.supply) * 100,
    });
    
    // Log fees
    const creatorFee = result.fee * 0.5;
    const protocolFee = result.fee * 0.5;
    
    await this.supabase.from('trade_fees_log').insert({
      token_id: tokenId,
      trade_amount: result.solAmount,
      trade_type: 'sell',
      trader_address: walletAddress,
      creator_fee: creatorFee,
      system_fee: protocolFee,
    });
    
    return result;
  }
  
  /**
   * Get market cap at current price
   */
  getMarketCap(curve: BondingCurveState): number {
    const price = this.getPrice(curve);
    return price * curve.total_supply;
  }
  
  /**
   * Check if token has graduated (reached target market cap)
   */
  hasGraduated(curve: BondingCurveState, targetSol: number = 69): boolean {
    return curve.real_sol_reserve >= targetSol;
  }
}
