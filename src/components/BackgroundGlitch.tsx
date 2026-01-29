import { useEffect, useState } from "react";

const BackgroundGlitch = () => {
  const [glitchActive, setGlitchActive] = useState(false);
  const [glitchPosition, setGlitchPosition] = useState({ top: 0, height: 50 });

  useEffect(() => {
    // Random glitch trigger
    const triggerGlitch = () => {
      const shouldGlitch = Math.random() > 0.7; // 30% chance
      
      if (shouldGlitch) {
        setGlitchPosition({
          top: Math.random() * 80, // Random vertical position (0-80%)
          height: 20 + Math.random() * 80, // Random height (20-100px)
        });
        setGlitchActive(true);
        
        // Glitch duration
        setTimeout(() => {
          setGlitchActive(false);
        }, 100 + Math.random() * 150);
      }
    };

    // Schedule random glitches
    const interval = setInterval(triggerGlitch, 3000 + Math.random() * 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[50]" aria-hidden="true">
      {/* Subtle ambient grid pulse */}
      <div className="absolute inset-0 opacity-[0.02] bg-grid-pattern animate-grid-pulse" />
      
      {/* Random horizontal glitch lines */}
      <div
        className={`absolute left-0 right-0 transition-opacity duration-75 ${
          glitchActive ? "opacity-100" : "opacity-0"
        }`}
        style={{
          top: `${glitchPosition.top}%`,
          height: `${glitchPosition.height}px`,
        }}
      >
        {/* Glitch bar */}
        <div 
          className="h-[2px] bg-primary/20"
          style={{
            boxShadow: "0 0 10px 2px hsl(var(--primary) / 0.15)",
          }}
        />
        {/* Offset duplicate for RGB split effect */}
        <div 
          className="h-[1px] bg-neon-cyan/10 mt-1 ml-2"
          style={{
            transform: `translateX(${Math.random() * 10 - 5}px)`,
          }}
        />
      </div>

      {/* Subtle corner flickers */}
      <div className={`absolute top-4 left-4 w-8 h-8 border-l border-t border-primary/10 transition-opacity duration-100 ${
        glitchActive ? "opacity-30" : "opacity-5"
      }`} />
      <div className={`absolute top-4 right-4 w-8 h-8 border-r border-t border-primary/10 transition-opacity duration-100 ${
        glitchActive ? "opacity-30" : "opacity-5"
      }`} />
      <div className={`absolute bottom-4 left-4 w-8 h-8 border-l border-b border-primary/10 transition-opacity duration-100 ${
        glitchActive ? "opacity-30" : "opacity-5"
      }`} />
      <div className={`absolute bottom-4 right-4 w-8 h-8 border-r border-b border-primary/10 transition-opacity duration-100 ${
        glitchActive ? "opacity-30" : "opacity-5"
      }`} />

      {/* Occasional data stream visualization */}
      <div className="absolute right-0 top-0 bottom-0 w-px overflow-hidden opacity-20">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-primary/50 to-transparent animate-data-stream" />
      </div>
      <div className="absolute left-0 top-0 bottom-0 w-px overflow-hidden opacity-10">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-primary/30 to-transparent animate-data-stream-slow" />
      </div>
    </div>
  );
};

export default BackgroundGlitch;
