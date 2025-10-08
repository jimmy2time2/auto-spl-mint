import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const location = useLocation();
  const { connected } = useWallet();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <header className="border-b-2 border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-12">
          <Link to="/" className="font-bold text-lg tracking-wider hover:text-primary transition-colors">
            <span className="font-mono">MIND9</span>
          </Link>
          
          <nav className="hidden md:flex gap-8">
            <Link 
              to="/" 
              className={`text-xs font-bold uppercase tracking-widest hover:text-foreground transition-colors ${
                isActive('/') ? 'text-foreground border-b-2 border-foreground pb-1' : 'text-muted-foreground'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/explorer" 
              className={`text-xs font-bold uppercase tracking-widest hover:text-foreground transition-colors ${
                isActive('/explorer') ? 'text-foreground border-b-2 border-foreground pb-1' : 'text-muted-foreground'
              }`}
            >
              Explorer
            </Link>
            <Link 
              to="/leaderboard" 
              className={`text-xs font-bold uppercase tracking-widest hover:text-foreground transition-colors ${
                isActive('/leaderboard') ? 'text-foreground border-b-2 border-foreground pb-1' : 'text-muted-foreground'
              }`}
            >
              Leaderboard
            </Link>
            <Link 
              to="/mint" 
              className={`text-xs font-bold uppercase tracking-widest hover:text-foreground transition-colors ${
                isActive('/mint') ? 'text-foreground border-b-2 border-foreground pb-1' : 'text-muted-foreground'
              }`}
            >
              Mint
            </Link>
            {connected && (
              <Link 
                to="/wallet" 
                className={`text-xs font-bold uppercase tracking-widest hover:text-foreground transition-colors ${
                  isActive('/wallet') ? 'text-foreground border-b-2 border-foreground pb-1' : 'text-muted-foreground'
                }`}
              >
                Wallet
              </Link>
            )}
          </nav>
        </div>

        <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !border-2 !border-border !font-bold !uppercase !tracking-widest !text-xs !h-10" />
      </div>
    </header>
  );
};

export default Navigation;
