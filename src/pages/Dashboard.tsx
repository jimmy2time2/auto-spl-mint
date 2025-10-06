import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import TerminalCard from "@/components/TerminalCard";
import CountdownTimer from "@/components/CountdownTimer";
import TokenCard from "@/components/TokenCard";
import ConsoleLog from "@/components/ConsoleLog";
import AiMindTicker from "@/components/AiMindTicker";
import type { Tables } from "@/integrations/supabase/types";

type Token = Tables<"tokens">;
type Log = Tables<"logs">;
type Settings = Tables<"settings">;

const Dashboard = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [nextLaunch, setNextLaunch] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000));
  const [isPaused, setIsPaused] = useState(false);
  const [treasuryBalance] = useState(1247.83);
  const [luckyDistribution] = useState(142.50);
  const [totalTokens, setTotalTokens] = useState(127);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("settings")
        .select("*")
        .single();
      
      if (data) {
        setSettings(data);
        setIsPaused(data.status !== 'ACTIVE');
        if (data.next_launch_timestamp) {
          setNextLaunch(new Date(data.next_launch_timestamp));
        }
      }
    };
    fetchSettings();
  }, []);

  // Fetch recent tokens
  useEffect(() => {
    const fetchTokens = async () => {
      const { data } = await supabase
        .from("tokens")
        .select("*")
        .order("launch_timestamp", { ascending: false })
        .limit(3);
      
      if (data) {
        setTokens(data);
      }
    };
    fetchTokens();
  }, []);

  // Fetch total token count
  useEffect(() => {
    const fetchTokenCount = async () => {
      const { count } = await supabase
        .from("tokens")
        .select("*", { count: 'exact', head: true });
      
      if (count !== null) {
        setTotalTokens(count);
      }
    };
    fetchTokenCount();
  }, []);

  // Fetch recent logs
  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from("logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(5);
      
      if (data) {
        setLogs(data);
      }
    };
    fetchLogs();
  }, []);

  // Format logs for ConsoleLog component
  const formattedLogs = logs.map(log => {
    const details = log.details as any;
    let message = '';
    let type: 'success' | 'info' | 'error' = 'info';

    if (log.action === 'MINT') {
      message = `AI minted token ${details?.token}, supply: ${details?.supply}`;
      type = 'success';
    } else if (log.action === 'POOL') {
      message = `Created liquidity pool on ${details?.dex}: ${details?.liquidity}`;
      type = 'info';
    } else if (log.action === 'REWARD') {
      message = `Lucky Wallet injection: ${details?.wallet} received ${details?.amount}`;
      type = 'success';
    } else if (log.action === 'SYSTEM') {
      message = details?.message || 'System update';
      type = 'info';
    }

    return {
      timestamp: new Date(log.timestamp).toLocaleString(),
      message,
      type
    };
  });

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
              <div className="text-xs border-l-2 border-border pl-6">
              <div className="font-bold uppercase tracking-wider mb-1">Status</div>
              <div className="font-mono mb-3">● ACTIF</div>
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
              <div className="text-5xl md:text-6xl font-bold font-mono">{treasuryBalance.toLocaleString()}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest border-t border-border pt-2">SOLANA (SOL)</div>
            </div>
          </TerminalCard>

          <TerminalCard title="DISTRIBUTION LUCKY (7J)">
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-bold font-mono">{luckyDistribution.toFixed(2)}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest border-t border-border pt-2">SOLANA (SOL)</div>
            </div>
          </TerminalCard>

          <TerminalCard title="TOKENS MINTÉS">
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-bold font-mono">{totalTokens}</div>
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
            {tokens.map((token) => (
              <TokenCard 
                key={token.id} 
                id={token.id}
                symbol={token.symbol}
                name={token.name}
                price={Number(token.price)}
                liquidity={Number(token.liquidity)}
                volume={Number(token.volume_24h)}
              />
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
          <ConsoleLog logs={formattedLogs} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
