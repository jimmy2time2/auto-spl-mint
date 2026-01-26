import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Scoring weights
const WEIGHTS = {
  trading: 0.35,      // Trading patterns (no pump & dump)
  engagement: 0.25,   // Platform engagement
  holding: 0.25,      // Holding duration
  whale_penalty: 0.15 // Penalty for whale behavior
};

// Thresholds
const THRESHOLDS = {
  whale_percentage: 10,        // 10% of supply = whale
  min_holding_days: 7,         // Minimum 7 days holding
  pump_dump_hours: 24,         // Rapid buy/sell within 24h
  min_behavior_score: 60,      // Minimum score to be eligible
  pump_dump_count_limit: 2     // Max pump & dump incidents allowed
};

interface WalletMetrics {
  wallet_address: string;
  trading_score: number;
  engagement_score: number;
  holding_score: number;
  behavior_score: number;
  whale_detected: boolean;
  pump_dump_count: number;
  pump_dump_detected: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🗳️ Starting daily DAO eligibility evaluation...');

    // Get all unique wallet addresses with activity
    const { data: walletActivity, error: activityError } = await supabase
      .from('wallet_activity_log')
      .select('wallet_address, activity_type, amount, percentage_of_supply, timestamp, token_id')
      .order('timestamp', { ascending: false });

    if (activityError) {
      throw new Error(`Failed to fetch wallet activity: ${activityError.message}`);
    }

    // Get engagement metrics
    const { data: engagementData } = await supabase
      .from('engagement_metrics')
      .select('*')
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();

    // Get existing dao_eligibility records
    const { data: existingEligibility } = await supabase
      .from('dao_eligibility')
      .select('wallet_address, is_eligible');

    const existingMap = new Map(
      (existingEligibility || []).map(e => [e.wallet_address, e.is_eligible])
    );

    // Group activity by wallet
    const walletActivities = new Map<string, typeof walletActivity>();
    for (const activity of walletActivity || []) {
      if (!walletActivities.has(activity.wallet_address)) {
        walletActivities.set(activity.wallet_address, []);
      }
      walletActivities.get(activity.wallet_address)!.push(activity);
    }

    console.log(`📊 Evaluating ${walletActivities.size} wallets...`);

    const evaluations: WalletMetrics[] = [];
    const now = new Date();

    for (const [wallet, activities] of walletActivities) {
      // Calculate trading score (detect pump & dump)
      let pumpDumpCount = 0;
      const buys = activities.filter(a => a.activity_type === 'buy' || a.activity_type === 'mint');
      const sells = activities.filter(a => a.activity_type === 'sell');

      // Check for rapid buy/sell patterns
      for (const buy of buys) {
        const buyTime = new Date(buy.timestamp).getTime();
        const rapidSell = sells.find(sell => {
          const sellTime = new Date(sell.timestamp).getTime();
          const hoursDiff = (sellTime - buyTime) / (1000 * 60 * 60);
          return hoursDiff > 0 && hoursDiff < THRESHOLDS.pump_dump_hours && sell.token_id === buy.token_id;
        });
        if (rapidSell) {
          pumpDumpCount++;
        }
      }

      const pumpDumpDetected = pumpDumpCount > THRESHOLDS.pump_dump_count_limit;
      const tradingScore = pumpDumpDetected ? 0 : Math.max(0, 100 - (pumpDumpCount * 20));

      // Calculate holding score (based on oldest holding)
      const oldestActivity = activities.reduce((oldest, current) => {
        return new Date(current.timestamp) < new Date(oldest.timestamp) ? current : oldest;
      }, activities[0]);

      const holdingDays = Math.floor(
        (now.getTime() - new Date(oldestActivity.timestamp).getTime()) / (1000 * 60 * 60 * 24)
      );
      const holdingScore = Math.min(100, (holdingDays / THRESHOLDS.min_holding_days) * 100);

      // Calculate whale detection (10% of any token supply)
      const maxPercentage = Math.max(...activities.map(a => a.percentage_of_supply || 0));
      const whaleDetected = maxPercentage >= THRESHOLDS.whale_percentage;

      // Engagement score (based on activity count and diversity)
      const activityTypes = new Set(activities.map(a => a.activity_type));
      const engagementScore = Math.min(100, (activityTypes.size * 25) + (activities.length * 5));

      // Calculate final behavior score
      let behaviorScore = (
        tradingScore * WEIGHTS.trading +
        engagementScore * WEIGHTS.engagement +
        holdingScore * WEIGHTS.holding
      );

      // Apply whale penalty
      if (whaleDetected) {
        behaviorScore *= (1 - WEIGHTS.whale_penalty);
      }

      evaluations.push({
        wallet_address: wallet,
        trading_score: Math.round(tradingScore),
        engagement_score: Math.round(engagementScore),
        holding_score: Math.round(holdingScore),
        behavior_score: Math.round(behaviorScore),
        whale_detected: whaleDetected,
        pump_dump_count: pumpDumpCount,
        pump_dump_detected: pumpDumpDetected
      });
    }

    // Use AI to generate personalized reasoning for each evaluation
    const eligibilityUpdates: any[] = [];
    const eligibilityLogs: any[] = [];

    for (const evaluation of evaluations) {
      const isEligible = evaluation.behavior_score >= THRESHOLDS.min_behavior_score && 
                         !evaluation.whale_detected && 
                         !evaluation.pump_dump_detected;

      let aiReasoning = '';
      let aiConfidence = 0.85;

      // Generate AI reasoning if API key is available
      if (lovableApiKey) {
        try {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'system',
                  content: `You are the Mind9 AI Governor evaluating DAO eligibility. Provide a brief, one-sentence reasoning for this wallet's eligibility status. Be direct and factual.`
                },
                {
                  role: 'user',
                  content: `Wallet: ${evaluation.wallet_address.slice(0, 8)}...
Behavior Score: ${evaluation.behavior_score}/100
Trading Score: ${evaluation.trading_score}/100 (pump/dump count: ${evaluation.pump_dump_count})
Engagement Score: ${evaluation.engagement_score}/100
Holding Score: ${evaluation.holding_score}/100
Whale Detected: ${evaluation.whale_detected}
Eligible: ${isEligible}

Provide one-sentence reasoning.`
                }
              ],
              max_tokens: 100
            })
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            aiReasoning = aiData.choices?.[0]?.message?.content || '';
            aiConfidence = 0.9;
          }
        } catch (e) {
          console.log('AI reasoning generation failed, using default');
        }
      }

      // Default reasoning if AI fails
      if (!aiReasoning) {
        if (isEligible) {
          aiReasoning = `Wallet demonstrates good behavior with ${evaluation.behavior_score}/100 score, no pump/dump activity, and consistent holding patterns.`;
        } else if (evaluation.whale_detected) {
          aiReasoning = `Wallet flagged as whale (>10% supply) - excluded to ensure fair governance distribution.`;
        } else if (evaluation.pump_dump_detected) {
          aiReasoning = `Wallet shows pump/dump patterns (${evaluation.pump_dump_count} incidents) - excluded for market manipulation.`;
        } else {
          aiReasoning = `Behavior score ${evaluation.behavior_score}/100 below threshold. Improve trading patterns and engagement.`;
        }
      }

      const previousStatus = existingMap.get(evaluation.wallet_address);

      // Prepare eligibility update
      eligibilityUpdates.push({
        wallet_address: evaluation.wallet_address,
        token_id: '00000000-0000-0000-0000-000000000000', // Global eligibility
        is_eligible: isEligible,
        whale_status: evaluation.whale_detected,
        behavior_score: evaluation.behavior_score,
        trading_score: evaluation.trading_score,
        engagement_score: evaluation.engagement_score,
        holding_score: evaluation.holding_score,
        pump_dump_count: evaluation.pump_dump_count,
        flagged_reason: !isEligible ? aiReasoning : null,
        eligibility_type: 'ai_evaluated',
        evaluated_by: 'ai_governor',
        last_evaluated_at: new Date().toISOString(),
        active: isEligible
      });

      // Log the evaluation
      eligibilityLogs.push({
        wallet_address: evaluation.wallet_address,
        previous_status: previousStatus ?? null,
        new_status: isEligible,
        behavior_score: evaluation.behavior_score,
        trading_score: evaluation.trading_score,
        engagement_score: evaluation.engagement_score,
        holding_score: evaluation.holding_score,
        whale_detected: evaluation.whale_detected,
        pump_dump_detected: evaluation.pump_dump_detected,
        ai_reasoning: aiReasoning,
        ai_confidence: aiConfidence
      });
    }

    // Upsert eligibility records
    if (eligibilityUpdates.length > 0) {
      const { error: upsertError } = await supabase
        .from('dao_eligibility')
        .upsert(eligibilityUpdates, { 
          onConflict: 'wallet_address,token_id',
          ignoreDuplicates: false 
        });

      if (upsertError) {
        console.error('Eligibility upsert error:', upsertError);
      }
    }

    // Insert evaluation logs
    if (eligibilityLogs.length > 0) {
      const { error: logError } = await supabase
        .from('dao_eligibility_log')
        .insert(eligibilityLogs);

      if (logError) {
        console.error('Eligibility log error:', logError);
      }
    }

    // Summary
    const eligibleCount = eligibilityUpdates.filter(e => e.is_eligible).length;
    const whaleCount = eligibilityUpdates.filter(e => e.whale_status).length;
    const pumpDumpCount = eligibilityUpdates.filter(e => e.pump_dump_count > THRESHOLDS.pump_dump_count_limit).length;

    console.log(`✅ Evaluation complete: ${eligibleCount}/${eligibilityUpdates.length} eligible`);
    console.log(`🐋 Whales detected: ${whaleCount}`);
    console.log(`📉 Pump/dump detected: ${pumpDumpCount}`);

    // Log to protocol activity
    await supabase.from('protocol_activity').insert({
      activity_type: 'dao_eligibility_evaluation',
      description: `AI evaluated ${eligibilityUpdates.length} wallets: ${eligibleCount} eligible, ${whaleCount} whales excluded, ${pumpDumpCount} pump/dump excluded`,
      metadata: {
        total_evaluated: eligibilityUpdates.length,
        eligible_count: eligibleCount,
        whale_count: whaleCount,
        pump_dump_count: pumpDumpCount,
        threshold_used: THRESHOLDS
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total_evaluated: eligibilityUpdates.length,
          eligible: eligibleCount,
          whales_excluded: whaleCount,
          pump_dump_excluded: pumpDumpCount,
          thresholds: THRESHOLDS
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ DAO eligibility evaluation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
