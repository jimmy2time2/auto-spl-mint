import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import TerminalCard from "@/components/TerminalCard";
import CountdownTimer from "@/components/CountdownTimer";
import TokenCard from "@/components/TokenCard";
import ConsoleLog from "@/components/ConsoleLog";
import AiMindTicker from "@/components/AiMindTicker";
import MetricCard from "@/components/MetricCard";
import AsciiBrain from "@/components/AsciiBrain";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Users, Zap, Activity, Circle, Brain } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { useEngagementTracking } from "@/hooks/useEngagementTracking";

type Token = Tables<"tokens">;
type Log = Tables<"logs">;
type Settings = Tables<"settings">;
type AiMood = Tables<"ai_mood_state">;

const Dashboard = () => {
  useEngagementTracking(); // Track page views
  const [tokens, setTokens] = useState<Token[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [aiMood, setAiMood] = useState<AiMood | null>(null);
  const [nextLaunch, setNextLaunch] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000));
  const [isPaused, setIsPaused] = useState(false);
  const [treasuryBalance, setTreasuryBalance] = useState(0);
  const [luckyDistribution, setLuckyDistribution] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch settings and AI mood
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

    const fetchAiMood = async () => {
      const { data } = await supabase
        .from("ai_mood_state")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setAiMood(data);
      }
    };

    fetchSettings();
    fetchAiMood();
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

  // Fetch stats (total tokens, treasury, lucky distribution)
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      
      // Get total token count
      const { count } = await supabase
        .from("tokens")
        .select("*", { count: 'exact', head: true });
      
      if (count !== null) {
        setTotalTokens(count);
      }

      // Get DAO treasury balance
      const { data: treasury } = await supabase
        .from("dao_treasury")
        .select("balance")
        .single();
      
      if (treasury) {
        setTreasuryBalance(Number(treasury.balance));
      }

      // Calculate lucky wallet distribution (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: luckySelections } = await supabase
        .from("lucky_wallet_selections")
        .select("distribution_amount")
        .gte("selection_timestamp", sevenDaysAgo.toISOString());
      
      if (luckySelections) {
        const total = luckySelections.reduce((sum, s) => sum + parseFloat(s.distribution_amount.toString()), 0);
        setLuckyDistribution(total);
      }

      setLoading(false);
    };
    
    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
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


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="metric-label text-muted-foreground">Loading System</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Top Info Bar */}
      <div className="border-b-2 border-border bg-card">
        <div className="container mx-auto px-4 md:px-8 py-3 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 text-[10px] md:text-xs">
            <div>
              <div className="metric-label">STATUS</div>
              <div className="font-bold flex items-center gap-2">
                <div className="w-2 h-2" style={{ backgroundColor: isPaused ? 'hsl(var(--destructive))' : 'hsl(var(--success-green))' }} />
                {isPaused ? 'PAUSED' : 'ACTIVE'}
              </div>
            </div>
            <div>
              <div className="metric-label">NETWORK</div>
              <div className="font-bold">SOLANA</div>
            </div>
            <div>
              <div className="metric-label">TOKENS</div>
              <div className="font-bold metric-display">{totalTokens}</div>
            </div>
            <div>
              <div className="metric-label">TREASURY</div>
              <div className="font-bold metric-display">{treasuryBalance.toFixed(2)} SOL</div>
            </div>
            <div>
              <div className="metric-label">AI MOOD</div>
              <div className="font-bold capitalize">{aiMood?.current_mood || 'NEUTRAL'}</div>
            </div>
            <div>
              <div className="metric-label">LUCKY DIST</div>
              <div className="font-bold metric-display">{luckyDistribution.toFixed(2)} SOL</div>
            </div>
          </div>
        </div>
      </div>
      
      <AiMindTicker />
      
      <main className="container mx-auto px-4 md:px-8 py-4 md:py-6 max-w-7xl">
        {/* 3-Column Grid Layout */}
        <div className="grid grid-cols-12 gap-4">
          
          {/* LEFT SIDEBAR */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* Recent Tokens List */}
            <div className="border-2 border-border bg-card p-4">
              <h3 className="metric-label mb-4 font-bold">RECENT TOKENS</h3>
              <div className="space-y-3">
                {tokens.slice(0, 5).map((token, idx) => (
                  <div key={token.id} className="border-b-2 border-border pb-2 last:border-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs">{token.symbol}</div>
                        <div className="text-[10px] metric-label">{token.name}</div>
                      </div>
                      <div className="text-xs font-bold metric-display">
                        {Number(token.price).toFixed(4)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="border-2 border-border bg-card p-4">
              <h3 className="metric-label mb-4 font-bold">PROTOCOL STATS</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="metric-label">TOTAL VOLUME</span>
                  <span className="font-bold">--</span>
                </div>
                <div className="flex justify-between">
                  <span className="metric-label">TOTAL HOLDERS</span>
                  <span className="font-bold">--</span>
                </div>
                <div className="flex justify-between">
                  <span className="metric-label">ACTIVE TRADES</span>
                  <span className="font-bold">--</span>
                </div>
              </div>
            </div>

            {/* AI Mind Visualization */}
            <div className="bg-background p-4">
              <h3 className="metric-label mb-4 font-bold flex items-center gap-2">
                <Brain className="w-3 h-3" />
                AI MIND STATE
              </h3>
              <div className="flex justify-center">
                <AsciiBrain 
                  mood={aiMood?.current_mood === "frenzied" ? "frenzied" : 
                        aiMood?.current_mood === "zen" ? "zen" : 
                        aiMood?.current_mood === "cosmic" ? "cosmic" : "neutral"}
                  intensity={aiMood?.mood_intensity || 50}
                  activity="idle"
                  size={200}
                />
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="col-span-12 lg:col-span-6 space-y-4">
            {/* ASCII Logo Header */}
            <div className="border-2 border-border bg-card p-4 md:p-8 text-center">
              <pre className="text-[8px] sm:text-xs md:text-sm lg:text-base font-bold leading-none mb-4 tracking-tight inline-block overflow-x-auto">
{`███╗   ███╗██╗███╗   ██╗██████╗  █████╗ 
████╗ ████║██║████╗  ██║██╔══██╗██╔══██╗
██╔████╔██║██║██╔██╗ ██║██║  ██║╚██████║
██║╚██╔╝██║██║██║╚██╗██║██║  ██║ ╚═══██║
██║ ╚═╝ ██║██║██║ ╚████║██████╔╝ █████╔╝
╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝  ╚════╝`}
              </pre>
              <p className="text-xs md:text-sm mt-4 max-w-2xl mx-auto px-2">
                Fully autonomous AI system that decides when to generate and launch tokens based on market conditions.
              </p>
            </div>

            {/* Next Launch Timer */}
            <div className="border-2 border-border bg-card p-4 md:p-6">
              <div className="text-center space-y-4 md:space-y-6">
                <div className="metric-label text-[10px] md:text-xs">NEXT AUTONOMOUS LAUNCH</div>
                <div className="metric-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-metric-primary">
                  <CountdownTimer targetDate={nextLaunch} isPaused={isPaused} />
                </div>
                <div className="grid grid-cols-3 gap-2 md:gap-4 text-[10px] md:text-xs pt-4 border-t-2 border-border">
                  <div>
                    <div className="metric-label mb-1">MODE</div>
                    <div className="font-bold">AUTONOMOUS</div>
                  </div>
                  <div>
                    <div className="metric-label mb-1 flex items-center justify-center gap-2">
                      <Brain className="w-3 h-3" />
                      AI MOOD
                    </div>
                    <div className="font-bold capitalize">
                      {aiMood?.current_mood || 'NEUTRAL'}
                    </div>
                  </div>
                  <div>
                    <div className="metric-label mb-1">STATUS</div>
                    <div className="font-bold">{isPaused ? 'PAUSED' : 'ACTIVE'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              <div className="border-2 border-border bg-card p-2 md:p-4 text-center">
                <div className="metric-label mb-1 md:mb-2 text-[9px] md:text-[10px]">TREASURY</div>
                <div className="text-lg md:text-2xl font-bold metric-display">{treasuryBalance.toFixed(0)}</div>
                <div className="text-[10px] md:text-xs mt-1">SOL</div>
              </div>
              <div className="border-2 border-border bg-card p-2 md:p-4 text-center">
                <div className="metric-label mb-1 md:mb-2 text-[9px] md:text-[10px]">LUCKY (7D)</div>
                <div className="text-lg md:text-2xl font-bold metric-display">{luckyDistribution.toFixed(2)}</div>
                <div className="text-[10px] md:text-xs mt-1">SOL</div>
              </div>
              <div className="border-2 border-border bg-card p-2 md:p-4 text-center">
                <div className="metric-label mb-1 md:mb-2 text-[9px] md:text-[10px]">TOKENS</div>
                <div className="text-lg md:text-2xl font-bold metric-display">{totalTokens}</div>
                <div className="text-[10px] md:text-xs mt-1">MINTED</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <Button
                variant="default"
                onClick={() => window.location.href = '/explorer'}
                className="h-10 md:h-12 font-bold uppercase tracking-wide text-xs md:text-sm"
              >
                <TrendingUp className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">EXPLORE</span>
                <span className="sm:hidden">EXPL</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/leaderboard'}
                className="h-10 md:h-12 font-bold uppercase tracking-wide text-xs md:text-sm"
              >
                <Users className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">LEADERBOARD</span>
                <span className="sm:hidden">BOARD</span>
              </Button>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* System Activity Log */}
            <div className="border-2 border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-border">
                <div className="w-2 h-2 bg-primary" />
                <h3 className="metric-label font-bold">ACTIVITY LOG</h3>
              </div>
              <div className="space-y-2">
                {formattedLogs.slice(0, 8).map((log, idx) => {
                  let colorClass = '';
                  if (String(log.type) === 'success') colorClass = 'text-success-green';
                  else if (String(log.type) === 'error') colorClass = 'text-destructive';
                  
                  return (
                    <div key={idx} className="text-[10px] leading-tight pb-2 border-b border-border last:border-0">
                      <div className={`font-bold ${colorClass}`}>
                        {'>'} {log.message.substring(0, 50)}
                        {log.message.length > 50 && '...'}
                      </div>
                      <div className="metric-label mt-1">{log.timestamp}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Distribution Info */}
            <div className="border-2 border-border bg-card p-4">
              <h3 className="metric-label mb-4 font-bold">TOKEN DISTRIBUTION</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="metric-label">PUBLIC</span>
                  <span className="font-bold">83%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="metric-label">AI WALLET</span>
                  <span className="font-bold">7%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="metric-label">CREATOR</span>
                  <span className="font-bold">5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="metric-label">LUCKY</span>
                  <span className="font-bold">3%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="metric-label">SYSTEM</span>
                  <span className="font-bold">2%</span>
                </div>
              </div>
            </div>

            {/* Fee Structure */}
            <div className="border-2 border-border bg-card p-4">
              <h3 className="metric-label mb-4 font-bold">FEE STRUCTURE</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="metric-label">TRADING FEE</span>
                  <span className="font-bold">2%</span>
                </div>
                <div className="flex justify-between items-center pl-4">
                  <span className="metric-label">• CREATOR</span>
                  <span className="font-bold">1%</span>
                </div>
                <div className="flex justify-between items-center pl-4">
                  <span className="metric-label">• SYSTEM</span>
                  <span className="font-bold">1%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
