/**
 * Wallet Signer Integration Examples
 * 
 * This file shows how AI functions and other backend services
 * should integrate with the secure wallet signer.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * Example 1: AI Decision Engine calling wallet executor for token operations
 */
export async function aiMintTokenExample() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // AI decides to transfer funds for a new token launch
  const { data, error } = await supabase.functions.invoke('wallet-executor', {
    body: {
      wallet_type: 'ai',
      instruction_type: 'transfer',
      params: {
        to: 'NEW_TOKEN_MINT_AUTHORITY',
        amount: 0.1  // SOL for token creation
      }
    }
  });

  if (error) {
    console.error('Transfer failed:', error);
    return null;
  }

  console.log('✅ Funds transferred:', data.transaction_signature);
  return data;
}

/**
 * Example 2: Profit redistribution using wallet executor
 */
export async function redistributeProfitsExample() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const profitAmount = 0.5; // Example: 0.5 SOL profit

  // Distribution: 80% reinvest, 15% DAO, 3% lucky, 2% creator
  const distributions = [
    { wallet: 'system', amount: profitAmount * 0.80, desc: 'Reinvestment' },
    { wallet: 'treasury', amount: profitAmount * 0.15, desc: 'DAO Treasury' },
    { wallet: 'lucky', amount: profitAmount * 0.03, desc: 'Lucky Lottery' },
    { wallet: 'creator', amount: profitAmount * 0.02, desc: 'Creator Rewards' }
  ];

  const results = [];

  for (const dist of distributions) {
    const { data, error } = await supabase.functions.invoke('wallet-executor', {
      body: {
        wallet_type: 'ai',  // From AI wallet
        instruction_type: 'transfer',
        params: {
          to: `${dist.wallet.toUpperCase()}_WALLET_ADDRESS`,
          amount: dist.amount
        }
      }
    });

    if (error) {
      console.error(`${dist.desc} transfer failed:`, error);
    } else {
      console.log(`✅ ${dist.desc}: ${dist.amount} SOL`, data.transaction_signature);
      results.push({ ...dist, signature: data.transaction_signature });
    }
  }

  return results;
}

/**
 * Example 3: Token burning operation
 */
export async function burnTokenExample(tokenMint: string, amount: number) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.functions.invoke('wallet-executor', {
    body: {
      wallet_type: 'ai',
      instruction_type: 'burn',
      params: {
        tokenMint: tokenMint,
        amount: amount
      }
    }
  });

  if (error) {
    console.error('Token burn failed:', error);
    return null;
  }

  console.log('🔥 Tokens burned:', data.transaction_signature);
  return data;
}

/**
 * Example 4: Safe way to check wallet balance before operations
 */
export async function checkWalletBalanceExample() {
  // Import the signer directly (only in backend functions)
  const { getWalletSigner } = await import('./wallet-signer.ts');
  
  const signer = getWalletSigner();
  
  // Check if wallets are configured
  const wallets: Array<'ai' | 'system' | 'treasury' | 'creator' | 'lucky'> = 
    ['ai', 'system', 'treasury', 'creator', 'lucky'];
  
  const balances: Record<string, number | null> = {};
  
  for (const wallet of wallets) {
    try {
      if (signer.isWalletConfigured(wallet)) {
        balances[wallet] = await signer.getBalance(wallet);
      } else {
        balances[wallet] = null;
      }
    } catch (error) {
      console.error(`Failed to get ${wallet} balance:`, error);
      balances[wallet] = null;
    }
  }
  
  console.log('💰 Wallet Balances:', balances);
  return balances;
}

/**
 * Example 5: Transaction verification for auditing
 */
export async function verifyTransactionExample(signature: string) {
  const { getWalletSigner } = await import('./wallet-signer.ts');
  const signer = getWalletSigner();
  
  const isValid = await signer.verifyTransaction(signature);
  
  if (isValid) {
    console.log('✅ Transaction verified:', signature);
  } else {
    console.log('❌ Transaction invalid or not found:', signature);
  }
  
  return isValid;
}

/**
 * Example 6: How AI Decision Engine should integrate
 */
export async function aiDecisionEngineIntegration() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. AI makes decision to mint
  console.log('🤖 AI deciding to mint new token...');

  // 2. Check AI wallet has sufficient funds
  const { getWalletSigner } = await import('./wallet-signer.ts');
  const signer = getWalletSigner();
  const balance = await signer.getBalance('ai');
  
  if (balance < 0.1) {
    console.error('❌ Insufficient AI wallet balance');
    return null;
  }

  // 3. Call mint-token function (existing)
  const { data: mintResult, error: mintError } = await supabase.functions.invoke('mint-token', {
    body: {
      name: 'AI Generated Token',
      symbol: 'AIGT',
      supply: 1000000,
      creator_address: 'AI_DECISION_ENGINE'
    }
  });

  if (mintError) {
    console.error('Mint failed:', mintError);
    return null;
  }

  // 4. Optional: Transfer initial liquidity using wallet executor
  const { data: liquidityResult } = await supabase.functions.invoke('wallet-executor', {
    body: {
      wallet_type: 'system',
      instruction_type: 'transfer',
      params: {
        to: mintResult.token.pool_address,
        amount: 0.5  // Initial liquidity
      }
    }
  });

  console.log('✅ Token minted with liquidity:', {
    token: mintResult.token,
    liquidity_tx: liquidityResult?.transaction_signature
  });

  return {
    token: mintResult.token,
    liquidity_transaction: liquidityResult?.transaction_signature
  };
}

/**
 * Best Practices Summary:
 * 
 * DO:
 * ✅ Always use wallet-executor for any transaction signing
 * ✅ Check wallet balances before operations
 * ✅ Log all transactions to protocol_activity
 * ✅ Use service role key for backend calls
 * ✅ Verify critical transactions after sending
 * ✅ Handle errors gracefully
 * 
 * DON'T:
 * ❌ Never expose private keys to frontend or AI prompts
 * ❌ Never hardcode wallet addresses
 * ❌ Never skip input validation
 * ❌ Never assume transactions succeed without checking
 * ❌ Never call wallet-executor from frontend
 * ❌ Never commit secrets to git
 */
