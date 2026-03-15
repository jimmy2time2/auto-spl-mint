// @ts-nocheck
/**
 * Autonomous Governor Runner
 * 
 * This script executes the Mind9 Governor's autonomous decision-making process.
 * It can be run manually, via CRON, or triggered by external events.
 * 
 * Usage:
 *   npm run governor           # Execute autonomous mint check
 *   npm run governor:dry       # Dry run (simulation only)
 *   npm run governor:hint      # Generate and display a hint
 *   npm run governor:mood      # Check current AI mood
 */

import { MindGovernor } from './ai/MindGovernor';
import { calculateDistribution } from './economy/distribution';

const isDryRun = process.argv.includes('--dry-run');
const showHint = process.argv.includes('--hint');
const showMood = process.argv.includes('--mood');

async function main() {
  console.log('🧠 Mind9 Governor - Autonomous Token System');
  console.log('============================================\n');

  const governor = new MindGovernor();

  try {
    // Show mood if requested
    if (showMood) {
      const mood = await governor.getMood();
      console.log(`Current Mood: ${mood.toUpperCase()}`);
      console.log('\nMood States:');
      console.log('  • manic: High activity, multiple mints');
      console.log('  • dormant: Low activity, observing');
      console.log('  • bipolar: Rapid decision changes');
      console.log('  • lucky: Profit-taking phase');
      console.log('  • whale_bait: Whale activity detected\n');
      return;
    }

    // Generate hint if requested
    if (showHint) {
      console.log('🔮 Generating cryptic hint...\n');
      const hint = await governor.generateHint();
      console.log(`Hint: "${hint}"\n`);
      return;
    }

    // Main autonomous minting logic
    console.log('🤖 Checking if Mind9 wants to mint...');
    const shouldMint = await governor.shouldMint();

    if (!shouldMint) {
      console.log('⏸️  Mind9 Governor decided to wait. No mint today.\n');
      
      // Still show a hint
      const hint = await governor.generateHint();
      console.log(`💭 Hint: "${hint}"\n`);
      return;
    }

    console.log('✅ Mind9 Governor approved minting!\n');

    // Generate token parameters
    console.log('🎲 Generating token parameters...');
    const params = await governor.generateTokenParams();
    
    console.log('\n📋 Token Details:');
    console.log(`   Name: ${params.name}`);
    console.log(`   Symbol: ${params.symbol}`);
    console.log(`   Supply: ${params.supply.toLocaleString()}`);
    
    if (params.poem) {
      console.log(`\n📜 Poem:\n${params.poem}\n`);
    }

    // Show distribution
    const distribution = calculateDistribution(params.supply);
    console.log('\n💰 Token Distribution:');
    console.log(`   AI Wallet: ${distribution.ai.toLocaleString()} (7%)`);
    console.log(`   Creator: ${distribution.creator.toLocaleString()} (5%)`);
    console.log(`   Lucky: ${distribution.lucky.toLocaleString()} (3%)`);
    console.log(`   System: ${distribution.system.toLocaleString()} (2%)`);
    console.log(`   Public: ${distribution.public.toLocaleString()} (83%)\n`);

    if (isDryRun) {
      console.log('🧪 DRY RUN MODE - No transaction will be sent\n');
      console.log('✅ Simulation complete. Token would be minted with above parameters.\n');
      return;
    }

    // Execute the mint (requires creator address)
    const creatorAddress = process.env.CREATOR_WALLET_ADDRESS || 'DEFAULT_CREATOR';
    
    console.log('🚀 Executing mint transaction...');
    const result = await governor.executeMint(creatorAddress);

    if (result.success) {
      console.log('✅ Token successfully minted!');
      console.log(`   Token ID: ${result.tokenId}\n`);
      
      console.log('📊 Next Steps:');
      console.log('   • Token distributed to all wallets');
      console.log('   • Transaction logged in protocol_activity');
      console.log('   • Lucky wallet selection will occur automatically');
      console.log('   • Creator received 5% allocation\n');
    } else {
      console.error('❌ Mint failed:', result.error, '\n');
    }

  } catch (error) {
    console.error('❌ Governor error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as runGovernor };
