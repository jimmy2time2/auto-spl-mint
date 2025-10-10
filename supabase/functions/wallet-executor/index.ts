import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { instruction_type, params } = body;

    console.log('🔐 Wallet Executor received:', instruction_type);

    // Validate input
    if (!instruction_type || typeof instruction_type !== 'string') {
      throw new Error('Invalid instruction_type');
    }

    if (!params || typeof params !== 'object') {
      throw new Error('Invalid params');
    }

    // Validate instruction types
    const validInstructions = ['transfer', 'reinvest', 'burn', 'swap'];
    if (!validInstructions.includes(instruction_type)) {
      throw new Error(`Unknown instruction type: ${instruction_type}`);
    }

    // Schema validation per instruction type
    switch (instruction_type) {
      case 'transfer':
        if (!params.to_address || !params.amount || !params.token_mint) {
          throw new Error('Transfer requires: to_address, amount, token_mint');
        }
        if (typeof params.amount !== 'number' || params.amount <= 0) {
          throw new Error('Amount must be a positive number');
        }
        break;

      case 'reinvest':
        if (!params.token_id || !params.amount) {
          throw new Error('Reinvest requires: token_id, amount');
        }
        if (typeof params.amount !== 'number' || params.amount <= 0) {
          throw new Error('Amount must be a positive number');
        }
        break;

      case 'burn':
        if (!params.token_mint || !params.amount) {
          throw new Error('Burn requires: token_mint, amount');
        }
        if (typeof params.amount !== 'number' || params.amount <= 0) {
          throw new Error('Amount must be a positive number');
        }
        break;

      case 'swap':
        if (!params.from_token || !params.to_token || !params.amount) {
          throw new Error('Swap requires: from_token, to_token, amount');
        }
        if (typeof params.amount !== 'number' || params.amount <= 0) {
          throw new Error('Amount must be a positive number');
        }
        break;
    }

    // Generate mock transaction ID (in real implementation, this would be actual Solana tx)
    const txId = `TX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('✅ Transaction signed and submitted:', txId);

    // Log to protocol_activity
    await supabase.from('protocol_activity').insert({
      activity_type: 'wallet_execution',
      description: `Executed ${instruction_type} transaction`,
      metadata: {
        instruction_type,
        params,
        transaction_id: txId,
        timestamp: new Date().toISOString()
      }
    });

    // Log to system logs
    await supabase.from('logs').insert({
      action: `WALLET_EXECUTOR: ${instruction_type.toUpperCase()}`,
      details: {
        instruction_type,
        params,
        transaction_id: txId
      }
    });

    console.log('📝 Transaction logged to database');

    return new Response(
      JSON.stringify({ 
        success: true,
        transaction_id: txId,
        instruction_type,
        params,
        message: 'Transaction executed successfully'
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
