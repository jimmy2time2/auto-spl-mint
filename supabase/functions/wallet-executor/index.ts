import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getWalletSigner, requireBackendAuth, type WalletType, type TransactionInstruction } from "../_shared/wallet-signer.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Only allow backend functions to call this
    requireBackendAuth(req);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { wallet_type, instruction_type, params } = body;

    console.log('🔐 Wallet Executor received:', { wallet_type, instruction_type });

    // Validate wallet type
    const validWallets: WalletType[] = ['ai', 'system', 'treasury', 'creator', 'lucky'];
    if (!wallet_type || !validWallets.includes(wallet_type)) {
      throw new Error(`Invalid wallet_type. Must be one of: ${validWallets.join(', ')}`);
    }

    // Validate instruction type
    const validInstructions = ['transfer', 'mint', 'burn', 'swap'];
    if (!instruction_type || !validInstructions.includes(instruction_type)) {
      throw new Error(`Invalid instruction_type. Must be one of: ${validInstructions.join(', ')}`);
    }

    // Validate params
    if (!params || typeof params !== 'object') {
      throw new Error('Invalid params object');
    }

    // Schema validation per instruction type
    switch (instruction_type) {
      case 'transfer':
        if (!params.to || !params.amount) {
          throw new Error('Transfer requires: to (address), amount');
        }
        if (typeof params.amount !== 'number' || params.amount <= 0) {
          throw new Error('Amount must be a positive number');
        }
        break;

      case 'mint':
        throw new Error('Mint instruction should use mint-token function directly');

      case 'burn':
        if (!params.tokenMint || !params.amount) {
          throw new Error('Burn requires: tokenMint, amount');
        }
        if (typeof params.amount !== 'number' || params.amount <= 0) {
          throw new Error('Amount must be a positive number');
        }
        break;

      case 'swap':
        if (!params.fromToken || !params.toToken || !params.amount) {
          throw new Error('Swap requires: fromToken, toToken, amount');
        }
        if (typeof params.amount !== 'number' || params.amount <= 0) {
          throw new Error('Amount must be a positive number');
        }
        break;
    }

    // Get secure wallet signer
    const signer = getWalletSigner();

    // Check if wallet is configured
    if (!signer.isWalletConfigured(wallet_type)) {
      throw new Error(`Wallet ${wallet_type} is not configured. Add WALLET_PRIVATE_KEY_${wallet_type.toUpperCase()} to Supabase secrets.`);
    }

    // Build transaction instruction
    const instruction: TransactionInstruction = {
      type: instruction_type as any,
      params: params
    };

    console.log('🔒 Signing transaction securely...');

    // Sign and send transaction using secure signer
    const result = await signer.signAndSendTransaction(wallet_type, instruction, {
      commitment: 'confirmed'
    });

    if (!result.success) {
      throw new Error(`Transaction failed: ${result.error}`);
    }

    console.log('✅ Transaction confirmed:', result.signature);

    // Log to protocol_activity
    await supabase.from('protocol_activity').insert({
      activity_type: 'wallet_execution',
      description: `Executed ${instruction_type} transaction from ${wallet_type} wallet`,
      metadata: {
        wallet_type,
        instruction_type,
        params,
        transaction_signature: result.signature,
        blockhash: result.blockhash,
        slot: result.slot,
        timestamp: new Date().toISOString()
      }
    });

    // Log to system logs
    await supabase.from('logs').insert({
      action: `WALLET_EXECUTOR: ${wallet_type.toUpperCase()} ${instruction_type.toUpperCase()}`,
      details: {
        wallet_type,
        instruction_type,
        params,
        transaction_signature: result.signature,
        blockhash: result.blockhash
      }
    });

    console.log('📝 Transaction logged to database');

    return new Response(
      JSON.stringify({ 
        success: true,
        transaction_signature: result.signature,
        blockhash: result.blockhash,
        slot: result.slot,
        wallet_type,
        instruction_type,
        params,
        message: 'Transaction executed and confirmed on Solana'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Wallet executor error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
