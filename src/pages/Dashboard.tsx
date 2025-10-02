import { useState } from "react";
import Navigation from "@/components/Navigation";
import TerminalCard from "@/components/TerminalCard";
import CountdownTimer from "@/components/CountdownTimer";
import TokenCard from "@/components/TokenCard";
import ConsoleLog from "@/components/ConsoleLog";
import AiMindTicker from "@/components/AiMindTicker";

// Mock data
const mockTokens = [
  { id: '1', symbol: 'VX9', name: 'VisionX Nine', price: 0.001234, liquidity: 45, volume: 12500 },
  { id: '2', symbol: 'NRG', name: 'NeoRetroGen', price: 0.005678, liquidity: 120, volume: 45000 },
  { id: '3', symbol: 'QNT', name: 'QuantumNet', price: 0.000891, liquidity: 78, volume: 23400 },
];

const mockLogs = [
  { timestamp: '2025-10-02 14:32:11', message: 'AI minted token VX9, supply: 1,000,000', type: 'success' as const },
  { timestamp: '2025-10-02 14:32:45', message: 'Created liquidity pool on Raydium: 45 SOL', type: 'info' as const },
  { timestamp: '2025-10-02 14:33:01', message: 'Fee distribution: Creator 20%, Lucky 30%, Treasury 50%', type: 'info' as const },
  { timestamp: '2025-10-02 14:33:15', message: 'Lucky Wallet injection: 8x5k...3jL received 0.5 SOL', type: 'success' as const },
  { timestamp: '2025-10-02 14:35:00', message: 'Next launch scheduled in 2h 15m', type: 'info' as const },
];

const Dashboard = () => {
  const [nextLaunch] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000 + 15 * 60 * 1000));
  const [isPaused] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AiMindTicker />
      
      <main className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <h1 className="text-6xl md:text-7xl font-bold mb-4 tracking-tight">
            VisionFlow
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Autonomous Solana coin generator powered by AI. Automated launches, liquidity pools, and transparent fee distribution.
          </p>
        </div>

        {/* Next Launch Section */}
        <div className="mb-8">
          <TerminalCard title="NEXT_TOKEN_LAUNCH">
            <CountdownTimer targetDate={nextLaunch} isPaused={isPaused} />
          </TerminalCard>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <TerminalCard title="Treasury Wallet">
            <div className="space-y-3">
              <div className="text-5xl font-bold">1,247.83</div>
              <div className="text-sm text-muted-foreground">SOL Balance</div>
              <div className="border-t border-border pt-5 mt-5">
                <div className="text-xs text-muted-foreground mb-2">Wallet Address</div>
                <div className="text-xs font-mono text-foreground">8x5kJ...g3jL</div>
              </div>
            </div>
          </TerminalCard>

          <TerminalCard title="Lucky Distribution (7D)">
            <div className="space-y-3">
              <div className="text-5xl font-bold text-primary">142.50</div>
              <div className="text-sm text-muted-foreground">SOL Distributed</div>
              <div className="border-t border-border pt-5 mt-5">
                <div className="text-xs text-muted-foreground mb-2">Last Injection</div>
                <div className="text-xs font-mono text-foreground">0.5 SOL → 8x5k...3jL</div>
              </div>
            </div>
          </TerminalCard>

          <TerminalCard title="Total Tokens Minted">
            <div className="space-y-3">
              <div className="text-5xl font-bold">127</div>
              <div className="text-sm text-muted-foreground">Lifetime Tokens</div>
              <div className="border-t border-border pt-5 mt-5">
                <div className="text-xs text-muted-foreground mb-2">Avg Launch Interval</div>
                <div className="text-xs font-mono text-foreground">2h 15m</div>
              </div>
            </div>
          </TerminalCard>
        </div>

        {/* Recent Tokens */}
        <div className="mb-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Recent Tokens</h2>
            <a href="/explorer" className="text-sm font-semibold text-primary hover:opacity-80 transition-opacity">
              View All →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockTokens.map((token) => (
              <TokenCard key={token.id} {...token} />
            ))}
          </div>
        </div>

        {/* AI Console Log */}
        <div className="bg-black text-white rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
              AI System Console
            </h3>
          </div>
          <ConsoleLog logs={mockLogs} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
