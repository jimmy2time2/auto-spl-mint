import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import CountdownTimer from "@/components/CountdownTimer";
import AiMindTicker from "@/components/AiMindTicker";
import AsciiDivider from "@/components/AsciiDivider";
import LiveTokenFeed from "@/components/LiveTokenFeed";
import TokenDiscovery from "@/components/TokenDiscovery";
import { OnboardingTour } from "@/components/OnboardingTour";
import { Button } from "@/components/ui/button";
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
  const [totalVolume, setTotalVolume] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const [settingsRes, moodRes, tokensRes, countRes] = await Promise.all([
        supabase.from("settings").select("*").single(),
        supabase.from("ai_mood_state").select("*").order("created_at", { ascending: false }).limit(1).single(),
        supabase.from("tokens").select("*").order("launch_timestamp", { ascending: false }).limit(5),
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
      if (tokensRes.data) {
        setTokens(tokensRes.data);
        const vol = tokensRes.data.reduce((sum, t) => sum + Number(t.volume_24h), 0);
        setTotalVolume(vol);
      }
      if (countRes.count !== null) setTotalTokens(countRes.count);
      
      setLoading(false);
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="data-lg mb-2">LOADING<span className="cursor-blink">_</span></div>
          <div className="data-sm text-muted-foreground">INITIALIZING SYSTEM</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="scanlines" />
      <OnboardingTour />
      <Navigation />
      
      <main className="w-full">
        {/* Hero Section */}
        <section className="border-b-2 border-primary">
          <div className="grid grid-cols-1 lg:grid-cols-3">
            {/* Hero Content */}
            <div className="lg:col-span-2 lg:border-r-2 border-primary p-6 sm:p-8 lg:p-12">
              <div className="max-w-2xl">
                <p className="data-sm text-muted-foreground mb-4">
                  AUTONOMOUS TOKEN PROTOCOL
                </p>
                <h1 className="display-xl mb-6 glow-text leading-[0.95]">
                  A ROGUE AI<br/>
                  WITH ITS OWN<br/>
                  WALLET.
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-md">
                  It decides when to create tokens, what to name them, and when to launch. 
                  No human control. Trade its creations before everyone else.
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <Button asChild className="h-11 data-sm px-6 glow-border">
                    <Link to="/trade">START TRADING</Link>
                  </Button>
                  <Button asChild variant="outline" className="h-11 data-sm px-6">
                    <Link to="/explorer">EXPLORE TOKENS</Link>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Stats Panel */}
            <div className="grid grid-cols-2 lg:grid-cols-1 border-t-2 lg:border-t-0 border-primary">
              <div className="border-b border-r lg:border-r-0 border-primary/30 p-4 sm:p-5">
                <p className="data-sm text-muted-foreground mb-2">NEXT LAUNCH</p>
                <div className="display-lg glow-text">
                  <CountdownTimer targetDate={nextLaunch} isPaused={isPaused} />
                </div>
              </div>
              
              <div className="border-b border-primary/30 p-4 sm:p-5">
                <p className="data-sm text-muted-foreground mb-2">STATUS</p>
                <div className="flex items-center gap-2">
                  <span className="status-live" />
                  <span className="data-md">{isPaused ? 'PAUSED' : 'ACTIVE'}</span>
                </div>
              </div>
              
              <div className="border-b border-r lg:border-r-0 border-primary/30 p-4 sm:p-5">
                <p className="data-sm text-muted-foreground mb-2">AI STATE</p>
                <p className="data-md uppercase truncate">{aiMood?.current_mood || 'READY'}</p>
              </div>
              
              <div className="p-4 sm:p-5">
                <p className="data-sm text-muted-foreground mb-2">TOKENS CREATED</p>
                <p className="display-lg glow-text">{totalTokens}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Feed & Metrics */}
        <section className="grid grid-cols-1 lg:grid-cols-3 border-b-2 border-primary">
          <div className="lg:col-span-2 lg:border-r-2 border-primary">
            <LiveTokenFeed />
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-1 border-t lg:border-t-0 border-primary/30">
            <div className="border-b border-r lg:border-r-0 border-primary/30 p-4 sm:p-5">
              <p className="data-sm text-muted-foreground mb-1">24H VOLUME</p>
              <p className="display-lg tabular-nums glow-text">${totalVolume.toLocaleString()}</p>
            </div>
            <div className="border-b border-r lg:border-r-0 border-primary/30 p-4 sm:p-5">
              <p className="data-sm text-muted-foreground mb-1">ACTIVE TRADERS</p>
              <p className="display-lg tabular-nums">—</p>
            </div>
            <div className="p-4 sm:p-5 border-b lg:border-b-0 border-primary/30">
              <p className="data-sm text-muted-foreground mb-1">AVG TOKEN AGE</p>
              <p className="display-lg tabular-nums">—</p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-b-2 border-primary">
          <div className="border-b border-primary/30 px-6 py-4">
            <h2 className="data-sm">HOW IT WORKS</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3">
            <div className="sm:border-r border-primary/30 border-b sm:border-b-0 p-6">
              <p className="data-sm text-muted-foreground mb-3">01</p>
              <h3 className="display-lg mb-3">AI DECIDES</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The AI analyzes market conditions, picks a theme, and creates a new token autonomously.
              </p>
            </div>
            <div className="sm:border-r border-primary/30 border-b sm:border-b-0 p-6">
              <p className="data-sm text-muted-foreground mb-3">02</p>
              <h3 className="display-lg mb-3">YOU TRADE</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Trade early. Buy launches, ride momentum, or time your exits. Your strategy.
              </p>
            </div>
            <div className="p-6">
              <p className="data-sm text-muted-foreground mb-3">03</p>
              <h3 className="display-lg mb-3">EARN REWARDS</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Active wallets receive random airdrops. The AI picks its favorites.
              </p>
            </div>
          </div>
        </section>

        {/* Token Discovery */}
        <section className="border-b-2 border-primary">
          <TokenDiscovery />
        </section>

        {/* Footer */}
        <footer className="p-6 sm:p-8 text-center">
          <p className="display-lg mb-2 glow-text">M9</p>
          <p className="data-sm text-muted-foreground">
            AUTONOMOUS AI ECONOMY · SOLANA
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;
