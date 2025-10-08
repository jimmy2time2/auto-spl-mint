import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const location = useLocation();
  const { connected } = useWallet();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-8 py-5 flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-primary/80" />
            </div>
            <span className="font-semibold text-xl tracking-tight">MIND9</span>
          </Link>
          
          <nav className="hidden md:flex gap-10">
            <Link 
              to="/" 
              className={`metric-label transition-all relative ${
                isActive('/') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Dashboard
              {isActive('/') && <div className="absolute -bottom-5 left-0 right-0 h-0.5 bg-primary" />}
            </Link>
            <Link 
              to="/explorer" 
              className={`metric-label transition-all relative ${
                isActive('/explorer') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Explorer
              {isActive('/explorer') && <div className="absolute -bottom-5 left-0 right-0 h-0.5 bg-primary" />}
            </Link>
            <Link 
              to="/leaderboard" 
              className={`metric-label transition-all relative ${
                isActive('/leaderboard') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Leaderboard
              {isActive('/leaderboard') && <div className="absolute -bottom-5 left-0 right-0 h-0.5 bg-primary" />}
            </Link>
            <Link 
              to="/mint" 
              className={`metric-label transition-all relative ${
                isActive('/mint') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mint
              {isActive('/mint') && <div className="absolute -bottom-5 left-0 right-0 h-0.5 bg-primary" />}
            </Link>
            {connected && (
              <Link 
                to="/wallet" 
                className={`metric-label transition-all relative ${
                  isActive('/wallet') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Wallet
                {isActive('/wallet') && <div className="absolute -bottom-5 left-0 right-0 h-0.5 bg-primary" />}
              </Link>
            )}
          </nav>
        </div>

        <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/80 !border !border-border/50 !rounded-xl !font-medium !text-xs !h-10 !px-6 !transition-all" />
      </div>
    </header>
  );
};

export default Navigation;
