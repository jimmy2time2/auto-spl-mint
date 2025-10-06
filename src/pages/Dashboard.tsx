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
      
      {/* Info Bar */}
      <div className="border-b-2 border-border bg-card">
        <div className="container mx-auto px-6 py-3 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="border-r border-border pr-4">
              <span className="font-bold uppercase tracking-wider">Status:</span> <span className="text-primary font-mono">● ACTIVE</span>
            </div>
            <div className="border-r border-border pr-4">
              <span className="font-bold uppercase tracking-wider">Network:</span> <span className="font-mono">SOLANA</span>
            </div>
            <div className="border-r border-border pr-4">
              <span className="font-bold uppercase tracking-wider">Tokens:</span> <span className="font-mono">127</span>
            </div>
            <div>
              <span className="font-bold uppercase tracking-wider">Treasury:</span> <span className="font-mono">1,247.83 SOL</span>
            </div>
          </div>
        </div>
      </div>
      
      <AiMindTicker />
      
      <main className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-12 border-b-2 border-border pb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2">SYSTÈME AUTONOME</div>
              <h1 className="text-6xl md:text-7xl font-bold mb-2 leading-none">
                VISIONFLOW
              </h1>
              <p className="text-sm uppercase tracking-wide font-medium">
                Générateur de tokens Solana — Intelligence artificielle
              </p>
            </div>
            <div className="text-right text-xs border-l-2 border-border pl-6">
              <div className="font-bold uppercase tracking-wider mb-1">Version</div>
              <div className="font-mono mb-3">2.0.1</div>
              <div className="font-bold uppercase tracking-wider mb-1">Uptime</div>
              <div className="font-mono">99.9%</div>
            </div>
          </div>
        </div>

        {/* Next Launch Section */}
        <div className="mb-8">
          <TerminalCard title="PROCHAIN LANCEMENT">
            <div className="text-center space-y-4">
              <div className="text-7xl md:text-8xl font-extrabold font-mono">
                <CountdownTimer targetDate={nextLaunch} isPaused={isPaused} />
              </div>
              <div className="flex justify-center gap-8 text-xs border-t-2 border-border pt-4">
                <div><span className="font-bold uppercase tracking-wider">Type:</span> <span className="font-mono">AUTO</span></div>
                <div><span className="font-bold uppercase tracking-wider">Supply:</span> <span className="font-mono">1M</span></div>
                <div><span className="font-bold uppercase tracking-wider">Liquidity:</span> <span className="font-mono">~50 SOL</span></div>
              </div>
            </div>
          </TerminalCard>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <TerminalCard title="TRÉSORERIE">
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-bold font-mono">1,247.83</div>
              <div className="text-[10px] font-bold uppercase tracking-widest border-t border-border pt-2">SOLANA (SOL)</div>
            </div>
          </TerminalCard>

          <TerminalCard title="DISTRIBUTION LUCKY (7J)">
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-bold font-mono text-primary">142.50</div>
              <div className="text-[10px] font-bold uppercase tracking-widest border-t border-border pt-2">SOLANA (SOL)</div>
            </div>
          </TerminalCard>

          <TerminalCard title="TOKENS MINTÉS">
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-bold font-mono">127</div>
              <div className="text-[10px] font-bold uppercase tracking-widest border-t border-border pt-2">TOTAL</div>
            </div>
          </TerminalCard>
        </div>

        {/* Recent Tokens */}
        <div className="mb-12 border-2 border-border p-6">
          <div className="mb-6 flex items-center justify-between border-b-2 border-border pb-4">
            <h2 className="text-2xl font-bold uppercase tracking-tight">Tokens Récents</h2>
            <a href="/explorer" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors border border-border px-3 py-1">
              VOIR TOUT →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockTokens.map((token) => (
              <TokenCard key={token.id} {...token} />
            ))}
          </div>
        </div>

        {/* AI Console Log */}
        <div className="bg-black text-white border-2 border-black p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-3">
            <div className="w-2 h-2 bg-primary"></div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              CONSOLE SYSTÈME IA
            </h3>
          </div>
          <ConsoleLog logs={mockLogs} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
