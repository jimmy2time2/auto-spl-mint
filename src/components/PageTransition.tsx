import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);

  const getRouteLabel = (path: string) => {
    const routes: Record<string, string> = {
      "/": "DASHBOARD",
      "/explorer": "EXPLORER",
      "/leaderboard": "LEADERBOARD",
      "/wallet": "WALLET",
      "/logbook": "LOGBOOK",
      "/dao": "DAO",
    };
    if (path.startsWith("/token/")) return "TOKEN_DETAIL";
    return routes[path] || "UNKNOWN";
  };

  useEffect(() => {
    if (children !== displayChildren) {
      setIsTransitioning(true);
      
      const routeLabel = getRouteLabel(location.pathname);
      const lines = [
        `> NAVIGATING TO /${routeLabel.toLowerCase()}`,
        "> LOADING MODULE...",
        "> INITIALIZING VIEW...",
        `> ${routeLabel} READY`,
      ];
      
      let lineIndex = 0;
      setTerminalLines([]);
      
      const lineInterval = setInterval(() => {
        if (lineIndex < lines.length) {
          setTerminalLines(prev => [...prev, lines[lineIndex]]);
          lineIndex++;
        } else {
          clearInterval(lineInterval);
        }
      }, 80);

      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setIsTransitioning(false);
        setTerminalLines([]);
      }, 400);

      return () => {
        clearTimeout(timer);
        clearInterval(lineInterval);
      };
    }
  }, [children, displayChildren, location.pathname]);

  return (
    <div className="relative min-h-screen">
      {/* Terminal transition overlay */}
      <div
        className={`fixed inset-0 z-[100] pointer-events-none transition-opacity duration-150 ${
          isTransitioning ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-background/95" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="font-mono text-primary text-sm space-y-1">
            {terminalLines.map((line, i) => (
              <div 
                key={i} 
                className="animate-fade-in flex items-center gap-2"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="text-muted-foreground">[M9]</span>
                <span>{line}</span>
                {i === terminalLines.length - 1 && (
                  <span className="cursor-blink">█</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Scan line animation during transition */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className={`absolute left-0 right-0 h-1 bg-primary/30 ${
              isTransitioning ? "animate-scan" : ""
            }`}
            style={{
              boxShadow: "0 0 20px 10px hsl(var(--primary) / 0.3)",
            }}
          />
        </div>
      </div>

      {/* Page content */}
      <div
        className={`transition-all duration-200 ${
          isTransitioning ? "opacity-50 scale-[0.99]" : "opacity-100 scale-100"
        }`}
      >
        {displayChildren}
      </div>
    </div>
  );
};

export default PageTransition;
