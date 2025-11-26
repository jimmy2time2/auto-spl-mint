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
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Mood-based color schemes (iridescent rainbow gradients)
  const moodColorStops = {
    neutral: [
      { stop: 0.0, color: [120, 200, 255] },   // cyan
      { stop: 0.33, color: [180, 120, 255] },  // purple
      { stop: 0.66, color: [255, 120, 180] },  // pink
      { stop: 1.0, color: [120, 200, 255] }    // cyan
    ],
    frenzied: [
      { stop: 0.0, color: [255, 50, 50] },     // red
      { stop: 0.33, color: [255, 150, 50] },   // orange
      { stop: 0.66, color: [255, 255, 50] },   // yellow
      { stop: 1.0, color: [255, 50, 50] }      // red
    ],
    protective: [
      { stop: 0.0, color: [50, 150, 255] },    // blue
      { stop: 0.5, color: [100, 255, 200] },   // cyan
      { stop: 1.0, color: [50, 150, 255] }     // blue
    ],
    cosmic: [
      { stop: 0.0, color: [255, 100, 255] },   // magenta
      { stop: 0.25, color: [100, 100, 255] },  // blue
      { stop: 0.5, color: [100, 255, 255] },   // cyan
      { stop: 0.75, color: [255, 100, 200] },  // pink
      { stop: 1.0, color: [255, 100, 255] }    // magenta
    ],
    zen: [
      { stop: 0.0, color: [100, 255, 150] },   // green
      { stop: 0.5, color: [150, 255, 200] },   // mint
      { stop: 1.0, color: [100, 255, 150] }    // green
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

    // Activity-based parameters
    let morphSpeed = 0.5;
    let morphIntensity = 0.15;
    let rotationSpeed = 0.3;
    let numBlobs = 5;
    let blobSpread = 0.3;

    switch (activity) {
      case "minting":
        morphSpeed = 2.0;
        morphIntensity = 0.3;
        rotationSpeed = 1.5;
        numBlobs = 8;
        blobSpread = 0.5;
        break;
      case "analyzing":
        morphSpeed = 1.2;
        morphIntensity = 0.2;
        rotationSpeed = 0.8;
        numBlobs = 6;
        blobSpread = 0.4;
        break;
      case "executing":
        morphSpeed = 1.8;
        morphIntensity = 0.25;
        rotationSpeed = 1.2;
        numBlobs = 7;
        blobSpread = 0.45;
        break;
      case "thinking":
        morphSpeed = 0.6;
        morphIntensity = 0.18;
        rotationSpeed = 0.4;
        numBlobs = 5;
        blobSpread = 0.35;
        break;
    }

    // Create metaballs for organic blob shape
    const blobs: Array<{x: number, y: number, r: number}> = [];
    for (let i = 0; i < numBlobs; i++) {
      const angle = (i / numBlobs) * Math.PI * 2 + time * rotationSpeed;
      const offset = Math.sin(time * morphSpeed + i) * blobSpread;
      const bx = Math.cos(angle) * baseRadius * offset;
      const by = Math.sin(angle) * baseRadius * offset;
      blobs.push({
        x: bx,
        y: by,
        r: baseRadius * (0.8 + Math.sin(time * morphSpeed * 1.5 + i * 1.3) * 0.3)
      });
    }

    // Render the blob
    const resolution = 2;
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    for (let py = 0; py < size; py += resolution) {
      for (let px = 0; px < size; px += resolution) {
        const x = px - centerX;
        const y = py - centerY;
        
        // Calculate metaball field
        const field = metaballField(x, y, blobs);
        const threshold = 1.2 + Math.sin(time * morphSpeed) * morphIntensity;

        if (field > threshold) {
          // Inside the blob
          const dist = Math.sqrt(x * x + y * y);
          const angle = Math.atan2(y, x);
          
          // Add noise for liquid texture
          const noiseValue = noise(x * 0.01, y * 0.01, time * morphSpeed * 0.5);
          
          // Calculate iridescent color based on angle and noise
          const colorT = (angle / (Math.PI * 2)) + (noiseValue * 0.2) + (time * 0.1);
          const [r, g, b] = getGradientColor(colorT, colorStops);
          
          // Edge glow effect
          const edgeFactor = Math.max(0, 1 - Math.abs(field - threshold) * 5);
          const brightness = 0.7 + edgeFactor * 0.3 + (intensity / 100) * 0.3;
          
          // Apply color with falloff
          const falloff = Math.max(0, 1 - (dist / (baseRadius * 1.5)));
          const alpha = Math.min(255, falloff * 255 * brightness);
          
          // Fill resolution block
          for (let dy = 0; dy < resolution && py + dy < size; dy++) {
            for (let dx = 0; dx < resolution && px + dx < size; dx++) {
              const idx = ((py + dy) * size + (px + dx)) * 4;
              data[idx] = r * brightness;
              data[idx + 1] = g * brightness;
              data[idx + 2] = b * brightness;
              data[idx + 3] = alpha;
            }
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Apply blur for smooth liquid effect
    ctx.filter = 'blur(4px)';
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';

    animationFrameRef.current = requestAnimationFrame(renderFrame);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  };

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
          background: 'radial-gradient(circle, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%)',
          boxShadow: isHovered 
            ? `0 0 30px rgba(120, 200, 255, 0.6), inset 0 0 20px rgba(120, 200, 255, 0.3)` 
            : `0 0 15px rgba(120, 200, 255, 0.4), inset 0 0 10px rgba(120, 200, 255, 0.2)`
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{
            filter: isHovered ? 'brightness(1.2) saturate(1.3)' : 'brightness(1) saturate(1)',
            transition: 'filter 0.3s ease'
          }}
        />
      </div>
    </div>
  );
};

export default AsciiBrain;
