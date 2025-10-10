import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export interface AIContext {
  launch_success_rate: number;
  avg_volume: number;
  total_volume_24h: number;
  winner_diversity: "low" | "medium" | "high";
  recent_token_count: number;
  avg_holders_per_token: number;
  top_performing_tokens: Array<{
    symbol: string;
    volume: number;
  }>;
  lottery_stats: {
    total_winners: number;
    unique_wallets: number;
    avg_distribution: number;
  };
}

/**
 * Builds comprehensive context about recent system performance
 * for AI decision-making in edge functions
 */
export async function buildAIContext(supabase: SupabaseClient): Promise<AIContext> {
  try {
    // Fetch last 20 token launches
    const { data: recentTokens, error: tokensError } = await supabase
      .from("tokens")
      .select("id, symbol, holders, volume_24h, launch_timestamp")
      .order("launch_timestamp", { ascending: false })
      .limit(20);

    if (tokensError) throw tokensError;

    // Fetch trade volume data for recent tokens
    const tokenIds = recentTokens?.map((t) => t.id) || [];
    const { data: tradeFees, error: feesError } = await supabase
      .from("trade_fees_log")
      .select("token_id, trade_amount, timestamp")
      .in("token_id", tokenIds);

    if (feesError) throw feesError;

    // Fetch recent lottery winners
    const { data: lotteryWinners, error: lotteryError } = await supabase
      .from("lucky_wallet_selections")
      .select("wallet_address, distribution_amount, selection_timestamp")
      .order("selection_timestamp", { ascending: false })
      .limit(50);

    if (lotteryError) throw lotteryError;

    // Calculate metrics
    const tokenCount = recentTokens?.length || 0;
    const totalVolume = tradeFees?.reduce((sum, fee) => sum + Number(fee.trade_amount), 0) || 0;
    const avgVolume = tokenCount > 0 ? totalVolume / tokenCount : 0;

    // Calculate success rate (tokens with volume > 0)
    const successfulTokens = recentTokens?.filter((t) => Number(t.volume_24h) > 0).length || 0;
    const launchSuccessRate = tokenCount > 0 ? successfulTokens / tokenCount : 0;

    // Calculate average holders
    const avgHolders = tokenCount > 0 
      ? (recentTokens?.reduce((sum, t) => sum + (t.holders || 0), 0) || 0) / tokenCount 
      : 0;

    // Top performing tokens by 24h volume
    const topPerforming = (recentTokens || [])
      .sort((a, b) => Number(b.volume_24h) - Number(a.volume_24h))
      .slice(0, 5)
      .map((t) => ({
        symbol: t.symbol,
        volume: Number(t.volume_24h),
      }));

    // Lottery winner diversity
    const uniqueWinners = new Set(lotteryWinners?.map((w) => w.wallet_address)).size;
    const totalWinners = lotteryWinners?.length || 0;
    const avgDistribution = totalWinners > 0
      ? (lotteryWinners?.reduce((sum, w) => sum + Number(w.distribution_amount), 0) || 0) / totalWinners
      : 0;

    let winnerDiversity: "low" | "medium" | "high" = "low";
    if (totalWinners > 0) {
      const diversityRatio = uniqueWinners / totalWinners;
      if (diversityRatio > 0.7) winnerDiversity = "high";
      else if (diversityRatio > 0.4) winnerDiversity = "medium";
    }

    // Calculate 24h volume from all recent tokens
    const total24hVolume = recentTokens?.reduce((sum, t) => sum + Number(t.volume_24h), 0) || 0;

    return {
      launch_success_rate: launchSuccessRate,
      avg_volume: avgVolume,
      total_volume_24h: total24hVolume,
      winner_diversity: winnerDiversity,
      recent_token_count: tokenCount,
      avg_holders_per_token: avgHolders,
      top_performing_tokens: topPerforming,
      lottery_stats: {
        total_winners: totalWinners,
        unique_wallets: uniqueWinners,
        avg_distribution: avgDistribution,
      },
    };
  } catch (error) {
    console.error("Error building AI context:", error);
    // Return default values on error
    return {
      launch_success_rate: 0,
      avg_volume: 0,
      total_volume_24h: 0,
      winner_diversity: "low",
      recent_token_count: 0,
      avg_holders_per_token: 0,
      top_performing_tokens: [],
      lottery_stats: {
        total_winners: 0,
        unique_wallets: 0,
        avg_distribution: 0,
      },
    };
  }
}
