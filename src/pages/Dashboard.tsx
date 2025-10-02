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
      
      <main className="container mx-auto px-4 py-8 max-w-screen-xl">
        {/* ASCII Header */}
        <div className="mb-8 text-center border-2 border-black p-4 bg-card">
          <pre className="text-xs md:text-sm font-mono">
{`██╗   ██╗██╗███████╗██╗ ██████╗ ███╗   ██╗███████╗██╗      ██████╗ ██╗    ██╗
██║   ██║██║██╔════╝██║██╔═══██╗████╗  ██║██╔════╝██║     ██╔═══██╗██║    ██║
██║   ██║██║███████╗██║██║   ██║██╔██╗ ██║█████╗  ██║     ██║   ██║██║ █╗ ██║
╚██╗ ██╔╝██║╚════██║██║██║   ██║██║╚██╗██║██╔══╝  ██║     ██║   ██║██║███╗██║
 ╚████╔╝ ██║███████║██║╚██████╔╝██║ ╚████║██║     ███████╗╚██████╔╝╚███╔███╔╝
  ╚═══╝  ╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝`}
          </pre>
          <p className="mt-2 terminal-text text-sm">// AUTONOMOUS_SOLANA_COIN_GENERATOR_v2.0</p>
        </div>

        {/* Next Launch Section */}
        <div className="mb-8">
          <TerminalCard title="NEXT_TOKEN_LAUNCH">
            <CountdownTimer targetDate={nextLaunch} isPaused={isPaused} />
          </TerminalCard>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <TerminalCard title="TREASURY_WALLET">
            <div className="space-y-2">
              <div className="text-4xl font-bold terminal-text">1,247.83</div>
              <div className="text-sm opacity-70 terminal-text">SOL_BALANCE</div>
              <div className="border-t-2 border-dashed border-black pt-2 mt-4">
                <div className="text-xs terminal-text opacity-70">WALLET_ADDRESS:</div>
                <div className="text-xs terminal-text break-all">8x5kJ...g3jL</div>
              </div>
            </div>
          </TerminalCard>

          <TerminalCard title="LUCKY_DISTRIBUTION_7D">
            <div className="space-y-2">
              <div className="text-4xl font-bold terminal-text">142.50</div>
              <div className="text-sm opacity-70 terminal-text">SOL_DISTRIBUTED</div>
              <div className="border-t-2 border-dashed border-black pt-2 mt-4">
                <div className="text-xs terminal-text opacity-70">LAST_INJECTION:</div>
                <div className="text-xs terminal-text">0.5 SOL → 8x5k...3jL</div>
              </div>
            </div>
          </TerminalCard>

          <TerminalCard title="TOTAL_TOKENS_MINTED">
            <div className="space-y-2">
              <div className="text-4xl font-bold terminal-text">127</div>
              <div className="text-sm opacity-70 terminal-text">LIFETIME_TOKENS</div>
              <div className="border-t-2 border-dashed border-black pt-2 mt-4">
                <div className="text-xs terminal-text opacity-70">AVG_LAUNCH_INTERVAL:</div>
                <div className="text-xs terminal-text">2h 15m</div>
              </div>
            </div>
          </TerminalCard>
        </div>

        {/* Recent Tokens */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold terminal-text">{'>'} RECENT_TOKENS</h2>
            <a href="/explorer" className="terminal-text text-sm hover:opacity-70 transition-opacity">
              [VIEW_ALL] {'>'}
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockTokens.map((token) => (
              <TokenCard key={token.id} {...token} />
            ))}
          </div>
        </div>

        {/* AI Console Log */}
        <div>
          <TerminalCard title="AI_SYSTEM_CONSOLE">
            <ConsoleLog logs={mockLogs} />
          </TerminalCard>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
