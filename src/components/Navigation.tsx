import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <header className="border-b-2 border-black bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-screen-xl">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-bold text-2xl pixel-text hover:text-primary transition-colors">
            {'>'} VISIONFLOW
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <Link 
              to="/" 
              className={`terminal-text hover:text-primary transition-colors ${
                isActive('/') ? 'text-primary font-bold' : 'text-foreground'
              }`}
            >
              01 {'>'} DASHBOARD
            </Link>
            <Link 
              to="/explorer" 
              className={`terminal-text hover:text-primary transition-colors ${
                isActive('/explorer') ? 'text-primary font-bold' : 'text-foreground'
              }`}
            >
              02 {'>'} EXPLORER
            </Link>
            <Link 
              to="/leaderboard" 
              className={`terminal-text hover:text-primary transition-colors ${
                isActive('/leaderboard') ? 'text-primary font-bold' : 'text-foreground'
              }`}
            >
              03 {'>'} LEADERBOARD
            </Link>
            <Link 
              to="/settings" 
              className={`terminal-text hover:text-primary transition-colors ${
                isActive('/settings') ? 'text-primary font-bold' : 'text-foreground'
              }`}
            >
              04 {'>'} SETTINGS
            </Link>
          </nav>
        </div>

        <button className="bg-primary text-primary-foreground px-8 py-3 font-bold text-sm hover:opacity-90 transition-opacity border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          &lt; CONNECT &gt;
        </button>
      </div>
    </header>
  );
};

export default Navigation;
