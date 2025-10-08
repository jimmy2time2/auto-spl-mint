import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import WalletConnectDialog from "@/components/WalletConnectDialog";
import { Wallet, LogOut } from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  
  const isActive = (path: string) => location.pathname === path;
  
  const handleConnect = (address: string) => {
    setConnectedWallet(address);
  };

  const handleDisconnect = () => {
    setConnectedWallet(null);
  };
  
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
              to="/dao" 
              className={`text-xs font-bold uppercase tracking-widest hover:text-foreground transition-colors ${
                isActive('/dao') ? 'text-foreground border-b-2 border-foreground pb-1' : 'text-muted-foreground'
              }`}
            >
              DAO
            </Link>
            <Link 
              to="/leaderboard" 
              className={`text-xs font-bold uppercase tracking-widest hover:text-foreground transition-colors ${
                isActive('/leaderboard') ? 'text-foreground border-b-2 border-foreground pb-1' : 'text-muted-foreground'
              }`}
            >
              Leaderboard
            </Link>
          </nav>
        </div>

        {connectedWallet ? (
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">CONNECTED</div>
              <div className="font-mono text-xs">{connectedWallet}</div>
            </div>
            <Button
              onClick={handleDisconnect}
              variant="outline"
              className="border-2 border-black font-bold text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all"
            >
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">DISCONNECT</span>
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setWalletDialogOpen(true)}
            className="bg-primary text-primary-foreground px-6 py-2 border-2 border-black font-bold text-xs uppercase tracking-widest hover:bg-black hover:text-primary transition-all"
          >
            <Wallet className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">CONNECT</span>
          </Button>
        )}
      </div>

      <WalletConnectDialog 
        open={walletDialogOpen}
        onOpenChange={setWalletDialogOpen}
        onConnect={handleConnect}
      />
    </header>
  );
};

export default Navigation;
