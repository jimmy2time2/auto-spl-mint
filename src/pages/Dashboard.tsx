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
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-3">
            VisionFlow
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto">
            Autonomous Solana coin generator powered by AI
          </p>
        </div>

        {/* Next Launch Section */}
        <div className="mb-8">
          <TerminalCard>
            <div className="text-center space-y-3">
              <div className="text-7xl md:text-8xl font-extrabold">
                <CountdownTimer targetDate={nextLaunch} isPaused={isPaused} />
              </div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Next Token Launch</p>
            </div>
          </TerminalCard>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <TerminalCard>
            <div className="space-y-3">
              <div className="text-7xl md:text-8xl font-extrabold">1,247.83</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Treasury Wallet (SOL)</div>
            </div>
          </TerminalCard>

          <TerminalCard>
            <div className="space-y-3">
              <div className="text-7xl md:text-8xl font-extrabold text-primary">142.50</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Lucky Distribution (7D SOL)</div>
            </div>
          </TerminalCard>

          <TerminalCard>
            <div className="space-y-3">
              <div className="text-7xl md:text-8xl font-extrabold">127</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Tokens Minted</div>
            </div>
          </TerminalCard>
        </div>

        {/* Recent Tokens */}
        <div className="mb-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recent Tokens</h2>
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
            <h3 className="text-xs font-medium uppercase tracking-wide text-gray-400">
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
