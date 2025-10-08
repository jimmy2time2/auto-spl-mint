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
    <header className="border-b border-foreground bg-background sticky top-0 z-50">
      <div className="container mx-auto px-3 py-2 flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-serif font-bold text-xl tracking-tighter">
            MIND9
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <Link 
              to="/" 
              className={`text-[10px] font-bold uppercase tracking-widest font-mono transition-colors ${
                isActive('/') ? 'text-foreground underline' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/explorer" 
              className={`text-[10px] font-bold uppercase tracking-widest font-mono transition-colors ${
                isActive('/explorer') ? 'text-foreground underline' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Explorer
            </Link>
            <Link 
              to="/dao" 
              className={`text-[10px] font-bold uppercase tracking-widest font-mono transition-colors ${
                isActive('/dao') ? 'text-foreground underline' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              DAO
            </Link>
            <Link 
              to="/leaderboard" 
              className={`text-[10px] font-bold uppercase tracking-widest font-mono transition-colors ${
                isActive('/leaderboard') ? 'text-foreground underline' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Leaderboard
            </Link>
          </nav>
        </div>

        {connectedWallet ? (
          <div className="flex items-center gap-2">
            <div className="hidden md:flex flex-col items-end">
              <div className="text-[8px] font-bold uppercase tracking-widest font-mono text-muted-foreground">Connected</div>
              <div className="font-mono text-[10px]">{connectedWallet}</div>
            </div>
            <Button
              onClick={handleDisconnect}
              variant="brutalist"
              size="sm"
              className="text-[10px] px-2 py-1 h-auto"
            >
              <LogOut className="w-3 h-3 md:mr-1" />
              <span className="hidden md:inline">Disconnect</span>
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setWalletDialogOpen(true)}
            variant="brutalist"
            size="sm"
            className="text-[10px] px-2 py-1 h-auto"
          >
            <Wallet className="w-3 h-3 md:mr-1" />
            <span className="hidden md:inline">Connect</span>
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
