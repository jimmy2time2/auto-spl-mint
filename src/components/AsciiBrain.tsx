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
    const baseRadius = size * 0.35;

    // Activity-based parameters - reduce morphing for sphere shape
    let morphSpeed = 0.3;
    let morphIntensity = 0.05;
    let rotationSpeed = 0.2;
    let numBlobs = 8;
    let blobSpread = 0.15;

    switch (activity) {
      case "minting":
        morphSpeed = 0.5;
        morphIntensity = 0.08;
        rotationSpeed = 0.4;
        numBlobs = 8;
        blobSpread = 0.18;
        break;
      case "analyzing":
        morphSpeed = 0.4;
        morphIntensity = 0.06;
        rotationSpeed = 0.3;
        numBlobs = 8;
        blobSpread = 0.16;
        break;
      case "executing":
        morphSpeed = 0.45;
        morphIntensity = 0.07;
        rotationSpeed = 0.35;
        numBlobs = 8;
        blobSpread = 0.17;
        break;
      case "thinking":
        morphSpeed = 0.35;
        morphIntensity = 0.055;
        rotationSpeed = 0.25;
        numBlobs = 8;
        blobSpread = 0.155;
        break;
    }

    // Create metaballs for sphere shape - more evenly distributed
    const blobs: Array<{x: number, y: number, r: number}> = [];
    for (let i = 0; i < numBlobs; i++) {
      const angle = (i / numBlobs) * Math.PI * 2 + time * rotationSpeed;
      const offset = Math.sin(time * morphSpeed + i) * blobSpread;
      const bx = Math.cos(angle) * baseRadius * (1 + offset);
      const by = Math.sin(angle) * baseRadius * (1 + offset);
      blobs.push({
        x: bx,
        y: by,
        r: baseRadius * (1.1 + Math.sin(time * morphSpeed * 0.5 + i * 1.3) * 0.1)
      });
    }

    // PIXELATION: Render at lower resolution
    const pixelSize = 4; // Size of each "pixel"
    const lowResWidth = Math.floor(size / pixelSize);
    const lowResHeight = Math.floor(size / pixelSize);

    // Create temporary low-res image data
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = lowResWidth;
    tempCanvas.height = lowResHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    const imageData = tempCtx.createImageData(lowResWidth, lowResHeight);
    const data = imageData.data;

    for (let py = 0; py < lowResHeight; py++) {
      for (let px = 0; px < lowResWidth; px++) {
        // Scale back to original coordinates
        const x = (px * pixelSize) - centerX;
        const y = (py * pixelSize) - centerY;
        
        // Calculate metaball field
        const field = metaballField(x, y, blobs);
        const threshold = 1.2 + Math.sin(time * morphSpeed) * morphIntensity;

        if (field > threshold) {
          // Inside the sphere
          const dist = Math.sqrt(x * x + y * y);
          const angle = Math.atan2(y, x);
          
          // Add subtle noise for texture
          const noiseValue = noise(x * 0.01, y * 0.01, time * morphSpeed * 0.5);
          
          // Calculate color based on angle and distance for sphere shading
          const colorT = (angle / (Math.PI * 2)) + (noiseValue * 0.1) + (time * 0.05);
          let [r, g, b] = getGradientColor(colorT, colorStops);
          
          // Sphere shading - brighter at edges, darker in center
          const sphereFactor = 1 - (dist / baseRadius);
          const edgeFactor = Math.max(0, 1 - Math.abs(field - threshold) * 5);
          const brightness = 0.3 + sphereFactor * 0.4 + edgeFactor * 0.8 + (intensity / 100) * 0.5;
          
          // THRESHOLD EFFECT: Posterize colors to fewer levels
          const colorLevels = 4; // Number of color steps (retro look)
          r = Math.round((r * brightness) / 255 * colorLevels) * (255 / colorLevels);
          g = Math.round((g * brightness) / 255 * colorLevels) * (255 / colorLevels);
          b = Math.round((b * brightness) / 255 * colorLevels) * (255 / colorLevels);
          
          // Apply color with stronger falloff for sphere depth
          const falloff = Math.max(0, 1 - (dist / (baseRadius * 1.2)));
          const alpha = Math.min(255, falloff * 255 * brightness * 1.2);
          
          const idx = (py * lowResWidth + px) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = alpha;
        }
      }
    }

    tempCtx.putImageData(imageData, 0, 0);

    // Scale up the pixelated result with nearest-neighbor (no smoothing)
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tempCanvas, 0, 0, lowResWidth, lowResHeight, 0, 0, size, size);

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
