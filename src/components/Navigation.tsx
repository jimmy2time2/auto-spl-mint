import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="border-b-2 border-black bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold tracking-wider hover:opacity-70 transition-opacity">
              <span className="terminal-text">{'>'} VISIONFLOW_</span>
            </Link>
            
            <div className="hidden md:flex gap-6">
              <Link 
                to="/" 
                className={`terminal-text transition-opacity ${isActive('/') ? 'font-bold' : 'hover:opacity-70'}`}
              >
                [DASHBOARD]
              </Link>
              <Link 
                to="/explorer" 
                className={`terminal-text transition-opacity ${isActive('/explorer') ? 'font-bold' : 'hover:opacity-70'}`}
              >
                [EXPLORER]
              </Link>
              <Link 
                to="/leaderboard" 
                className={`terminal-text transition-opacity ${isActive('/leaderboard') ? 'font-bold' : 'hover:opacity-70'}`}
              >
                [LEADERBOARD]
              </Link>
              <Link 
                to="/settings" 
                className={`terminal-text transition-opacity ${isActive('/settings') ? 'font-bold' : 'hover:opacity-70'}`}
              >
                [SETTINGS]
              </Link>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="border-2 border-black hover:bg-black hover:text-background transition-all font-mono font-bold"
          >
            {'<'} CONNECT_WALLET {'>'}
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
