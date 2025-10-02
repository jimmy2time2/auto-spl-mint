import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <header className="border-b border-border bg-card sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-screen-xl">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-bold text-xl terminal-text hover:text-primary transition-colors">
            VISIONFLOW
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <Link 
              to="/" 
              className={`text-sm font-medium hover:text-primary transition-colors ${
                isActive('/') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/explorer" 
              className={`text-sm font-medium hover:text-primary transition-colors ${
                isActive('/explorer') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Explorer
            </Link>
            <Link 
              to="/leaderboard" 
              className={`text-sm font-medium hover:text-primary transition-colors ${
                isActive('/leaderboard') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Leaderboard
            </Link>
            <Link 
              to="/settings" 
              className={`text-sm font-medium hover:text-primary transition-colors ${
                isActive('/settings') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Settings
            </Link>
          </nav>
        </div>

        <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-medium text-sm hover:opacity-90 transition-opacity shadow-sm">
          Connect Wallet
        </button>
      </div>
    </header>
  );
};

export default Navigation;
