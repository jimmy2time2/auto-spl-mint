import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createAllocationManager, type AllocationProposal } from "../_shared/allocation-manager.ts";

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
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const allocMgr = createAllocationManager(supabase);

    console.log('🔄 Profit Rebalancer: Analyzing metrics...');

    // 1. Gather platform metrics
    const [engagementData, tokensData, daoData, tradesData] = await Promise.all([
      supabase.from('engagement_metrics').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('tokens').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('dao_treasury').select('*').limit(1).maybeSingle(),
      supabase.from('trade_fees_log').select('*').order('timestamp', { ascending: false }).limit(100)
    ]);

    const engagement = engagementData.data || {};
    const recentTokens = tokensData.data || [];
    const daoTreasury = daoData.data || {};
    const recentTrades = tradesData.data || [];

    // Get current allocation
    const currentAllocation = await allocMgr.getCurrentAllocation();

    // Calculate metrics
    const engagementScore = engagement.engagement_score || 0;
    const tradesLast24h = recentTrades.filter(t => 
      new Date(t.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
    ).length;
    const avgTokenPrice = recentTokens.length > 0
      ? recentTokens.reduce((sum, t) => sum + parseFloat(t.price), 0) / recentTokens.length
      : 0;
    const daoBalance = parseFloat(daoTreasury.balance?.toString() || '0');

    // Community growth indicator (compare last 7 days vs previous 7 days)
    const now = Date.now();
    const last7Days = recentTrades.filter(t => 
      new Date(t.timestamp).getTime() > now - 7 * 24 * 60 * 60 * 1000
    ).length;
    const prev7Days = recentTrades.filter(t => {
      const time = new Date(t.timestamp).getTime();
      return time > now - 14 * 24 * 60 * 60 * 1000 && time <= now - 7 * 24 * 60 * 60 * 1000;
    }).length;
    const growthRate = prev7Days > 0 ? ((last7Days - prev7Days) / prev7Days) * 100 : 0;

    const inputMetrics = {
      engagement: {
        score: engagementScore,
        wallet_connections: engagement.wallet_connections || 0,
        trades_count: engagement.trades_count || 0,
        page_views: engagement.page_views || 0
      },
      market: {
        recent_tokens_count: recentTokens.length,
        avg_token_price: avgTokenPrice,
        trades_last_24h: tradesLast24h
      },
      dao: {
        treasury_balance: daoBalance
      },
      growth: {
        trades_last_7d: last7Days,
        trades_prev_7d: prev7Days,
        growth_rate_pct: growthRate
      },
      current_allocation: currentAllocation
    };

    console.log('📊 Input metrics:', inputMetrics);

    // 2. Ask AI for rebalancing suggestion
    const analysisPrompt = `You are a profit allocation strategist for a token launch platform. Analyze the following metrics and suggest optimal profit split percentages.

Current Allocation:
- Reinvestment (System): ${currentAllocation.reinvestment}%
- DAO Treasury: ${currentAllocation.dao}%
- Lucky Lottery: ${currentAllocation.lucky}%
- Creator Rewards: ${currentAllocation.creator}%

Platform Metrics:
${JSON.stringify(inputMetrics, null, 2)}

Decision Factors:
1. **Community Growth**: ${growthRate >= 0 ? 'Growing' : 'Declining'} (${growthRate.toFixed(1)}%)
   - If growing: Consider increasing lucky/creator % to reward growth
   - If declining: Increase reinvestment % to improve platform

2. **Engagement**: ${engagementScore >= 50 ? 'High' : engagementScore >= 30 ? 'Medium' : 'Low'} (${engagementScore})
   - Low engagement: Increase lucky % to incentivize participation
   - High engagement: Maintain or slightly reduce incentives

3. **DAO Treasury**: $${daoBalance.toFixed(2)}
   - If low (<$500): Increase DAO %
   - If healthy (>$2000): Reduce DAO %

4. **Token Performance**: ${avgTokenPrice > 0.01 ? 'Good' : 'Poor'} (avg ${avgTokenPrice})
   - Poor performance: Increase reinvestment %
   - Good performance: Balance more toward community rewards

Rules:
- Total MUST equal 100%
- Reinvestment: 40-90% (system sustainability)
- DAO: 5-30% (governance capacity)
- Lucky: 1-15% (user incentives)
- Creator: 1-10% (builder rewards)

Respond with ONLY a JSON object:
{
  "suggested_allocation": {
    "reinvestment": <number>,
    "dao": <number>,
    "lucky": <number>,
    "creator": <number>
  },
  "reasoning": "brief explanation of changes",
  "confidence": 0.0-1.0,
  "should_rebalance": true|false
}`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a financial optimization AI. Always respond with valid JSON only.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const suggestionText = aiData.choices[0].message.content;
    
    let suggestion;
    try {
      const jsonMatch = suggestionText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestion = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI suggestion:', suggestionText);
      suggestion = {
        suggested_allocation: currentAllocation,
        reasoning: 'Failed to parse AI response, maintaining current allocation',
        confidence: 0.5,
        should_rebalance: false
      };
    }

    console.log('🤖 AI Suggestion:', suggestion);

    // 3. Create proposal if AI recommends rebalancing
    let proposalId: string | null = null;

    if (suggestion.should_rebalance) {
      const proposal: AllocationProposal = {
        reinvestment_pct: suggestion.suggested_allocation.reinvestment,
        dao_pct: suggestion.suggested_allocation.dao,
        lucky_pct: suggestion.suggested_allocation.lucky,
        creator_pct: suggestion.suggested_allocation.creator,
        reasoning: suggestion.reasoning,
        confidence: suggestion.confidence,
        input_metrics: inputMetrics,
        proposed_by: 'ai'
      };

      // Validate proposal
      const validation = allocMgr.validateProposal(proposal);
      
      if (!validation.valid) {
        console.error('❌ Invalid proposal:', validation.errors);
        throw new Error(`Invalid allocation proposal: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️ Proposal warnings:', validation.warnings);
      }

      // Submit proposal
      proposalId = await allocMgr.proposeAllocation(proposal);
      
      if (proposalId) {
        console.log('📝 Allocation proposal created:', proposalId);
        
        // Log to protocol activity
        await supabase.from('protocol_activity').insert({
          activity_type: 'allocation_proposal',
          description: `AI proposed new profit allocation: R${proposal.reinvestment_pct}% D${proposal.dao_pct}% L${proposal.lucky_pct}% C${proposal.creator_pct}%`,
          metadata: {
            proposal_id: proposalId,
            suggested_allocation: suggestion.suggested_allocation,
            current_allocation: currentAllocation,
            reasoning: suggestion.reasoning,
            confidence: suggestion.confidence,
            metrics: inputMetrics
          }
        });
      }
    } else {
      console.log('⏸️ AI recommends maintaining current allocation');
      
      // Log decision to not rebalance
      await supabase.from('protocol_activity').insert({
        activity_type: 'allocation_analysis',
        description: 'AI analyzed metrics and recommends maintaining current allocation',
        metadata: {
          current_allocation: currentAllocation,
          reasoning: suggestion.reasoning,
          metrics: inputMetrics
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        should_rebalance: suggestion.should_rebalance,
        current_allocation: currentAllocation,
        suggested_allocation: suggestion.suggested_allocation,
        reasoning: suggestion.reasoning,
        confidence: suggestion.confidence,
        proposal_id: proposalId,
        input_metrics: inputMetrics
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Profit Rebalancer error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
