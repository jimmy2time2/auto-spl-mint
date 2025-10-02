import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <header className="border-b border-border bg-card sticky top-0 z-50 backdrop-blur-xl bg-opacity-90">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-12">
          <Link to="/" className="font-bold text-xl tracking-tight hover:text-primary transition-colors">
            VisionFlow
          </Link>
          
          <nav className="hidden md:flex gap-8">
            <Link 
              to="/" 
              className={`text-sm font-medium hover:text-foreground transition-colors ${
                isActive('/') ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/explorer" 
              className={`text-sm font-medium hover:text-foreground transition-colors ${
                isActive('/explorer') ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Explorer
            </Link>
            <Link 
              to="/leaderboard" 
              className={`text-sm font-medium hover:text-foreground transition-colors ${
                isActive('/leaderboard') ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Leaderboard
            </Link>
            <Link 
              to="/settings" 
              className={`text-sm font-medium hover:text-foreground transition-colors ${
                isActive('/settings') ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Settings
            </Link>
          </nav>
        </div>

        <button className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity">
          Connect Wallet
        </button>
      </div>
    </header>
  );
};

export default Navigation;
