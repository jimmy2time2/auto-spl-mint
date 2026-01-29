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

      // Trigger micro-glitch on fast mouse movement (more sensitive)
      const speed = Math.abs(e.movementX) + Math.abs(e.movementY);
      if (speed > 25 && Math.random() > 0.5) {
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
    const lines = Array.from({ length: 3 + Math.floor(Math.random() * 5) }, () => ({
      top: Math.random() * 100,
      offset: (Math.random() - 0.5) * 25,
      opacity: 0.4 + Math.random() * 0.5,
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

  // Calculate stronger parallax offset based on mouse
  const parallaxX = mousePos.x * 15;
  const parallaxY = mousePos.y * 12;

  return (
    <div className="fixed inset-0 pointer-events-none z-[50] overflow-hidden" aria-hidden="true">
      {/* Ambient floating grid that responds to mouse */}
      <div 
        className="absolute inset-[-50px] opacity-[0.06] transition-transform duration-150 ease-out"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.2) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: `translate(${parallaxX}px, ${parallaxY}px)`,
        }}
      />
      
      {/* Secondary grid layer with opposite parallax */}
      <div 
        className="absolute inset-[-30px] opacity-[0.03] transition-transform duration-200 ease-out"
        style={{
          backgroundImage: `
            linear-gradient(45deg, hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(-45deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          transform: `translate(${-parallaxX * 0.5}px, ${-parallaxY * 0.5}px)`,
        }}
      />

      {/* Vignette that follows cursor more dramatically */}
      <div 
        className="absolute inset-0 transition-all duration-200"
        style={{
          background: `radial-gradient(
            ellipse 60% 50% at ${50 + mousePos.x * 25}% ${50 + mousePos.y * 25}%,
            transparent 10%,
            hsl(var(--background) / 0.4) 60%,
            hsl(var(--background) / 0.6) 100%
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

      {/* Floating corner brackets that respond to mouse - larger and more movement */}
      <div 
        className="absolute top-6 left-6 w-12 h-12 border-l-2 border-t-2 border-primary/30 transition-transform duration-100"
        style={{ transform: `translate(${-parallaxX * 1.2}px, ${-parallaxY * 1.2}px)` }}
      />
      <div 
        className="absolute top-6 right-6 w-12 h-12 border-r-2 border-t-2 border-primary/30 transition-transform duration-100"
        style={{ transform: `translate(${parallaxX * 1.2}px, ${-parallaxY * 1.2}px)` }}
      />
      <div 
        className="absolute bottom-6 left-6 w-12 h-12 border-l-2 border-b-2 border-primary/30 transition-transform duration-100"
        style={{ transform: `translate(${-parallaxX * 1.2}px, ${parallaxY * 1.2}px)` }}
      />
      <div 
        className="absolute bottom-6 right-6 w-12 h-12 border-r-2 border-b-2 border-primary/30 transition-transform duration-100"
        style={{ transform: `translate(${parallaxX * 1.2}px, ${parallaxY * 1.2}px)` }}
      />
      
      {/* Inner floating brackets with inverted movement */}
      <div 
        className="absolute top-16 left-16 w-6 h-6 border-l border-t border-primary/15 transition-transform duration-150"
        style={{ transform: `translate(${parallaxX * 0.8}px, ${parallaxY * 0.8}px)` }}
      />
      <div 
        className="absolute top-16 right-16 w-6 h-6 border-r border-t border-primary/15 transition-transform duration-150"
        style={{ transform: `translate(${-parallaxX * 0.8}px, ${parallaxY * 0.8}px)` }}
      />
      <div 
        className="absolute bottom-16 left-16 w-6 h-6 border-l border-b border-primary/15 transition-transform duration-150"
        style={{ transform: `translate(${parallaxX * 0.8}px, ${-parallaxY * 0.8}px)` }}
      />
      <div 
        className="absolute bottom-16 right-16 w-6 h-6 border-r border-b border-primary/15 transition-transform duration-150"
        style={{ transform: `translate(${-parallaxX * 0.8}px, ${-parallaxY * 0.8}px)` }}
      />

      {/* Scanning line that moves with mouse Y - more visible */}
      <div 
        className="absolute left-0 right-0 h-[2px] bg-primary/40 transition-all duration-100"
        style={{
          top: `${50 + mousePos.y * 40}%`,
          boxShadow: '0 0 30px 5px hsl(var(--primary) / 0.3)',
        }}
      />
      
      {/* Secondary horizontal line moving opposite */}
      <div 
        className="absolute left-0 right-0 h-[1px] bg-primary/20 transition-all duration-200"
        style={{
          top: `${50 - mousePos.y * 20}%`,
          boxShadow: '0 0 15px 2px hsl(var(--primary) / 0.1)',
        }}
      />
      
      {/* Vertical scanning line that moves with mouse X */}
      <div 
        className="absolute top-0 bottom-0 w-[1px] bg-primary/25 transition-all duration-100"
        style={{
          left: `${50 + mousePos.x * 35}%`,
          boxShadow: '0 0 20px 3px hsl(var(--primary) / 0.2)',
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
