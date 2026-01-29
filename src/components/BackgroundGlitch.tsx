import { useEffect, useState } from "react";

const BackgroundGlitch = () => {
  const [glitchActive, setGlitchActive] = useState(false);
  const [glitchPosition, setGlitchPosition] = useState({ top: 0, height: 50 });

  useEffect(() => {
    // Random glitch trigger - MORE NOTICEABLE
    const triggerGlitch = () => {
      const shouldGlitch = Math.random() > 0.4; // 60% chance (was 30%)
      
      if (shouldGlitch) {
        setGlitchPosition({
          top: Math.random() * 90, // Random vertical position (0-90%)
          height: 30 + Math.random() * 120, // Random height (30-150px)
        });
        setGlitchActive(true);
        
        // Glitch duration - longer for more visibility
        setTimeout(() => {
          setGlitchActive(false);
        }, 150 + Math.random() * 250);
      }
    };

    // Schedule random glitches - more frequent
    const interval = setInterval(triggerGlitch, 1500 + Math.random() * 2500);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[50]" aria-hidden="true">
      {/* Ambient grid pulse - more visible */}
      <div className="absolute inset-0 opacity-[0.05] bg-grid-pattern animate-grid-pulse" />
      
      {/* Random horizontal glitch lines - enhanced */}
      <div
        className={`absolute left-0 right-0 transition-opacity duration-50 ${
          glitchActive ? "opacity-100" : "opacity-0"
        }`}
        style={{
          top: `${glitchPosition.top}%`,
          height: `${glitchPosition.height}px`,
        }}
      >
        {/* Primary glitch bar - thicker and brighter */}
        <div 
          className="h-[3px] bg-primary/40"
          style={{
            boxShadow: "0 0 20px 4px hsl(var(--primary) / 0.35)",
          }}
        />
        {/* RGB split effect - more pronounced */}
        <div 
          className="h-[2px] bg-neon-cyan/25 mt-1"
          style={{
            transform: `translateX(${Math.random() * 20 - 10}px)`,
          }}
        />
        <div 
          className="h-[1px] bg-red-500/20 -mt-2"
          style={{
            transform: `translateX(${Math.random() * -15}px)`,
          }}
        />
      </div>

      {/* Secondary glitch bar - appears randomly */}
      {glitchActive && Math.random() > 0.5 && (
        <div
          className="absolute left-0 right-0 h-[2px] bg-primary/30"
          style={{
            top: `${(glitchPosition.top + 20) % 100}%`,
            boxShadow: "0 0 15px 2px hsl(var(--primary) / 0.25)",
          }}
        />
      )}

      {/* Corner flickers - more visible */}
      <div className={`absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-primary/20 transition-opacity duration-75 ${
        glitchActive ? "opacity-60" : "opacity-10"
      }`} />
      <div className={`absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-primary/20 transition-opacity duration-75 ${
        glitchActive ? "opacity-60" : "opacity-10"
      }`} />
      <div className={`absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-primary/20 transition-opacity duration-75 ${
        glitchActive ? "opacity-60" : "opacity-10"
      }`} />
      <div className={`absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-primary/20 transition-opacity duration-75 ${
        glitchActive ? "opacity-60" : "opacity-10"
      }`} />

      {/* Data stream visualizations - more prominent */}
      <div className="absolute right-0 top-0 bottom-0 w-[2px] overflow-hidden opacity-40">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-primary/70 to-transparent animate-data-stream" />
      </div>
      <div className="absolute left-0 top-0 bottom-0 w-[2px] overflow-hidden opacity-25">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-primary/50 to-transparent animate-data-stream-slow" />
      </div>

      {/* Additional horizontal scan line */}
      <div 
        className="absolute left-0 right-0 h-[1px] bg-primary/15 animate-scan"
        style={{ animationDuration: '4s' }}
      />
    </div>
  );
};

export default BackgroundGlitch;
