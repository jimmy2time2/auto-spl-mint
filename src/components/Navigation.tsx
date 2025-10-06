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
    <header className="border-b-4 border-foreground bg-background sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between border-b-2 border-foreground">
        <Link to="/" className="text-2xl font-bold tracking-tight">
          MIND9
        </Link>
        
        <nav className="hidden md:flex gap-1">
          {[
            { path: '/', label: 'ACCUEIL' },
            { path: '/explorer', label: 'EXPLORER' },
            { path: '/dao', label: 'DAO' },
            { path: '/leaderboard', label: 'CLASSEMENT' }
          ].map(({ path, label }) => (
            <Link 
              key={path}
              to={path} 
              className={`text-[10px] font-bold uppercase tracking-widest px-3 py-2 border-2 border-foreground ${
                isActive(path) || (path === '/dao' && location.pathname.startsWith('/dao/'))
                  ? 'bg-foreground text-background' 
                  : 'bg-background hover:bg-muted'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <Button
          onClick={() => connectedWallet ? handleDisconnect() : setWalletDialogOpen(true)}
          className="bg-foreground text-background border-2 border-foreground px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-background hover:text-foreground"
        >
          {connectedWallet ? (
            <>
              <LogOut className="w-3 h-3 mr-2" />
              DÉCONNECTER
            </>
          ) : (
            <>
              <Wallet className="w-3 h-3 mr-2" />
              CONNECTER
            </>
          )}
        </Button>
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
