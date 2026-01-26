import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import CountdownTimer from "@/components/CountdownTimer";
import AiMindTicker from "@/components/AiMindTicker";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Zap, TrendingUp, Gift, Eye } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { useEngagementTracking } from "@/hooks/useEngagementTracking";
import { Link } from "react-router-dom";

type Token = Tables<"tokens">;
type Settings = Tables<"settings">;
type AiMood = Tables<"ai_mood_state">;

const Dashboard = () => {
  useEngagementTracking();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [aiMood, setAiMood] = useState<AiMood | null>(null);
  const [nextLaunch, setNextLaunch] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000));
  const [isPaused, setIsPaused] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Parallel fetch all data
      const [settingsRes, moodRes, tokensRes, countRes] = await Promise.all([
        supabase.from("settings").select("*").single(),
        supabase.from("ai_mood_state").select("*").order("created_at", { ascending: false }).limit(1).single(),
        supabase.from("tokens").select("*").order("launch_timestamp", { ascending: false }).limit(3),
        supabase.from("tokens").select("*", { count: 'exact', head: true })
      ]);
      
      if (settingsRes.data) {
        setSettings(settingsRes.data);
        setIsPaused(settingsRes.data.status !== 'ACTIVE');
        if (settingsRes.data.next_launch_timestamp) {
          setNextLaunch(new Date(settingsRes.data.next_launch_timestamp));
        }
      }
      
      if (moodRes.data) setAiMood(moodRes.data);
      if (tokensRes.data) setTokens(tokensRes.data);
      if (countRes.count !== null) setTotalTokens(countRes.count);
      
      setLoading(false);
    };
    
    fetchData();
  }, []);

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
      <AiMindTicker />
      
      <main className="container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-12">
          <pre className="text-[6px] sm:text-[8px] md:text-xs lg:text-sm font-bold leading-none mb-6 tracking-tight inline-block overflow-x-auto">
{`███╗   ███╗██╗███╗   ██╗██████╗  █████╗ 
████╗ ████║██║████╗  ██║██╔══██╗██╔══██╗
██╔████╔██║██║██╔██╗ ██║██║  ██║╚██████║
██║╚██╔╝██║██║██║╚██╗██║██║  ██║ ╚═══██║
██║ ╚═╝ ██║██║██║ ╚████║██████╔╝ █████╔╝
╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝  ╚════╝`}
          </pre>
          <p className="text-sm md:text-base max-w-xl mx-auto text-muted-foreground">
            An autonomous AI that creates and launches tokens on Solana.
            Watch it think. Trade what it builds.
          </p>
        </div>

        {/* Main Countdown Card */}
        <div className="border-2 border-border bg-card p-6 md:p-10 mb-6">
          <div className="text-center">
            {/* Status Indicator */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div 
                className="w-3 h-3 rounded-full animate-pulse" 
                style={{ backgroundColor: isPaused ? 'hsl(var(--destructive))' : 'hsl(var(--success-green))' }} 
              />
              <span className="metric-label text-xs">
                {isPaused ? 'SYSTEM PAUSED' : 'AI IS ACTIVE'}
              </span>
              <div className="flex items-center gap-1 px-2 py-1 border border-border">
                <Brain className="w-3 h-3" />
                <span className="metric-label text-xs capitalize">{aiMood?.current_mood || 'NEUTRAL'}</span>
              </div>
            </div>
            
            {/* Countdown */}
            <div className="mb-6">
              <div className="metric-label text-xs mb-3">NEXT TOKEN LAUNCH IN</div>
              <div className="metric-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-metric-primary">
                <CountdownTimer targetDate={nextLaunch} isPaused={isPaused} />
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex justify-center gap-8 pt-6 border-t border-border">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold metric-display">{totalTokens}</div>
                <div className="metric-label text-xs">TOKENS CREATED</div>
              </div>
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Button
            asChild
            size="lg"
            className="h-14 md:h-16 font-bold uppercase tracking-wider text-sm md:text-base"
          >
            <Link to="/trade">
              <Zap className="mr-2 h-5 w-5" />
              Start Trading
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-14 md:h-16 font-bold uppercase tracking-wider text-sm md:text-base"
          >
            <Link to="/explorer">
              <Eye className="mr-2 h-5 w-5" />
              Explore Tokens
            </Link>
          </Button>
        </div>

        {/* Recent Tokens - Simplified */}
        {tokens.length > 0 && (
          <div className="border-2 border-border bg-card p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="metric-label font-bold">LATEST TOKENS</h3>
              <Link to="/explorer" className="metric-label text-xs hover:underline">
                VIEW ALL →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {tokens.map((token) => (
                <Link
                  key={token.id}
                  to={`/token/${token.id}`}
                  className="border-2 border-border p-3 hover:border-primary transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm">${token.symbol}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[120px]">{token.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm metric-display">{Number(token.price).toFixed(4)}</div>
                      <div className="text-xs text-muted-foreground">SOL</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* How It Works - Super Simple */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 border-2 border-border">
            <div className="w-10 h-10 mx-auto mb-3 border-2 border-primary flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm mb-1">AI DECIDES</div>
            <div className="text-xs text-muted-foreground">Autonomous token creation based on market signals</div>
          </div>
          <div className="p-4 border-2 border-border">
            <div className="w-10 h-10 mx-auto mb-3 border-2 border-primary flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm mb-1">YOU TRADE</div>
            <div className="text-xs text-muted-foreground">Buy and sell tokens as they launch</div>
          </div>
          <div className="p-4 border-2 border-border">
            <div className="w-10 h-10 mx-auto mb-3 border-2 border-primary flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm mb-1">EARN REWARDS</div>
            <div className="text-xs text-muted-foreground">Active traders get lucky wallet distributions</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
