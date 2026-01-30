import { useEffect, useState, useRef } from "react";

const BackgroundGlitch = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const lastMouseMove = useRef(Date.now());

  // Track mouse movement - smooth and subtle
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
      lastMouseMove.current = Date.now();
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Subtle parallax - much gentler
  const parallaxX = mousePos.x * 4;
  const parallaxY = mousePos.y * 3;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Subtle grid that gently responds to mouse */}
      <div 
        className="absolute inset-[-20px] opacity-[0.03] transition-transform duration-300 ease-out"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          transform: `translate(${parallaxX}px, ${parallaxY}px)`,
        }}
      />

      {/* Soft vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(
            ellipse 80% 70% at 50% 50%,
            transparent 20%,
            hsl(var(--background) / 0.3) 80%,
            hsl(var(--background) / 0.5) 100%
          )`,
        }}
      />

      {/* Subtle corner brackets */}
      <div 
        className="absolute top-4 left-4 w-6 h-6 border-l border-t border-primary/10 transition-transform duration-200"
        style={{ transform: `translate(${-parallaxX * 0.5}px, ${-parallaxY * 0.5}px)` }}
      />
      <div 
        className="absolute top-4 right-4 w-6 h-6 border-r border-t border-primary/10 transition-transform duration-200"
        style={{ transform: `translate(${parallaxX * 0.5}px, ${-parallaxY * 0.5}px)` }}
      />
      <div 
        className="absolute bottom-4 left-4 w-6 h-6 border-l border-b border-primary/10 transition-transform duration-200"
        style={{ transform: `translate(${-parallaxX * 0.5}px, ${parallaxY * 0.5}px)` }}
      />
      <div 
        className="absolute bottom-4 right-4 w-6 h-6 border-r border-b border-primary/10 transition-transform duration-200"
        style={{ transform: `translate(${parallaxX * 0.5}px, ${parallaxY * 0.5}px)` }}
      />

      {/* Single subtle scan line that follows cursor Y */}
      <div 
        className="absolute left-0 right-0 h-px bg-primary/10 transition-all duration-300 ease-out"
        style={{
          top: `${50 + mousePos.y * 15}%`,
        }}
      />
    </div>
  );
};

export default BackgroundGlitch;
