import { useEffect, useRef, useState } from "react";

interface AsciiBrainProps {
  mood?: "neutral" | "frenzied" | "protective" | "cosmic" | "zen";
  intensity?: number; // 0-100
  size?: number; // container size in pixels
  activity?: "idle" | "minting" | "analyzing" | "executing" | "thinking";
}

const AsciiBrain = ({ 
  mood = "neutral", 
  intensity = 50,
  size = 300,
  activity = "idle"
}: AsciiBrainProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noiseCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const noiseAnimationRef = useRef<number>();
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [showNoise, setShowNoise] = useState(false);

  // Helper to convert HSL to RGB
  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [255 * f(0), 255 * f(8), 255 * f(4)];
  };

  // Design system colors (bright green/lime for sphere effect)
  const designSystemColors = {
    brightGreen: hslToRgb(142, 100, 50),    // Bright green
    neonGreen: hslToRgb(142, 100, 60),      // Neon green
    limeGreen: hslToRgb(75, 100, 50),       // Lime green
    emerald: hslToRgb(142, 90, 45),         // Emerald
    mint: hslToRgb(142, 100, 70),           // Light mint
    darkGreen: hslToRgb(142, 100, 20),      // Dark green (center)
    forestGreen: hslToRgb(142, 90, 30),     // Forest green
    glowGreen: hslToRgb(142, 100, 55),      // Glow green
    black: hslToRgb(0, 0, 0),               // Black (background)
  };

  // Mood-based color schemes using bright greens
  const moodColorStops = {
    neutral: [
      { stop: 0.0, color: designSystemColors.darkGreen },
      { stop: 0.2, color: designSystemColors.forestGreen },
      { stop: 0.4, color: designSystemColors.emerald },
      { stop: 0.6, color: designSystemColors.brightGreen },
      { stop: 0.8, color: designSystemColors.neonGreen },
      { stop: 1.0, color: designSystemColors.glowGreen }
    ],
    frenzied: [
      { stop: 0.0, color: designSystemColors.darkGreen },
      { stop: 0.25, color: designSystemColors.emerald },
      { stop: 0.5, color: designSystemColors.brightGreen },
      { stop: 0.75, color: designSystemColors.neonGreen },
      { stop: 1.0, color: designSystemColors.glowGreen }
    ],
    protective: [
      { stop: 0.0, color: designSystemColors.forestGreen },
      { stop: 0.33, color: designSystemColors.emerald },
      { stop: 0.66, color: designSystemColors.brightGreen },
      { stop: 1.0, color: designSystemColors.neonGreen }
    ],
    cosmic: [
      { stop: 0.0, color: designSystemColors.darkGreen },
      { stop: 0.2, color: designSystemColors.emerald },
      { stop: 0.4, color: designSystemColors.brightGreen },
      { stop: 0.6, color: designSystemColors.limeGreen },
      { stop: 0.8, color: designSystemColors.neonGreen },
      { stop: 1.0, color: designSystemColors.mint }
    ],
    zen: [
      { stop: 0.0, color: designSystemColors.forestGreen },
      { stop: 0.33, color: designSystemColors.emerald },
      { stop: 0.66, color: designSystemColors.brightGreen },
      { stop: 1.0, color: designSystemColors.neonGreen }
    ]
  };

  const colorStops = moodColorStops[mood];

  // Simple noise function (Perlin-like)
  const noise = (x: number, y: number, time: number): number => {
    const value = Math.sin(x * 2.5 + time) * 
                  Math.cos(y * 2.5 - time * 0.5) +
                  Math.sin((x + y) * 1.3 + time * 0.7) * 0.5 +
                  Math.cos((x - y) * 2.1 - time * 0.3) * 0.3;
    return value;
  };

  // Metaball field calculation
  const metaballField = (x: number, y: number, blobs: Array<{x: number, y: number, r: number}>): number => {
    let sum = 0;
    for (const blob of blobs) {
      const dx = x - blob.x;
      const dy = y - blob.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.001) continue;
      sum += blob.r / dist;
    }
    return sum;
  };

  // Interpolate color from gradient stops
  const getGradientColor = (t: number, stops: typeof colorStops): [number, number, number] => {
    // Normalize t to 0-1
    t = ((t % 1) + 1) % 1;
    
    for (let i = 0; i < stops.length - 1; i++) {
      const curr = stops[i];
      const next = stops[i + 1];
      
      if (t >= curr.stop && t <= next.stop) {
        const localT = (t - curr.stop) / (next.stop - curr.stop);
        return [
          curr.color[0] + (next.color[0] - curr.color[0]) * localT,
          curr.color[1] + (next.color[1] - curr.color[1]) * localT,
          curr.color[2] + (next.color[2] - curr.color[2]) * localT
        ];
      }
    }
    
    return stops[0].color as [number, number, number];
  };

  const renderFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    timeRef.current += 0.016;
    const time = timeRef.current;

    // Clear with transparency
    ctx.clearRect(0, 0, size, size);

    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size * 0.38;

    // Activity-based parameters
    let animSpeed = 0.3;
    let dotDensity = 8; // Distance between dots

    switch (activity) {
      case "minting":
        animSpeed = 0.8;
        dotDensity = 7;
        break;
      case "analyzing":
        animSpeed = 0.5;
        dotDensity = 8;
        break;
      case "executing":
        animSpeed = 0.7;
        dotDensity = 7;
        break;
      case "thinking":
        animSpeed = 0.4;
        dotDensity = 9;
        break;
    }

    // Halftone dot sphere rendering
    const dotSpacing = dotDensity;
    
    for (let y = -baseRadius * 1.2; y < baseRadius * 1.2; y += dotSpacing) {
      for (let x = -baseRadius * 1.2; x < baseRadius * 1.2; x += dotSpacing) {
        // Distance from center
        const dist = Math.sqrt(x * x + y * y);
        
        // Only render if within sphere radius
        if (dist > baseRadius * 1.15) continue;
        
        // Calculate 3D sphere depth (z coordinate)
        const normalizedDist = dist / baseRadius;
        if (normalizedDist > 1) continue;
        
        const z = Math.sqrt(1 - normalizedDist * normalizedDist);
        
        // Light source from top-right
        const lightX = 0.5;
        const lightY = -0.5;
        const lightZ = 1;
        const lightMag = Math.sqrt(lightX * lightX + lightY * lightY + lightZ * lightZ);
        
        // Normal vector at this point on sphere
        const normalX = x / baseRadius;
        const normalY = y / baseRadius;
        const normalZ = z;
        
        // Dot product for lighting
        const dotProduct = (normalX * lightX + normalY * lightY + normalZ * lightZ) / lightMag;
        const lighting = Math.max(0, dotProduct);
        
        // Add subtle animation
        const angle = Math.atan2(y, x);
        const wave = Math.sin(time * animSpeed + angle * 3) * 0.1;
        const finalLighting = lighting + wave;
        
        // Map lighting to dot size (brighter = larger dots)
        const minDotSize = 0.5;
        const maxDotSize = dotSpacing * 0.6;
        const dotSize = minDotSize + finalLighting * (maxDotSize - minDotSize);
        
        // Map lighting to color intensity
        const colorIntensity = 0.3 + finalLighting * 0.7 + (intensity / 100) * 0.3;
        
        // Get color based on position and time
        const colorT = (angle / (Math.PI * 2)) + (time * 0.05);
        const [r, g, b] = getGradientColor(colorT, colorStops);
        
        // Draw dot
        if (dotSize > 0.5) {
          ctx.beginPath();
          ctx.arc(
            centerX + x, 
            centerY + y, 
            dotSize, 
            0, 
            Math.PI * 2
          );
          ctx.fillStyle = `rgba(${r * colorIntensity}, ${g * colorIntensity}, ${b * colorIntensity}, ${Math.min(1, finalLighting * 1.2)})`;
          ctx.fill();
          
          // Add subtle dot outline for depth
          if (finalLighting > 0.7) {
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(renderFrame);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  };

  // Generate static noise
  const renderNoise = () => {
    const noiseCanvas = noiseCanvasRef.current;
    if (!noiseCanvas) return;

    const ctx = noiseCanvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    // Generate random grayscale noise
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255;
      data[i] = value;     // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
      data[i + 3] = Math.random() > 0.5 ? 100 : 0; // A - sporadic
    }

    ctx.putImageData(imageData, 0, 0);

    if (showNoise) {
      noiseAnimationRef.current = requestAnimationFrame(renderNoise);
    }
  };

  // Random interference effect
  useEffect(() => {
    const triggerInterference = () => {
      // Random chance to trigger static (5% chance every check)
      if (Math.random() < 0.05) {
        setShowNoise(true);
        // Static lasts 50-200ms
        const duration = 50 + Math.random() * 150;
        setTimeout(() => setShowNoise(false), duration);
      }
      
      // Check again in 500-2000ms
      const nextCheck = 500 + Math.random() * 1500;
      setTimeout(triggerInterference, nextCheck);
    };

    triggerInterference();
  }, []);

  // Render noise when active
  useEffect(() => {
    if (showNoise && noiseCanvasRef.current) {
      noiseCanvasRef.current.width = size;
      noiseCanvasRef.current.height = size;
      renderNoise();
    }

    return () => {
      if (noiseAnimationRef.current) {
        cancelAnimationFrame(noiseAnimationRef.current);
      }
    };
  }, [showNoise, size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = size;
      canvas.height = size;
    }
    
    animationFrameRef.current = requestAnimationFrame(renderFrame);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [intensity, mood, size, activity]);

  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer select-none"
      style={{ width: size, height: size }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{
          background: 'hsl(0, 0%, 0%)',
          boxShadow: isHovered 
            ? `0 0 60px rgba(0, 255, 100, 0.6), 0 0 100px rgba(0, 255, 100, 0.4), inset 0 0 30px rgba(0, 255, 100, 0.2)` 
            : `0 0 40px rgba(0, 255, 100, 0.5), 0 0 80px rgba(0, 255, 100, 0.3), inset 0 0 20px rgba(0, 255, 100, 0.15)`
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{
            filter: isHovered ? 'brightness(1.2) saturate(1.3) contrast(1.2)' : 'brightness(1.1) saturate(1.2)',
            transition: 'filter 0.3s ease'
          }}
        />
        
        {/* Static noise interference */}
        {showNoise && (
          <canvas
            ref={noiseCanvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{
              mixBlendMode: 'overlay',
              opacity: 0.4
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AsciiBrain;
