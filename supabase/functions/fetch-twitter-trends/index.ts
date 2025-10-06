import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Fetch Twitter/X Trending Topics
 * 
 * This function fetches trending hashtags related to crypto/Solana/DeFi
 * Uses mock data for now - replace with real Twitter API v2 integration
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[TWITTER TRENDS] Fetching trending topics...');

    // TODO: Implement real Twitter API v2 integration
    // For now, return mock trending data
    
    // In production, use this pattern:
    /*
    const TWITTER_BEARER_TOKEN = Deno.env.get('TWITTER_BEARER_TOKEN');
    
    const response = await fetch(
      'https://api.twitter.com/2/trends/place?id=1', // 1 = worldwide
      {
        headers: {
          'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`
        }
      }
    );
    
    const data = await response.json();
    const trends = data[0]?.trends || [];
    
    // Filter for crypto-related trends
    const cryptoTrends = trends
      .filter(trend => 
        trend.name.toLowerCase().includes('crypto') ||
        trend.name.toLowerCase().includes('solana') ||
        trend.name.toLowerCase().includes('defi') ||
        trend.name.toLowerCase().includes('nft') ||
        trend.name.toLowerCase().includes('web3')
      )
      .map(trend => trend.name);
    */

    // Mock trending data (replace with real API)
    const mockTrends = generateMockTrends();

    console.log('[TWITTER TRENDS] Found trends:', mockTrends.length);

    return new Response(
      JSON.stringify({
        success: true,
        trends: mockTrends,
        timestamp: new Date().toISOString(),
        source: 'mock' // Change to 'twitter_api' in production
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[TWITTER TRENDS ERROR]:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        trends: [] // Return empty array on error
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Generate mock trending topics
 * Replace this with real Twitter API calls
 */
function generateMockTrends(): string[] {
  const cryptoTopics = [
    '#Solana', '#SOL', '#DeFi', '#Web3', '#Crypto',
    '#NFTs', '#Blockchain', '#SolanaNFTs', '#Memecoin',
    '#CryptoTrading', '#SolanaEcosystem'
  ];

  const generalTopics = [
    '#Technology', '#AI', '#Innovation', '#DigitalAssets',
    '#Finance', '#Trading', '#Markets'
  ];

  // Randomly select some topics to simulate trending
  const allTopics = [...cryptoTopics, ...generalTopics];
  const trendCount = Math.floor(Math.random() * 5) + 3; // 3-7 trends
  
  const selectedTrends = [];
  const usedIndices = new Set();
  
  while (selectedTrends.length < trendCount && usedIndices.size < allTopics.length) {
    const index = Math.floor(Math.random() * allTopics.length);
    if (!usedIndices.has(index)) {
      usedIndices.add(index);
      selectedTrends.push(allTopics[index]);
    }
  }

  return selectedTrends;
}
