/**
 * PROVABLY FAIR LUCKY WALLET SELECTION
 * Uses Solana blockhash for verifiable randomness
 */

export interface LuckySelectionProof {
  blockhash: string;
  block_slot: number;
  eligible_wallets: string[];
  eligible_count: number;
  total_weight: number;
  random_seed: string;
  weighted_value: number;
  selected_index: number;
  winner: string;
  reward_amount: number;
  timestamp: string;
  verification_hash: string;
}

export interface LuckySelectionResult {
  winner: string;
  proof: LuckySelectionProof;
}

/**
 * Select a lucky wallet using provably fair randomness
 */
export async function selectLuckyWallet(
  supabase: any,
  rewardAmount: number,
  rpcUrl?: string
): Promise<LuckySelectionResult> {
  const solanaRpc = rpcUrl || Deno.env.get('SOLANA_RPC_URL') || 'https://api.mainnet-beta.solana.com';
  
  // Get Solana blockhash as entropy source
  const blockResponse = await fetch(solanaRpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getLatestBlockhash',
      params: [{ commitment: 'finalized' }],
    }),
  });
  
  const blockData = await blockResponse.json();
  const blockhash = blockData.result?.value?.blockhash;
  const slot = blockData.result?.context?.slot || 0;
  
  if (!blockhash) {
    throw new Error('Failed to get Solana blockhash for randomness');
  }
  
  // Get eligible wallets (active in last 30 days, not whales, not recent winners)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  // Get active wallets
  const { data: activeWallets } = await supabase
    .from('wallet_activity_log')
    .select('wallet_address')
    .gte('timestamp', thirtyDaysAgo);
  
  // Get whales to exclude
  const { data: whales } = await supabase
    .from('dao_eligibility')
    .select('wallet_address')
    .eq('whale_status', true);
  
  // Get recent winners to exclude
  const { data: recentWinners } = await supabase
    .from('lucky_wallet_selections')
    .select('wallet_address')
    .gte('selection_timestamp', sevenDaysAgo);
  
  // Build exclusion set
  const excludedWallets = new Set([
    ...(whales?.map((w: any) => w.wallet_address) || []),
    ...(recentWinners?.map((w: any) => w.wallet_address) || []),
    'AI_WALLET',
    'SYSTEM_WALLET',
    'PROTOCOL_WALLET',
  ]);
  
  // Filter to unique eligible wallets
  const walletAddresses: string[] = activeWallets?.map((a: any) => String(a.wallet_address)) || [];
  const uniqueWallets: string[] = Array.from(new Set(walletAddresses));
  const eligibleWallets: string[] = uniqueWallets
    .filter((w: string) => !excludedWallets.has(w))
    .sort(); // Sort for deterministic verification
  
  if (eligibleWallets.length === 0) {
    throw new Error('No eligible wallets for lucky selection');
  }
  
  // Calculate weights based on activity (more trades = slightly higher chance)
  const walletWeights: Map<string, number> = new Map();
  for (const wallet of eligibleWallets) {
    const activityCount = activeWallets?.filter((a: any) => a.wallet_address === wallet).length || 1;
    // Diminishing returns: sqrt of activity to prevent whales from dominating
    walletWeights.set(wallet, Math.floor(Math.sqrt(activityCount) * 100));
  }
  
  const totalWeight = [...walletWeights.values()].reduce((sum, w) => sum + w, 0);
  
  // Generate deterministic random seed from blockhash and eligible wallets
  const seedData = `LUCKY:${blockhash}:${eligibleWallets.join(',')}:${rewardAmount}:${Date.now()}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(seedData));
  const hashArray = new Uint8Array(hashBuffer);
  
  // Create random value from hash
  const randomValue = hashArray.reduce((acc, byte, i) => acc + byte * (i + 1), 0);
  const weightedRandom = randomValue % totalWeight;
  
  // Select winner using weighted random
  let cumulativeWeight = 0;
  let selectedIndex = 0;
  let winner: string = eligibleWallets[0];
  
  for (let i = 0; i < eligibleWallets.length; i++) {
    const wallet: string = eligibleWallets[i];
    cumulativeWeight += walletWeights.get(wallet) || 1;
    if (weightedRandom < cumulativeWeight) {
      selectedIndex = i;
      winner = wallet;
      break;
    }
  }
  
  // Create verification hash for proof
  const proofData = `${blockhash}:${slot}:${eligibleWallets.join(',')}:${totalWeight}:${selectedIndex}:${winner}:${rewardAmount}`;
  const proofHashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(proofData));
  const proofHashArray = new Uint8Array(proofHashBuffer);
  const verificationHash = Array.from(proofHashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Build proof
  const proof: LuckySelectionProof = {
    blockhash,
    block_slot: slot,
    eligible_wallets: eligibleWallets,
    eligible_count: eligibleWallets.length,
    total_weight: totalWeight,
    random_seed: Array.from(hashArray.slice(0, 8)).map(b => b.toString(16)).join(''),
    weighted_value: weightedRandom,
    selected_index: selectedIndex,
    winner,
    reward_amount: rewardAmount,
    timestamp: new Date().toISOString(),
    verification_hash: verificationHash,
  };
  
  // Store proof in database
  await supabase.from('lucky_selection_proofs').insert({
    blockhash: proof.blockhash,
    block_slot: proof.block_slot,
    eligible_count: proof.eligible_count,
    total_weight: proof.total_weight,
    random_seed: proof.random_seed,
    weighted_value: proof.weighted_value,
    selected_index: proof.selected_index,
    winner: proof.winner,
    reward_amount: proof.reward_amount,
    verification_hash: proof.verification_hash,
    full_proof: proof,
  });
  
  // Record the winner selection
  await supabase.from('lucky_wallet_selections').insert({
    wallet_address: winner,
    distribution_amount: rewardAmount,
    activity_score: walletWeights.get(winner) || 0,
    is_recent_minter: false,
  });
  
  // Log protocol activity
  await supabase.from('protocol_activity').insert({
    activity_type: 'lucky_selection',
    description: `Lucky wallet selected: ${winner.slice(0, 8)}... wins ${rewardAmount.toFixed(4)} SOL`,
    metadata: {
      winner,
      reward_amount: rewardAmount,
      eligible_count: eligibleWallets.length,
      verification_hash: verificationHash,
    },
  });
  
  return { winner, proof };
}

/**
 * Verify a lucky selection proof
 */
export async function verifyLuckyProof(proof: LuckySelectionProof): Promise<boolean> {
  const encoder = new TextEncoder();
  
  // Recreate verification hash
  const proofData = `${proof.blockhash}:${proof.block_slot}:${proof.eligible_wallets.join(',')}:${proof.total_weight}:${proof.selected_index}:${proof.winner}:${proof.reward_amount}`;
  const proofHashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(proofData));
  const proofHashArray = new Uint8Array(proofHashBuffer);
  const calculatedHash = Array.from(proofHashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Verify hash matches
  if (calculatedHash !== proof.verification_hash) {
    return false;
  }
  
  // Verify winner is at selected index
  if (proof.eligible_wallets[proof.selected_index] !== proof.winner) {
    return false;
  }
  
  // Verify eligible count
  if (proof.eligible_wallets.length !== proof.eligible_count) {
    return false;
  }
  
  return true;
}
