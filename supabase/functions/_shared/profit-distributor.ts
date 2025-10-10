/**
 * Profit Distribution Module
 * 
 * Handles automatic profit splitting across the 4-wallet economy:
 * - 80% AI Wallet (reinvestment)
 * - 15% DAO/System Wallet (treasury)
 * - 3% Lucky Wallet (community rewards)
 * - 2% Creator Wallet (original creator)
 */

export interface ProfitSplit {
  ai_amount: number;
  dao_amount: number;
  lucky_amount: number;
  creator_amount: number;
  total_amount: number;
}

export interface ProfitEvent {
  id: string;
  token_id: string;
  sale_amount: number;
  timestamp: string;
  transaction_hash?: string;
}

export interface DistributionResult {
  success: boolean;
  profit_event_id: string;
  splits: ProfitSplit;
  transactions: {
    wallet_type: string;
    amount: number;
    signature?: string;
    error?: string;
  }[];
  total_distributed: number;
}

/**
 * Calculate profit splits according to the 80/15/3/2 rule
 */
export function calculateProfitSplits(saleAmount: number): ProfitSplit {
  const AI_PERCENTAGE = 0.80;
  const DAO_PERCENTAGE = 0.15;
  const LUCKY_PERCENTAGE = 0.03;
  const CREATOR_PERCENTAGE = 0.02;

  return {
    ai_amount: saleAmount * AI_PERCENTAGE,
    dao_amount: saleAmount * DAO_PERCENTAGE,
    lucky_amount: saleAmount * LUCKY_PERCENTAGE,
    creator_amount: saleAmount * CREATOR_PERCENTAGE,
    total_amount: saleAmount,
  };
}

/**
 * Fetch unprocessed profit events
 */
export async function fetchUnprocessedProfitEvents(
  supabase: any,
  limit: number = 50
): Promise<ProfitEvent[]> {
  // First, get processed event IDs from wallet_activity_log
  const { data: processedIds } = await supabase
    .from('wallet_activity_log')
    .select('transaction_hash')
    .eq('activity_type', 'profit_distribution')
    .not('transaction_hash', 'is', null);

  const processedHashes = new Set(
    processedIds?.map((p: any) => p.transaction_hash) || []
  );

  // Fetch all profit events
  const { data: events, error } = await supabase
    .from('profit_events')
    .select('*')
    .order('timestamp', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch profit events: ${error.message}`);
  }

  // Filter out already processed events
  return (events || []).filter(
    (event: any) => !processedHashes.has(event.transaction_hash)
  );
}

/**
 * Execute profit distribution using wallet executor
 */
export async function distributeProfits(
  supabase: any,
  profitEvent: ProfitEvent
): Promise<DistributionResult> {
  console.log(`Distributing profits for event ${profitEvent.id}...`);

  const splits = calculateProfitSplits(profitEvent.sale_amount);
  const transactions: DistributionResult['transactions'] = [];

  // Distribution targets
  const distributions = [
    { wallet_type: 'ai', amount: splits.ai_amount, description: 'AI Wallet reinvestment' },
    { wallet_type: 'system', amount: splits.dao_amount, description: 'DAO treasury allocation' },
    { wallet_type: 'lucky', amount: splits.lucky_amount, description: 'Lucky Wallet reward' },
    { wallet_type: 'creator', amount: splits.creator_amount, description: 'Creator profit share' },
  ];

  let totalDistributed = 0;
  let allSuccessful = true;

  // Execute transfers for each wallet
  for (const dist of distributions) {
    try {
      console.log(`Transferring ${dist.amount} SOL to ${dist.wallet_type} wallet...`);

      // Call wallet executor to perform the transfer
      const { data: execResult, error: execError } = await supabase.functions.invoke(
        'wallet-executor',
        {
          body: {
            wallet_type: dist.wallet_type,
            instruction_type: 'transfer',
            params: {
              recipient: 'INTERNAL_ALLOCATION', // Special marker for internal transfers
              amount: dist.amount,
              memo: `Profit distribution from event ${profitEvent.id}`,
            },
          },
        }
      );

      if (execError) {
        console.error(`Transfer failed for ${dist.wallet_type}:`, execError);
        transactions.push({
          wallet_type: dist.wallet_type,
          amount: dist.amount,
          error: execError.message,
        });
        allSuccessful = false;
        continue;
      }

      transactions.push({
        wallet_type: dist.wallet_type,
        amount: dist.amount,
        signature: execResult?.signature,
      });

      totalDistributed += dist.amount;

      // Log to wallet activity
      await supabase.from('wallet_activity_log').insert({
        wallet_address: dist.wallet_type.toUpperCase(),
        token_id: profitEvent.token_id,
        activity_type: 'profit_distribution',
        amount: dist.amount,
        transaction_hash: profitEvent.transaction_hash || profitEvent.id,
        timestamp: new Date().toISOString(),
      });

      console.log(`✅ ${dist.wallet_type}: ${dist.amount} SOL distributed`);
    } catch (error) {
      console.error(`Exception during ${dist.wallet_type} transfer:`, error);
      transactions.push({
        wallet_type: dist.wallet_type,
        amount: dist.amount,
        error: error instanceof Error ? error.message : String(error),
      });
      allSuccessful = false;
    }
  }

  return {
    success: allSuccessful,
    profit_event_id: profitEvent.id,
    splits,
    transactions,
    total_distributed: totalDistributed,
  };
}

/**
 * Log distribution result to protocol activity
 */
export async function logDistribution(
  supabase: any,
  result: DistributionResult
): Promise<void> {
  const status = result.success ? 'completed' : 'partial_failure';
  const failedTransfers = result.transactions.filter((t) => t.error);

  await supabase.from('protocol_activity').insert({
    activity_type: 'profit_distribution',
    description: `Profit distribution ${status}: ${result.total_distributed.toFixed(4)} SOL distributed`,
    metadata: {
      profit_event_id: result.profit_event_id,
      splits: result.splits,
      transactions: result.transactions,
      failed_count: failedTransfers.length,
      success: result.success,
    },
  });

  if (!result.success) {
    console.warn(`⚠️ Distribution completed with ${failedTransfers.length} failures`);
  }
}

/**
 * Retry failed distributions
 */
export async function retryFailedDistributions(
  supabase: any,
  maxRetries: number = 3
): Promise<number> {
  console.log('Checking for failed distributions to retry...');

  // Query protocol_activity for failed distributions
  const { data: failedActivities } = await supabase
    .from('protocol_activity')
    .select('*')
    .eq('activity_type', 'profit_distribution')
    .contains('metadata', { success: false })
    .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(maxRetries);

  if (!failedActivities || failedActivities.length === 0) {
    console.log('No failed distributions to retry');
    return 0;
  }

  let retriedCount = 0;

  for (const activity of failedActivities) {
    const profitEventId = activity.metadata?.profit_event_id;
    if (!profitEventId) continue;

    // Fetch the original profit event
    const { data: profitEvent } = await supabase
      .from('profit_events')
      .select('*')
      .eq('id', profitEventId)
      .single();

    if (!profitEvent) continue;

    console.log(`Retrying distribution for event ${profitEventId}...`);

    try {
      const result = await distributeProfits(supabase, profitEvent);
      await logDistribution(supabase, result);
      retriedCount++;
    } catch (error) {
      console.error(`Retry failed for ${profitEventId}:`, error);
    }
  }

  return retriedCount;
}
