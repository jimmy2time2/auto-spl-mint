import { useEffect, useState, useCallback } from "react";

interface GlitchState {
  active: boolean;
  type: 'shift' | 'flicker' | 'distort' | 'chromatic' | 'none';
  intensity: number;
}

const BackgroundGlitch = () => {
  const [glitch, setGlitch] = useState<GlitchState>({ active: false, type: 'none', intensity: 0 });

  const triggerGlitch = useCallback(() => {
    const types: GlitchState['type'][] = ['shift', 'flicker', 'distort', 'chromatic'];
    const selectedType = types[Math.floor(Math.random() * types.length)];
    const intensity = 0.5 + Math.random() * 0.5;

    setGlitch({ active: true, type: selectedType, intensity });

    // Quick burst - real glitches are brief
    const duration = 50 + Math.random() * 100;
    setTimeout(() => {
      setGlitch({ active: false, type: 'none', intensity: 0 });
    }, duration);

    // Sometimes do a double-tap glitch (more realistic)
    if (Math.random() > 0.7) {
      setTimeout(() => {
        setGlitch({ active: true, type: selectedType, intensity: intensity * 0.6 });
        setTimeout(() => {
          setGlitch({ active: false, type: 'none', intensity: 0 });
        }, 30 + Math.random() * 50);
      }, duration + 30);
    }
  }, []);

  useEffect(() => {
    // Natural timing - clusters of glitches then quiet periods
    let timeoutId: NodeJS.Timeout;
    
    const scheduleNext = () => {
      // Vary timing: sometimes quick succession, sometimes longer gaps
      const baseDelay = Math.random() > 0.3 
        ? 4000 + Math.random() * 8000  // Normal: 4-12 seconds
        : 800 + Math.random() * 1500;   // Burst mode: 0.8-2.3 seconds
      
      timeoutId = setTimeout(() => {
        if (Math.random() > 0.25) { // 75% chance to actually glitch
          triggerGlitch();
        }
        scheduleNext();
      }, baseDelay);
    };

    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, [triggerGlitch]);

  // Apply glitch effect to the entire page
  useEffect(() => {
    const root = document.documentElement;
    
    if (glitch.active) {
      switch (glitch.type) {
        case 'shift':
          // Horizontal displacement like a CRT
          root.style.transform = `translateX(${(Math.random() - 0.5) * 6 * glitch.intensity}px)`;
          root.style.transition = 'none';
          break;
        case 'flicker':
          // Brief brightness/opacity flicker
          root.style.filter = `brightness(${0.85 + Math.random() * 0.3})`;
          break;
        case 'distort':
          // Slight skew distortion
          root.style.transform = `skewX(${(Math.random() - 0.5) * 0.5 * glitch.intensity}deg)`;
          root.style.transition = 'none';
          break;
        case 'chromatic':
          // We'll handle this with CSS class
          root.classList.add('glitch-chromatic');
          break;
      }
    } else {
      root.style.transform = '';
      root.style.filter = '';
      root.style.transition = '';
      root.classList.remove('glitch-chromatic');
    }

    return () => {
      root.style.transform = '';
      root.style.filter = '';
      root.style.transition = '';
      root.classList.remove('glitch-chromatic');
    };
  }, [glitch]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]" aria-hidden="true">
      {/* Scanline overlay - always present, subtle */}
      <div className="absolute inset-0 bg-scanlines opacity-[0.03]" />
      
      {/* Horizontal tear line - appears during glitch */}
      {glitch.active && glitch.type === 'shift' && (
        <div 
          className="absolute left-0 right-0 h-[2px] bg-primary/50"
          style={{
            top: `${20 + Math.random() * 60}%`,
            boxShadow: '0 0 8px 1px hsl(var(--primary) / 0.4)',
          }}
        />
      )}

      {/* Static noise burst */}
      {glitch.active && (
        <div 
          className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Persistent but subtle corner brackets */}
      <div className="absolute top-3 left-3 w-6 h-6 border-l border-t border-primary/10" />
      <div className="absolute top-3 right-3 w-6 h-6 border-r border-t border-primary/10" />
      <div className="absolute bottom-3 left-3 w-6 h-6 border-l border-b border-primary/10" />
      <div className="absolute bottom-3 right-3 w-6 h-6 border-r border-b border-primary/10" />
    </div>
  );
};

export default BackgroundGlitch;
