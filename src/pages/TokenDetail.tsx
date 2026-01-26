import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import AsciiDivider from "@/components/AsciiDivider";
import ConsoleLog from "@/components/ConsoleLog";
import { TradingChart } from "@/components/TradingChart";
import { TradeForm } from "@/components/TradeForm";
import type { Tables } from "@/integrations/supabase/types";

type Token = Tables<"tokens">;
type Log = Tables<"logs">;

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
          <div className="data-lg mb-2">LOADING<span className="cursor-blink">_</span></div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="p-8 text-center">
          <div className="data-sm text-muted-foreground">TOKEN NOT FOUND</div>
          <Link to="/explorer" className="data-sm hover:underline mt-4 block">← BACK TO EXPLORER</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-5xl mx-auto">
        {/* Token Header */}
        <div className="border-b border-border px-4 py-3 bg-muted">
          <div className="flex items-center gap-2">
            <Link to="/explorer" className="data-sm text-muted-foreground hover:text-foreground">
              EXPLORER
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="data-sm">${token.symbol}</span>
          </div>
        </div>

        {/* Token Info */}
        <div className="border-b border-border p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">${token.symbol}</h1>
              <div className="text-sm text-muted-foreground">{token.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Launched: {new Date(token.launch_timestamp).toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="data-lg tabular-nums">${Number(token.price).toFixed(6)}</div>
              <div className="data-sm text-muted-foreground">PRICE</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-border">
          <div className="border-r border-b md:border-b-0 border-border p-4">
            <div className="data-sm text-muted-foreground mb-1">SUPPLY</div>
            <div className="data-md tabular-nums">{Number(token.supply).toLocaleString()}</div>
          </div>
          <div className="border-b md:border-b-0 md:border-r border-border p-4">
            <div className="data-sm text-muted-foreground mb-1">LIQUIDITY</div>
            <div className="data-md tabular-nums">{Number(token.liquidity)} SOL</div>
          </div>
          <div className="border-r border-border p-4">
            <div className="data-sm text-muted-foreground mb-1">HOLDERS</div>
            <div className="data-md tabular-nums">{token.holders}</div>
          </div>
          <div className="p-4">
            <div className="data-sm text-muted-foreground mb-1">VOLUME 24H</div>
            <div className="data-md tabular-nums">${Number(token.volume_24h).toFixed(2)}</div>
          </div>
        </div>

        {/* ASCII Separator */}
        <AsciiDivider pattern="dash" text="CHART" />

        {/* Chart & Trade */}
        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 border-r border-border">
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

        {/* ASCII Separator before Activity */}
        <AsciiDivider pattern="dot" />

        {/* Activity Log */}
        {formattedLogs.length > 0 && (
          <div className="border-t border-border">
            <div className="border-b border-border px-4 py-2 bg-muted">
              <span className="data-sm">TOKEN ACTIVITY</span>
            </div>
            <div className="p-4">
              <ConsoleLog logs={formattedLogs} />
            </div>
          </div>
        )}

        {/* Footer ASCII */}
        <div className="p-3 text-center">
          <div className="data-sm text-muted-foreground opacity-50">
            ─────────────────────────────────────────────────────────────
          </div>
        </div>
      </main>
    </div>
  );
};

export default TokenDetail;
