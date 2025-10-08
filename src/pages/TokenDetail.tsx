import { useParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import TerminalCard from "@/components/TerminalCard";
import ConsoleLog from "@/components/ConsoleLog";

const mockTokenData = {
  symbol: 'VX9',
  name: 'VisionX Nine',
  launchTime: '2025-10-02 14:32:11',
  supply: '1,000,000',
  marketCap: '$1,234',
  liquidity: '45 SOL',
  holders: 234,
  price: '$0.001234',
};

const mockLogs = [
  { timestamp: '2025-10-02 14:32:11', message: 'Token VX9 minted successfully', type: 'success' as const },
  { timestamp: '2025-10-02 14:32:45', message: 'Liquidity pool created on Raydium', type: 'success' as const },
  { timestamp: '2025-10-02 14:33:01', message: 'Initial liquidity: 45 SOL', type: 'info' as const },
  { timestamp: '2025-10-02 14:35:22', message: 'First trade detected: 0.5 SOL', type: 'info' as const },
];

const TokenDetail = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-screen-xl">
        <div className="mb-6">
          <div className="flex items-baseline gap-4 mb-2">
            <h1 className="text-5xl font-bold terminal-text">${mockTokenData.symbol}</h1>
            <span className="text-xl opacity-70 terminal-text">{mockTokenData.name}</span>
          </div>
          <div className="inline-block border-2 border-black bg-card px-3 py-1 terminal-text text-sm">
            LAUNCHED: {mockTokenData.launchTime}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <TerminalCard>
            <div className="text-sm opacity-70 terminal-text mb-1">SUPPLY</div>
            <div className="text-2xl font-bold terminal-text">{mockTokenData.supply}</div>
          </TerminalCard>
          <TerminalCard>
            <div className="text-sm opacity-70 terminal-text mb-1">MARKET_CAP</div>
            <div className="text-2xl font-bold terminal-text">{mockTokenData.marketCap}</div>
          </TerminalCard>
          <TerminalCard>
            <div className="text-sm opacity-70 terminal-text mb-1">LIQUIDITY</div>
            <div className="text-2xl font-bold terminal-text">{mockTokenData.liquidity}</div>
          </TerminalCard>
          <TerminalCard>
            <div className="text-sm opacity-70 terminal-text mb-1">HOLDERS</div>
            <div className="text-2xl font-bold terminal-text">{mockTokenData.holders}</div>
          </TerminalCard>
        </div>

        {/* Bonding Curve Chart */}
        <div className="mb-8">
          <TerminalCard title="BONDING_CURVE">
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-black">
              <div className="text-center terminal-text">
                <div className="text-4xl mb-2">📈</div>
                <div className="opacity-70">PRICE_CHART_VISUALIZATION</div>
                <div className="text-sm mt-2">CURRENT_PRICE: {mockTokenData.price}</div>
              </div>
            </div>
          </TerminalCard>
        </div>

        {/* Wallet Distribution */}
        <div className="mb-8">
          <TerminalCard title="WALLET_DISTRIBUTION">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center justify-center border-2 border-dashed border-black p-8">
                <div className="text-center terminal-text">
                  <div className="text-4xl mb-2">🥧</div>
                  <div className="opacity-70">PIE_CHART</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center terminal-text">
                  <span>TREASURY:</span>
                  <span className="font-bold">50% (500,000)</span>
                </div>
                <div className="flex justify-between items-center terminal-text">
                  <span>CREATOR:</span>
                  <span className="font-bold">20% (200,000)</span>
                </div>
                <div className="flex justify-between items-center terminal-text">
                  <span>LUCKY_WALLETS:</span>
                  <span className="font-bold">30% (300,000)</span>
                </div>
                <div className="border-t-2 border-dashed border-black pt-3 mt-3">
                  <div className="text-xs opacity-70 terminal-text mb-2">TOP_HOLDERS:</div>
                  <div className="space-y-1 text-xs terminal-text">
                    <div>8x5kJ...g3jL: 45,000 (4.5%)</div>
                    <div>Bw9pL...k8Qm: 32,100 (3.2%)</div>
                    <div>Nx7tM...j4Rv: 28,500 (2.85%)</div>
                  </div>
                </div>
              </div>
            </div>
          </TerminalCard>
        </div>

        {/* Token Logs */}
        <div>
          <TerminalCard title="TOKEN_ACTIVITY_LOG">
            <ConsoleLog logs={mockLogs} maxHeight="300px" />
          </TerminalCard>
        </div>
      </main>
    </div>
  );
};

export default TokenDetail;
