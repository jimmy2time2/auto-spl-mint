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
    <div className="min-h-screen bg-background crt-flicker">
      <div className="noise-overlay" />
      <OnboardingTour />
      <Navigation />
      <AiMindTicker />
      
      <main className="w-full">
        {/* Main Grid */}
        <div className="border-b-2 border-primary">
          <div className="grid grid-cols-1 lg:grid-cols-3">
            {/* Hero - Left */}
            <div className="lg:col-span-2 lg:border-r-2 border-primary p-4 sm:p-6 md:p-8">
              
              <div className="mb-4 sm:mb-6">
                <div className="data-sm text-muted-foreground mb-2 sm:mb-3 flex items-center gap-2">
                  <span className="power-pulse">⏻</span>
                  AUTONOMOUS TOKEN ECONOMY
                </div>
                <h1 className="display-xl mb-3 sm:mb-4 glow-text leading-tight">
                  A ROGUE AI<br/>WITH ITS OWN<br/>WALLET.
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md">
                  It decides when to create tokens, what to name them, and when to launch. 
                  No human control. Trade its creations before everyone else.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-6">
                <Button asChild className="h-10 sm:h-12 data-sm px-4 sm:px-8 glow-border flex-1 sm:flex-none">
                  <Link to="/trade">TRADE →</Link>
                </Button>
                <Button asChild variant="outline" className="h-10 sm:h-12 data-sm px-4 sm:px-8 flex-1 sm:flex-none">
                  <Link to="/explorer">EXPLORE</Link>
                </Button>
              </div>
            </div>
            
            {/* Stats - Right */}
            <div className="grid grid-cols-2 lg:grid-cols-1 lg:flex lg:flex-col border-t-2 lg:border-t-0 border-primary">
              {/* Countdown */}
              <div className="border-b border-r lg:border-r-0 border-primary/30 lg:border-b-2 lg:border-primary p-3 sm:p-4 flex-1 corner-decorator">
                <div className="data-sm text-muted-foreground mb-1">NEXT LAUNCH</div>
                <div className="display-lg glow-text">
                  <CountdownTimer targetDate={nextLaunch} isPaused={isPaused} />
                </div>
              </div>
              
              {/* Status */}
              <div className="border-b border-primary/30 p-3 sm:p-4 flex-1">
                <div className="data-sm text-muted-foreground mb-1">SYSTEM</div>
                <div className="flex items-center gap-2">
                  <span className={`power-pulse ${isPaused ? 'opacity-30' : ''}`}>⏻</span>
                  <span className="data-md">{isPaused ? 'PAUSED' : 'ACTIVE'}</span>
                </div>
              </div>
              
              {/* Mood */}
              <div className="border-b border-r lg:border-r-0 border-primary/30 p-3 sm:p-4 flex-1">
                <div className="data-sm text-muted-foreground mb-1">AI MOOD</div>
                <div className="data-md uppercase truncate">{aiMood?.current_mood || 'INITIALIZING'}</div>
              </div>
              
              {/* Token Count */}
              <div className="p-3 sm:p-4 flex-1">
                <div className="data-sm text-muted-foreground mb-1">TOKENS</div>
                <div className="display-lg glow-text">{totalTokens}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Feed + Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 border-b-2 border-primary">
          <div className="lg:col-span-2 lg:border-r-2 border-primary">
            <LiveTokenFeed />
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-1 lg:flex lg:flex-col border-t lg:border-t-0 border-primary/30">
            <div className="border-b border-r lg:border-r-0 border-primary/30 p-3 sm:p-4">
              <div className="data-sm text-muted-foreground mb-1">24H VOL</div>
              <div className="display-lg tabular-nums glow-text text-sm sm:text-base lg:text-2xl">${totalVolume.toLocaleString()}</div>
            </div>
            <div className="border-b border-r lg:border-r-0 border-primary/30 p-3 sm:p-4">
              <div className="data-sm text-muted-foreground mb-1">TRADERS</div>
              <div className="display-lg tabular-nums text-sm sm:text-base lg:text-2xl">{Math.floor(Math.random() * 500) + 100}</div>
            </div>
            <div className="p-3 sm:p-4 border-b lg:border-b-0 border-primary/30">
              <div className="data-sm text-muted-foreground mb-1">AVG AGE</div>
              <div className="display-lg tabular-nums text-sm sm:text-base lg:text-2xl">12h 34m</div>
            </div>
          </div>
        </div>

        {/* ASCII Separator */}
        <AsciiDivider pattern="slash" text="HOW IT WORKS" />

        {/* How It Works */}
        <div className="border-b-2 border-primary">
          <div className="grid grid-cols-1 sm:grid-cols-3">
            <div className="sm:border-r-2 border-primary border-b sm:border-b-0 p-4 sm:p-5 corner-decorator">
              <div className="data-sm text-muted-foreground mb-2">01</div>
              <div className="display-lg mb-2 text-base sm:text-xl lg:text-2xl">IT THINKS</div>
              <div className="text-xs text-muted-foreground">AI reads markets, picks a vibe, creates a token from scratch.</div>
            </div>
            <div className="sm:border-r-2 border-primary border-b sm:border-b-0 p-4 sm:p-5">
              <div className="data-sm text-muted-foreground mb-2">02</div>
              <div className="display-lg mb-2 text-base sm:text-xl lg:text-2xl">YOU TRADE</div>
              <div className="text-xs text-muted-foreground">Jump in early. Buy the launch. Sell the peak. Your call.</div>
            </div>
            <div className="p-4 sm:p-5">
              <div className="data-sm text-muted-foreground mb-2">03</div>
              <div className="display-lg mb-2 text-base sm:text-xl lg:text-2xl">GET LUCKY</div>
              <div className="text-xs text-muted-foreground">Active wallets get random airdrops. AI picks favorites.</div>
            </div>
          </div>
        </div>

        {/* ASCII Separator */}
        <AsciiDivider pattern="asterisk" text="DISCOVER" />

        {/* Token Discovery */}
        <div className="border-b-2 border-primary">
          <TokenDiscovery />
        </div>

        {/* ASCII Separator */}
        <AsciiDivider pattern="equals" />

        {/* Footer Info */}
        <div className="p-4 sm:p-6 text-center border-b-2 border-primary">
          <div className="display-lg mb-2 glow-text">M9</div>
          <div className="data-sm text-muted-foreground">
            AUTONOMOUS AI ECONOMY • SOLANA • VERSION 1.0
          </div>
          <div className="mt-4 flex justify-center gap-4">
            <span className="power-pulse">⏻</span>
            <span className="data-sm">BROADCAST LIVE</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
