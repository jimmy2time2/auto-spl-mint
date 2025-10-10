import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import TerminalCard from "@/components/TerminalCard";
import ConsoleLog from "@/components/ConsoleLog";
import { TradingChart } from "@/components/TradingChart";
import { TradeForm } from "@/components/TradeForm";
import type { Tables } from "@/integrations/supabase/types";

type Token = Tables<"tokens">;
type Log = Tables<"logs">;

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
  const [token, setToken] = useState<Token | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [chartData, setChartData] = useState<Array<{ time: string; value: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTokenData();
      fetchTokenLogs();
    }
  }, [id]);

  const fetchTokenData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setToken(data);
        // Generate mock chart data based on current price
        generateChartData(Number(data.price));
      }
    } catch (error) {
      console.error('Error fetching token:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTokenLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('token_id', id)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (data) setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const generateChartData = (currentPrice: number) => {
    const data = [];
    const now = Date.now();
    for (let i = 24; i >= 0; i--) {
      data.push({
        time: new Date(now - i * 60 * 60 * 1000).toISOString(),
        value: currentPrice * (0.8 + Math.random() * 0.4),
      });
    }
    setChartData(data);
  };

  const formattedLogs = logs.map(log => {
    const details = log.details as any;
    return {
      timestamp: new Date(log.timestamp).toLocaleString(),
      message: `${log.action}: ${JSON.stringify(details)}`,
      type: 'info' as const
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold font-mono mb-4 animate-pulse">LOADING...</div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">Token not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 md:px-6 py-6 md:py-12 max-w-7xl">
        {/* Token Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-2">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold font-mono">${token.symbol}</h1>
            <span className="text-lg sm:text-xl md:text-2xl opacity-70">{token.name}</span>
          </div>
          <div className="text-[10px] md:text-xs uppercase tracking-widest opacity-70">
            Launched: {new Date(token.launch_timestamp).toLocaleString()}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <TerminalCard title="SUPPLY">
            <div className="text-xl md:text-3xl font-bold font-mono">{Number(token.supply).toLocaleString()}</div>
          </TerminalCard>
          <TerminalCard title="PRICE">
            <div className="text-xl md:text-3xl font-bold font-mono">${Number(token.price).toFixed(6)}</div>
          </TerminalCard>
          <TerminalCard title="LIQUIDITY">
            <div className="text-xl md:text-3xl font-bold font-mono">{Number(token.liquidity)} SOL</div>
          </TerminalCard>
          <TerminalCard title="HOLDERS">
            <div className="text-xl md:text-3xl font-bold font-mono">{token.holders}</div>
          </TerminalCard>
        </div>

        {/* Chart and Trading */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-8">
          <div className="lg:col-span-2">
            <TradingChart 
              data={chartData} 
              tokenSymbol={token.symbol}
            />
          </div>
          <div>
            <TradeForm 
              tokenId={token.id}
              tokenSymbol={token.symbol}
              currentPrice={Number(token.price)}
              onTradeComplete={fetchTokenData}
            />
          </div>
        </div>

        {/* Activity Log */}
        {formattedLogs.length > 0 && (
          <div className="bg-black text-white border-2 border-black p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-3">
              <div className="w-2 h-2 bg-white"></div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                TOKEN_ACTIVITY_LOG
              </h3>
            </div>
            <ConsoleLog logs={formattedLogs} />
          </div>
        )}
      </main>
    </div>
  );
};

export default TokenDetail;
