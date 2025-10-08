import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import TerminalCard from "@/components/TerminalCard";
import CountdownTimer from "@/components/CountdownTimer";
import TokenCard from "@/components/TokenCard";
import ConsoleLog from "@/components/ConsoleLog";
import AiMindTicker from "@/components/AiMindTicker";
import MetricCard from "@/components/MetricCard";
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
      
      {/* Info Bar */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-8 py-4 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isPaused ? 'hsl(var(--destructive))' : 'hsl(var(--success-green))' }} />
              <div>
                <div className="metric-label text-muted-foreground">STATUS</div>
                <div className="text-sm font-bold">{isPaused ? 'PAUSED' : 'ACTIVE'}</div>
              </div>
            </div>
            <div>
              <div className="metric-label text-muted-foreground">NETWORK</div>
              <div className="text-sm font-bold">SOLANA</div>
            </div>
            <div>
              <div className="metric-label text-muted-foreground">TOKENS</div>
              <div className="text-sm metric-display">{totalTokens}</div>
            </div>
            <div>
              <div className="metric-label text-muted-foreground">TREASURY</div>
              <div className="text-sm metric-display">{treasuryBalance.toLocaleString()} SOL</div>
            </div>
          </div>
        </div>
      </div>
      
      <AiMindTicker />
      
      <main className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="max-w-4xl">
            <div className="metric-label mb-4 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              AUTONOMOUS AI SYSTEM
            </div>
            <pre className="text-2xl font-bold leading-none mb-6 tracking-tight">
{`███╗   ███╗██╗███╗   ██╗██████╗  █████╗ 
████╗ ████║██║████╗  ██║██╔══██╗██╔══██╗
██╔████╔██║██║██╔██╗ ██║██║  ██║╚██████║
██║╚██╔╝██║██║██║╚██╗██║██║  ██║ ╚═══██║
██║ ╚═╝ ██║██║██║ ╚████║██████╔╝ █████╔╝
╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝  ╚════╝`}
            </pre>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Fully autonomous AI system that decides when to generate and launch tokens based on market conditions, with intelligent distribution and whale protection.
            </p>
            <div className="flex gap-4">
              <Button
                variant="default"
                onClick={() => window.location.href = '/explorer'}
                className="h-12 px-8 font-bold uppercase tracking-wide"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Explore Tokens
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/leaderboard'}
                className="h-12 px-8 font-bold uppercase tracking-wide"
              >
                <Users className="mr-2 h-4 w-4" />
                Lucky Wallets
              </Button>
            </div>
          </div>
        </div>

        {/* Next AI Launch Section */}
        <div className="mb-12">
          <TerminalCard>
            <div className="text-center space-y-8 py-8">
              <div className="flex items-center justify-center gap-3">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/30 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
                <span className="metric-label">
                  NEXT AUTONOMOUS LAUNCH
                </span>
              </div>
              <div className="metric-display text-8xl text-metric-primary">
                <CountdownTimer targetDate={nextLaunch} isPaused={isPaused} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto pt-6">
                <div>
                  <div className="metric-label mb-2">Mode</div>
                  <div className="text-sm font-medium">Autonomous</div>
                </div>
                <div>
                  <div className="metric-label mb-2 flex items-center gap-2">
                    <Brain className="w-3 h-3" />
                    AI Mood
                  </div>
                  <div className="text-sm metric-display capitalize">
                    {aiMood?.current_mood || 'Neutral'}
                  </div>
                </div>
                <div>
                  <div className="metric-label mb-2">Distribution</div>
                  <div className="text-sm metric-display">AI:7% PUB:83%</div>
                </div>
                <div>
                  <div className="metric-label mb-2">Status</div>
                  <div className="text-sm font-medium">{isPaused ? 'Paused' : 'Active'}</div>
                </div>
              </div>
            </div>
          </TerminalCard>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <MetricCard
            label="Treasury Balance"
            value={treasuryBalance.toLocaleString()}
            unit="SOL"
            subtitle="Total system reserves"
          />

          <MetricCard
            label="Lucky Distribution"
            value={luckyDistribution.toFixed(2)}
            unit="SOL"
            subtitle="Last 7 days"
            trend="up"
          />

          <MetricCard
            label="Tokens Minted"
            value={totalTokens}
            subtitle="Total AI-generated"
          />
        </div>

        {/* Recent Tokens */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">RECENT TOKENS</h2>
              <div className="metric-label">Latest AI-generated assets</div>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/explorer'}
              className="metric-label font-bold"
            >
              VIEW ALL →
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <div className="bg-card border-2 border-border p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-border">
            <div className="w-2 h-2 bg-primary" />
            <h3 className="metric-label font-bold">
              SYSTEM ACTIVITY LOG
            </h3>
          </div>
          <ConsoleLog logs={formattedLogs} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
