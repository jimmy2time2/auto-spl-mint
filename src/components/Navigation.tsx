import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <header className="border-b-2 border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-12">
          <Link to="/" className="font-bold text-xl tracking-wider hover:text-primary transition-colors uppercase">
            VisionFlow
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
          </nav>
        </div>

        <button className="bg-primary text-primary-foreground px-6 py-2 border-2 border-black font-bold text-xs uppercase tracking-widest hover:bg-black hover:text-primary transition-all">
          Connect Wallet
        </button>
      </div>
    </header>
  );
};

export default Navigation;
