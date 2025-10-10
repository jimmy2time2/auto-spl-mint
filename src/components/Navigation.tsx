import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useEngagementTracking } from "@/hooks/useEngagementTracking";

const Navigation = () => {
  const location = useLocation();
  const { connected } = useWallet();
  const logoRef = useRef<HTMLDivElement>(null);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const { trackEvent } = useEngagementTracking();
  
  const isActive = (path: string) => location.pathname === path;
  
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
      <div className="container mx-auto px-8 py-2 flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="border-2 border-primary px-2 py-1 font-bold text-xl tracking-tight">
              M9
            </div>
          </Link>
          
          <nav className="hidden md:flex gap-10">
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
              to="/leaderboard" 
              className={`metric-label transition-all relative ${
                isActive('/leaderboard') ? 'text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              LEADERBOARD
              {isActive('/leaderboard') && <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary" />}
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

        <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/80 !border-2 !border-primary !font-bold !text-xs !h-10 !px-6 !transition-all uppercase" />
      </div>
    </header>
  );
};

export default Navigation;
