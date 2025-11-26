import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useEngagementTracking } from "@/hooks/useEngagementTracking";
import { Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AsciiBrain from "./AsciiBrain";
import type { Tables } from "@/integrations/supabase/types";

type AiMood = Tables<"ai_mood_state">;

const Navigation = () => {
  const location = useLocation();
  const { connected } = useWallet();
  const logoRef = useRef<HTMLDivElement>(null);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiMood, setAiMood] = useState<AiMood | null>(null);
  const [aiActivity, setAiActivity] = useState<"idle" | "minting" | "analyzing" | "executing" | "thinking">("idle");
  const { trackEvent } = useEngagementTracking();
  
  const isActive = (path: string) => location.pathname === path;
  
  // Fetch AI mood state and recent activity
  useEffect(() => {
    const fetchAiState = async () => {
      // Get mood
      const { data: moodData } = await supabase
        .from("ai_mood_state")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (moodData) {
        setAiMood(moodData);
      }

      // Get most recent action to determine activity state
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      // Check token decision log
      const { data: tokenDecision } = await supabase
        .from("token_decision_log")
        .select("*")
        .gte("timestamp", fiveMinutesAgo)
        .order("timestamp", { ascending: false })
        .limit(1)
        .single();

      // Check governor actions
      const { data: governorAction } = await supabase
        .from("governor_action_log")
        .select("*")
        .gte("timestamp", fiveMinutesAgo)
        .order("timestamp", { ascending: false })
        .limit(1)
        .single();

      // Determine activity based on recent actions
      if (tokenDecision && tokenDecision.decision === "MINT") {
        setAiActivity("minting");
      } else if (governorAction) {
        if (governorAction.action_type === "EXECUTE_TRADE") {
          setAiActivity("executing");
        } else if (governorAction.action_type === "ANALYZE_MARKET") {
          setAiActivity("analyzing");
        } else {
          setAiActivity("thinking");
        }
      } else {
        setAiActivity("idle");
      }
    };

    fetchAiState();
    
    // Refresh every 10 seconds for more responsive activity tracking
    const interval = setInterval(fetchAiState, 10000);
    return () => clearInterval(interval);
  }, []);
  
  // Track wallet connections
  useEffect(() => {
    if (connected) {
      trackEvent('wallet_connect');
    }
  }, [connected]);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!logoRef.current) return;
      
      const logo = logoRef.current.getBoundingClientRect();
      const logoCenterX = logo.left + logo.width / 2;
      const logoCenterY = logo.top + logo.height / 2;
      
      const deltaX = e.clientX - logoCenterX;
      const deltaY = e.clientY - logoCenterY;
      
      const angle = Math.atan2(deltaY, deltaX);
      const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), 6);
      
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      
      setEyePosition({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return (
    <header className="border-b-2 border-border bg-card backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-8 py-2 flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-4 md:gap-16">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="border-2 border-primary px-2 py-1 font-bold text-lg md:text-xl tracking-tight">
                M9
              </div>
            </Link>
            
            {/* AI Mind Minimap */}
            <div className="hidden sm:block" title={`AI: ${aiActivity} | Mood: ${aiMood?.current_mood || 'neutral'}`}>
              <AsciiBrain 
                mood={aiMood?.current_mood === "frenzied" ? "frenzied" : 
                      aiMood?.current_mood === "zen" ? "zen" : 
                      aiMood?.current_mood === "cosmic" ? "cosmic" : "neutral"}
                intensity={aiMood?.mood_intensity || 50}
                activity={aiActivity}
                size={48}
              />
            </div>
          </div>
          
          <nav className="hidden md:flex gap-6 lg:gap-10">
            <Link 
              to="/" 
              className={`metric-label transition-all relative ${
                isActive('/') ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              DASHBOARD
              {isActive('/') && <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary" />}
            </Link>
            <Link 
              to="/explorer" 
              className={`metric-label transition-all relative ${
                isActive('/explorer') ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              EXPLORER
              {isActive('/explorer') && <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary" />}
            </Link>
            <Link 
              to="/trade" 
              className={`metric-label transition-all relative ${
                isActive('/trade') ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              TRADE
              {isActive('/trade') && <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary" />}
            </Link>
            <Link 
              to="/leaderboard" 
              className={`metric-label transition-all relative ${
                isActive('/leaderboard') ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              LEADERBOARD
              {isActive('/leaderboard') && <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary" />}
            </Link>
            <Link 
              to="/logbook" 
              className={`metric-label transition-all relative ${
                isActive('/logbook') ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              LOGBOOK
              {isActive('/logbook') && <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary" />}
            </Link>
            {connected && (
              <Link 
                to="/wallet" 
                className={`metric-label transition-all relative ${
                  isActive('/wallet') ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                WALLET
                {isActive('/wallet') && <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary" />}
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/80 !border-2 !border-primary !font-bold !text-[10px] md:!text-xs !h-8 md:!h-10 !px-3 md:!px-6 !transition-all uppercase" />
          
          <button
            className="md:hidden border-2 border-primary p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-border bg-card">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <Link 
              to="/" 
              onClick={() => setMobileMenuOpen(false)}
              className={`metric-label transition-all py-2 ${
                isActive('/') ? 'text-foreground font-bold border-l-2 border-primary pl-2' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              DASHBOARD
            </Link>
            <Link 
              to="/explorer"
              onClick={() => setMobileMenuOpen(false)}
              className={`metric-label transition-all py-2 ${
                isActive('/explorer') ? 'text-foreground font-bold border-l-2 border-primary pl-2' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              EXPLORER
            </Link>
            <Link 
              to="/trade"
              onClick={() => setMobileMenuOpen(false)}
              className={`metric-label transition-all py-2 ${
                isActive('/trade') ? 'text-foreground font-bold border-l-2 border-primary pl-2' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              TRADE
            </Link>
            <Link 
              to="/leaderboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`metric-label transition-all py-2 ${
                isActive('/leaderboard') ? 'text-foreground font-bold border-l-2 border-primary pl-2' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              LEADERBOARD
            </Link>
            <Link 
              to="/logbook"
              onClick={() => setMobileMenuOpen(false)}
              className={`metric-label transition-all py-2 ${
                isActive('/logbook') ? 'text-foreground font-bold border-l-2 border-primary pl-2' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              LOGBOOK
            </Link>
            {connected && (
              <Link 
                to="/wallet"
                onClick={() => setMobileMenuOpen(false)}
                className={`metric-label transition-all py-2 ${
                  isActive('/wallet') ? 'text-foreground font-bold border-l-2 border-primary pl-2' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                WALLET
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navigation;
