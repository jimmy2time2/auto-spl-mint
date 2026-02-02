import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import CountdownTimer from "@/components/CountdownTimer";
import AiMindTicker from "@/components/AiMindTicker";
import LiveTokenFeed from "@/components/LiveTokenFeed";
import CommunityChat from "@/components/CommunityChat";
import LuckyWalletSection from "@/components/LuckyWalletSection";
import TokenDistributionInfo from "@/components/TokenDistributionInfo";
import { OnboardingTour } from "@/components/OnboardingTour";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ExplorerPanel from "@/components/panels/ExplorerPanel";
import DAOPanel from "@/components/panels/DAOPanel";
import LeaderboardPanel from "@/components/panels/LeaderboardPanel";
import LogbookPanel from "@/components/panels/LogbookPanel";
import WalletPanel from "@/components/panels/WalletPanel";
import type { Tables } from "@/integrations/supabase/types";
import { useEngagementTracking } from "@/hooks/useEngagementTracking";
import { useReferralVisitTracker } from "@/hooks/useReferralVisitTracker";
import { ChevronDown, Search, Vote, Trophy, BookOpen, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import m9OctopusLogo from "@/assets/m9-octopus-logo.png";

type Token = Tables<"tokens">;
type Settings = Tables<"settings">;
type AiMood = Tables<"ai_mood_state">;

interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  openSections: Set<string>;
  toggleSection: (id: string) => void;
}

const CollapsibleSection = ({ 
  id, 
  title, 
  icon, 
  children, 
  openSections, 
  toggleSection 
}: CollapsibleSectionProps) => {
  const isOpen = openSections.has(id);
  
  return (
    <Collapsible open={isOpen} onOpenChange={() => toggleSection(id)}>
      <CollapsibleTrigger className="w-full">
        <div className={cn(
          "flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b-2 border-primary transition-colors",
          isOpen ? "bg-primary/10" : "hover:bg-primary/5"
        )}>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-primary">{icon}</span>
            <h2 className="data-sm sm:text-base font-bold">{title}</h2>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-b-2 border-primary">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const Dashboard = () => {
  useEngagementTracking();
  useReferralVisitTracker();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [aiMood, setAiMood] = useState<AiMood | null>(null);
  const [nextLaunch, setNextLaunch] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000));
  const [isPaused, setIsPaused] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [totalVolume, setTotalVolume] = useState(0);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['explorer']));

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

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
      <AiMindTicker />
      
      <main className="w-full">
        {/* Hero Section */}
        <section className="border-b-2 border-primary">
          <div className="grid grid-cols-1 lg:grid-cols-3">
            {/* Hero Content */}
            <div className="lg:col-span-2 lg:border-r-2 border-primary p-6 sm:p-8 lg:p-12 relative">
              {/* M9 Octopus Logo */}
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8">
                <img 
                  src={m9OctopusLogo} 
                  alt="M9 Octopus" 
                  className="opacity-90 hover:opacity-100 transition-all [filter:invert(83%)_sepia(60%)_saturate(1000%)_hue-rotate(10deg)_brightness(105%)] theme-inverted:[filter:none] theme-inverted:scale-110"
                />
              </div>
              
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
            <div className="border-b border-r lg:border-r-0 border-primary/30 p-3 sm:p-5">
              <p className="data-sm text-muted-foreground mb-1">24H VOL</p>
              <p className="display-lg tabular-nums glow-text truncate">
                {totalVolume >= 1000000 
                  ? `$${(totalVolume / 1000000).toFixed(1)}M`
                  : totalVolume >= 1000 
                    ? `$${(totalVolume / 1000).toFixed(1)}K`
                    : `$${totalVolume.toFixed(0)}`
                }
              </p>
            </div>
            <div className="border-b border-r lg:border-r-0 border-primary/30 p-3 sm:p-5">
              <p className="data-sm text-muted-foreground mb-1">TRADERS</p>
              <p className="display-lg tabular-nums">—</p>
            </div>
            <div className="p-3 sm:p-5 border-b lg:border-b-0 border-primary/30">
              <p className="data-sm text-muted-foreground mb-1">AVG AGE</p>
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

        {/* Lucky Wallet & Distribution */}
        <section className="grid grid-cols-1 lg:grid-cols-2 border-b-2 border-primary">
          <div className="lg:border-r-2 border-primary">
            <LuckyWalletSection />
          </div>
          <div>
            <TokenDistributionInfo />
          </div>
        </section>

        {/* Collapsible Panels */}
        <CollapsibleSection
          id="explorer"
          title="EXPLORE TOKENS"
          icon={<Search className="h-4 w-4 sm:h-5 sm:w-5" />}
          openSections={openSections}
          toggleSection={toggleSection}
        >
          <ExplorerPanel />
        </CollapsibleSection>

        <CollapsibleSection
          id="dao"
          title="DAO GOVERNANCE"
          icon={<Vote className="h-4 w-4 sm:h-5 sm:w-5" />}
          openSections={openSections}
          toggleSection={toggleSection}
        >
          <DAOPanel />
        </CollapsibleSection>

        <CollapsibleSection
          id="leaderboard"
          title="LEADERBOARDS"
          icon={<Trophy className="h-4 w-4 sm:h-5 sm:w-5" />}
          openSections={openSections}
          toggleSection={toggleSection}
        >
          <LeaderboardPanel />
        </CollapsibleSection>

        <CollapsibleSection
          id="logbook"
          title="AI LOGBOOK"
          icon={<BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />}
          openSections={openSections}
          toggleSection={toggleSection}
        >
          <LogbookPanel />
        </CollapsibleSection>

        <CollapsibleSection
          id="wallet"
          title="YOUR WALLET"
          icon={<Wallet className="h-4 w-4 sm:h-5 sm:w-5" />}
          openSections={openSections}
          toggleSection={toggleSection}
        >
          <WalletPanel />
        </CollapsibleSection>

        {/* Community Chat */}
        <section className="border-b-2 border-primary">
          <div className="border-b border-primary/30 px-6 py-4">
            <h2 className="data-sm">COMMUNITY</h2>
          </div>
          <div className="h-[350px]">
            <CommunityChat />
          </div>
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
