import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, data, prompt } = await req.json();
    console.log(`[AI GOVERNOR] Action: ${action}`);

    // Security validation - validate all parameters before execution
    let securityValidated = true;
    let validationErrors: string[] = [];

    if (action === 'decide_creation' && data) {
      // Validate token creation parameters
      if (data.name && data.name.length < 2) {
        validationErrors.push('Token name too short');
        securityValidated = false;
      }
      if (data.symbol && (data.symbol.length < 2 || !/^[A-Z0-9]+$/.test(data.symbol))) {
        validationErrors.push('Invalid token symbol');
        securityValidated = false;
      }
      if (data.supply && (data.supply < 1000 || data.supply > 1000000000000)) {
        validationErrors.push('Token supply out of valid range');
        securityValidated = false;
      }
    }

    if (!securityValidated) {
      console.error('[AI GOVERNOR] Security validation failed:', validationErrors);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Security validation failed',
          errors: validationErrors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    // Route to appropriate handler
    if (action === 'token_mint') {
      result = await handleTokenMint(supabase, data);
    } else if (action === 'trade') {
      result = await handleTrade(supabase, data);
    } else if (action === 'ai_profit') {
      result = await handleAIProfit(supabase, data);
    } else if (action === 'detect_whale') {
      result = await detectWhale(supabase, data);
    } else if (action === 'update_dao') {
      result = await updateDAO(supabase, data);
    } else if (action === 'lucky_lottery') {
      result = await luckyLottery(supabase, data);
    } else if (action === 'evaluate_market') {
      result = await evaluateMarket(supabase);
    } else if (action === 'decide_creation') {
      result = await decideCoinCreation(supabase);
    } else if (action === 'process_command') {
      result = await processCommand(supabase, prompt, data);
    } else {
      result = { success: false, error: `Unknown action: ${action}` };
    }

    const executionTime = Date.now() - startTime;

    // Log execution to ai_governor_log
    await supabase.from('ai_governor_log').insert({
      prompt_input: prompt || action,
      action_taken: action,
      result: result,
      security_validated: securityValidated,
      execution_time_ms: executionTime,
      error_message: result.success ? null : (result.error || 'Unknown error')
    });

    console.log(`[AI GOVERNOR] Completed in ${executionTime}ms`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[AI GOVERNOR ERROR]:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Handler functions
async function handleTokenMint(supabase: any, data: any) {
  console.log(`[AI MIND] Token minted: ${data.tokenId}`);
  
  try {
    await logAction(supabase, 'token_mint_observed', data);
    await detectWhale(supabase, { wallet: data.wallet, event: { type: 'mint', tokenId: data.tokenId, amount: data.tokenAmount } });
    await updateDAO(supabase, { wallet: data.wallet, tokenId: data.tokenId });
    
    return { success: true, action: 'token_mint_processed' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

async function handleTrade(supabase: any, data: any) {
  console.log(`[AI MIND] Trade: ${data.type}`);
  
  try {
    const { wallet, type, amount, tokenId } = data;

    // MANDATORY 2% TRADING FEE LOGIC
    const creatorFee = Number(amount) * 0.01; // 1% to creator
    const systemFee = Number(amount) * 0.01;  // 1% to system (AI)
    const netAmount = Number(amount) - creatorFee - systemFee;

    console.log(`[AI MIND] 💰 Fee breakdown: Creator=${creatorFee}, System=${systemFee}, Net=${netAmount}`);

    // Get creator address from token
    const { data: tokenData } = await supabase
      .from('tokens')
      .select('mint_address')
      .eq('id', tokenId)
      .single();

    const creatorAddress = tokenData?.mint_address || 'system_default';
    const systemAddress = Deno.env.get('SYSTEM_WALLET_ADDRESS') || 'system_ai_wallet';

    // Log fees to trade_fees_log
    const { error: feeLogError } = await supabase
      .from('trade_fees_log')
      .insert({
        token_id: tokenId,
        trader_address: wallet,
        trade_type: type,
        trade_amount: amount,
        creator_fee: creatorFee,
        system_fee: systemFee,
        transaction_hash: `TX_${crypto.randomUUID()}`,
        timestamp: new Date().toISOString()
      });

    if (feeLogError) {
      console.error('[AI MIND] Fee log error:', feeLogError);
    }

    // Record creator profit
    const { error: creatorProfitError } = await supabase
      .from('creator_wallet_profits')
      .insert({
        token_id: tokenId,
        creator_address: creatorAddress,
        profit_source: `trade_${type}_fee`,
        amount: creatorFee,
        transaction_hash: `TX_${crypto.randomUUID()}`,
        timestamp: new Date().toISOString()
      });

    if (creatorProfitError) {
      console.error('[AI MIND] Creator profit error:', creatorProfitError);
    }

    // Log all activity
    await logAction(supabase, 'trade_observed', {
      wallet,
      type,
      amount,
      netAmount,
      fees: { creator: creatorFee, system: systemFee },
      tokenId
    });

    // Detect whale activity based on net amount
    await detectWhale(supabase, { 
      wallet, 
      event: { type, tokenId, amount: netAmount } 
    });

    // Update DAO eligibility
    await updateDAO(supabase, { wallet, tokenId });

    // If this is an AI wallet sell, trigger profit distribution
    if (type === 'sell' && wallet === systemAddress) {
      console.log('[AI MIND] 🤖 AI Wallet selling - triggering profit split');
      await handleAIProfit(supabase, { amount: netAmount, tokenId });
    }
    
    return { 
      success: true, 
      action: 'trade_processed',
      fees: { creator: creatorFee, system: systemFee },
      netAmount 
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

async function handleAIProfit(supabase: any, data: any) {
  console.log(`[AI MIND] AI Profit: ${data.amount}`);
  
  try {
    const { data: tokenData } = await supabase.from('tokens').select('mint_address').eq('id', data.tokenId).single();
    
    await logAction(supabase, 'ai_profit_distributed', {
      amount: data.amount,
      tokenId: data.tokenId,
      creatorAddress: tokenData?.mint_address || 'system'
    });
    
    await luckyLottery(supabase, { tokenId: data.tokenId });
    
    return { success: true, action: 'ai_profit_processed' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

async function detectWhale(supabase: any, data: any) {
  console.log(`[AI MIND] Analyzing whale activity`);
  
  try {
    const { wallet, event } = data;
    const { type, tokenId, amount } = event;

    const { data: tokenData } = await supabase.from('tokens').select('supply').eq('id', tokenId).single();
    if (!tokenData) return { success: false, error: 'Token not found' };

    const percentageOfSupply = (Number(amount) / Number(tokenData.supply)) * 100;
    const WHALE_BUY_THRESHOLD = 5;
    const WHALE_SELL_THRESHOLD = 3;
    const isWhale = type === 'buy' ? percentageOfSupply > WHALE_BUY_THRESHOLD : percentageOfSupply > WHALE_SELL_THRESHOLD;

    if (isWhale) {
      console.log(`[AI MIND] 🐋 WHALE DETECTED: ${wallet}`);
      
      await logAction(supabase, 'whale_detected', { wallet, type, amount, percentageOfSupply, tokenId });
      
      await supabase.from('dao_eligibility').upsert({
        wallet_address: wallet,
        token_id: tokenId,
        whale_status: true,
        is_eligible: false,
        flagged_reason: `Whale ${type}: ${percentageOfSupply.toFixed(2)}%`,
        last_activity: new Date().toISOString()
      });
    }

    return { success: true, isWhale };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

async function updateDAO(supabase: any, data: any) {
  console.log(`[AI MIND] Updating DAO eligibility`);
  
  try {
    const { wallet, tokenId } = data;
    
    const { data: activity } = await supabase
      .from('wallet_activity_log')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('token_id', tokenId)
      .order('timestamp', { ascending: false })
      .limit(10);

    if (!activity || activity.length === 0) {
      await supabase.from('dao_eligibility').upsert({
        wallet_address: wallet,
        token_id: tokenId,
        is_eligible: true,
        whale_status: false,
        last_activity: new Date().toISOString()
      });
      
      return { success: true, eligible: true };
    }

    const { data: eligibility } = await supabase
      .from('dao_eligibility')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('token_id', tokenId)
      .single();

    const isEligible = eligibility ? !eligibility.whale_status : true;
    await logAction(supabase, 'dao_eligibility_updated', { wallet, tokenId, isEligible });

    return { success: true, eligible: isEligible };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

async function luckyLottery(supabase: any, data: any) {
  console.log(`[AI MIND] 🎰 Lucky lottery`);
  
  try {
    const { tokenId } = data;
    
    const { data: eligibleWallets } = await supabase
      .from('wallet_activity_log')
      .select('wallet_address, amount, timestamp')
      .eq('token_id', tokenId)
      .eq('is_whale_flagged', false)
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(100);

    if (!eligibleWallets || eligibleWallets.length === 0) {
      return { success: false, error: 'No eligible wallets' };
    }

    const scoredWallets = eligibleWallets.map((w: any) => {
      const hoursAgo = (Date.now() - new Date(w.timestamp).getTime()) / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 100 - hoursAgo);
      return { ...w, score: recencyScore };
    });

    const totalScore = scoredWallets.reduce((sum: number, w: any) => sum + w.score, 0);
    let random = Math.random() * totalScore;
    
    let luckyWallet = scoredWallets[0];
    for (const wallet of scoredWallets) {
      random -= wallet.score;
      if (random <= 0) {
        luckyWallet = wallet;
        break;
      }
    }

    console.log(`[AI MIND] 🎉 Lucky: ${luckyWallet.wallet_address}`);

    await supabase.from('lucky_wallet_selections').insert({
      token_id: tokenId,
      wallet_address: luckyWallet.wallet_address,
      activity_score: luckyWallet.score,
      selection_timestamp: new Date().toISOString()
    });

    await logAction(supabase, 'lucky_wallet_selected', { tokenId, wallet: luckyWallet.wallet_address });

    return { success: true, luckyWallet: luckyWallet.wallet_address };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

async function evaluateMarket(supabase: any) {
  console.log('[AI MIND] 📊 Evaluating market');
  
  try {
    const { data: tokens } = await supabase
      .from('tokens')
      .select('volume_24h, liquidity, price')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!tokens || tokens.length === 0) {
      return { success: true, condition: 'no_tokens' };
    }

    const totalVolume24h = tokens.reduce((sum: number, t: any) => sum + Number(t.volume_24h || 0), 0);
    const totalLiquidity = tokens.reduce((sum: number, t: any) => sum + Number(t.liquidity || 0), 0);
    const avgPrice = tokens.reduce((sum: number, t: any) => sum + Number(t.price || 0), 0) / tokens.length;

    const marketCondition = {
      totalTokens: tokens.length,
      totalVolume24h,
      totalLiquidity,
      avgPrice,
      trend: totalVolume24h > 1000 ? 'bullish' : totalVolume24h > 500 ? 'neutral' : 'bearish'
    };

    await logAction(supabase, 'market_evaluation', marketCondition);

    return { success: true, condition: marketCondition };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

async function decideCoinCreation(supabase: any) {
  console.log('[AI MIND] 🤔 Deciding coin creation');
  
  try {
    const marketEval = await evaluateMarket(supabase);
    
    if (!marketEval.success) {
      return { success: false, decision: 'no_market_data' };
    }

    const condition = marketEval.condition as any;

    const { data: lastToken } = await supabase
      .from('tokens')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastToken) {
      const hoursSinceLastToken = (Date.now() - new Date(lastToken.created_at).getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastToken < 12) {
        console.log(`[AI MIND] Too soon (${hoursSinceLastToken.toFixed(1)}h)`);
        return { success: true, decision: 'wait', reason: 'too_soon' };
      }
    }

    const shouldCreate = 
      condition.trend === 'bullish' || 
      condition.totalTokens < 5 ||
      (condition.totalVolume24h > 500 && condition.totalLiquidity > 1000);

    const decision = shouldCreate ? 'create' : 'wait';
    console.log(`[AI MIND] Decision: ${decision.toUpperCase()}`);
    
    await logAction(supabase, 'coin_creation_decision', { decision, marketCondition: condition });

    return { success: true, decision, marketCondition: condition };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

async function processCommand(supabase: any, prompt: string, context: any) {
  console.log(`[AI MIND] Command: "${prompt}"`);
  
  try {
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('create') && (lowerPrompt.includes('coin') || lowerPrompt.includes('token'))) {
      return await decideCoinCreation(supabase);
    }
    
    if (lowerPrompt.includes('sell') && lowerPrompt.includes('profit')) {
      if (!context?.tokenId || !context?.amount) {
        return { success: false, error: 'Missing tokenId or amount' };
      }
      return await handleAIProfit(supabase, context);
    }
    
    if (lowerPrompt.includes('lottery') || lowerPrompt.includes('lucky')) {
      if (!context?.tokenId) {
        return { success: false, error: 'Missing tokenId' };
      }
      return await luckyLottery(supabase, context);
    }
    
    if (lowerPrompt.includes('market') || lowerPrompt.includes('evaluate')) {
      return await evaluateMarket(supabase);
    }

    return { success: false, error: 'Unknown command' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
}

async function logAction(supabase: any, type: string, data: any) {
  try {
    await supabase.from('protocol_activity').insert({
      activity_type: `ai_mind_${type}`,
      description: `AI Mind: ${type}`,
      metadata: data,
      timestamp: new Date().toISOString()
    });
    console.log(`[AI MIND LOG] ${type}`);
  } catch (error) {
    console.error('[AI MIND ERROR] logAction:', error);
  }
}
