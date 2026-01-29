import { useEffect, useState, useCallback, useRef } from "react";

const BackgroundGlitch = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [glitchLines, setGlitchLines] = useState<Array<{ top: number; offset: number; opacity: number }>>([]);
  const [isGlitching, setIsGlitching] = useState(false);
  const lastMouseMove = useRef(Date.now());

  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
      lastMouseMove.current = Date.now();

      // Trigger micro-glitch on fast mouse movement
      const speed = Math.abs(e.movementX) + Math.abs(e.movementY);
      if (speed > 50 && Math.random() > 0.7) {
        triggerGlitch();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Trigger a glitch burst
  const triggerGlitch = useCallback(() => {
    setIsGlitching(true);
    
    // Create random horizontal tear lines
    const lines = Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => ({
      top: Math.random() * 100,
      offset: (Math.random() - 0.5) * 10,
      opacity: 0.3 + Math.random() * 0.4,
    }));
    setGlitchLines(lines);

    setTimeout(() => {
      setIsGlitching(false);
      setGlitchLines([]);
    }, 80 + Math.random() * 120);
  }, []);

  // Periodic random glitches
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.5) {
        triggerGlitch();
      }
    }, 2000 + Math.random() * 3000);

    return () => clearInterval(interval);
  }, [triggerGlitch]);

  // Calculate subtle parallax offset based on mouse
  const parallaxX = mousePos.x * 3;
  const parallaxY = mousePos.y * 2;

  return (
    <div className="fixed inset-0 pointer-events-none z-[50] overflow-hidden" aria-hidden="true">
      {/* Ambient floating grid that responds to mouse */}
      <div 
        className="absolute inset-0 opacity-[0.04] transition-transform duration-300 ease-out"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.15) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          transform: `translate(${parallaxX}px, ${parallaxY}px)`,
        }}
      />

      {/* Subtle vignette that follows cursor */}
      <div 
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(
            circle at ${50 + mousePos.x * 10}% ${50 + mousePos.y * 10}%,
            transparent 20%,
            hsl(var(--background) / 0.3) 80%
          )`,
        }}
      />

      {/* Horizontal glitch lines */}
      {glitchLines.map((line, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 h-[2px] bg-primary transition-none"
          style={{
            top: `${line.top}%`,
            transform: `translateX(${line.offset}px)`,
            opacity: line.opacity,
            boxShadow: `0 0 10px 2px hsl(var(--primary) / 0.4)`,
          }}
        />
      ))}

      {/* RGB split overlay during glitch */}
      {isGlitching && (
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              90deg,
              hsl(0 100% 50% / 0.03) 0%,
              transparent 10%,
              transparent 90%,
              hsl(180 100% 50% / 0.03) 100%
            )`,
          }}
        />
      )}

      {/* Floating corner brackets that respond to mouse */}
      <div 
        className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary/20 transition-transform duration-200"
        style={{ transform: `translate(${-parallaxX * 0.5}px, ${-parallaxY * 0.5}px)` }}
      />
      <div 
        className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-primary/20 transition-transform duration-200"
        style={{ transform: `translate(${parallaxX * 0.5}px, ${-parallaxY * 0.5}px)` }}
      />
      <div 
        className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-primary/20 transition-transform duration-200"
        style={{ transform: `translate(${-parallaxX * 0.5}px, ${parallaxY * 0.5}px)` }}
      />
      <div 
        className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary/20 transition-transform duration-200"
        style={{ transform: `translate(${parallaxX * 0.5}px, ${parallaxY * 0.5}px)` }}
      />

      {/* Scanning line that moves with mouse Y */}
      <div 
        className="absolute left-0 right-0 h-[1px] bg-primary/20 transition-all duration-150"
        style={{
          top: `${50 + mousePos.y * 30}%`,
          boxShadow: '0 0 20px 3px hsl(var(--primary) / 0.15)',
        }}
      />

      {/* Data streams on edges */}
      <div className="absolute right-0 top-0 bottom-0 w-[1px] overflow-hidden opacity-30">
        <div 
          className="h-[200%] w-full bg-gradient-to-b from-transparent via-primary to-transparent"
          style={{
            animation: 'data-stream 3s linear infinite',
          }}
        />
      </div>
      <div className="absolute left-0 top-0 bottom-0 w-[1px] overflow-hidden opacity-20">
        <div 
          className="h-[200%] w-full bg-gradient-to-b from-transparent via-primary to-transparent"
          style={{
            animation: 'data-stream 5s linear infinite',
            animationDelay: '-2s',
          }}
        />
      </div>

      {/* Subtle noise texture */}
      <div 
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

export default BackgroundGlitch;
