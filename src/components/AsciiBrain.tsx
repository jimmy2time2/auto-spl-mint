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
  const preRef = useRef<HTMLPreElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const rippleRef = useRef({ active: false, time: 0, x: 0, y: 0 });
  
  const [isHovered, setIsHovered] = useState(false);

  // ASCII character gradient for shading (dark to light)
  const ASCII_CHARS = " .:-=+*#%@";
  
  // Resolution - very high density to fill the circle completely
  const cols = Math.floor(size / 2.5);
  const rows = Math.floor(size / 5);
  
  // Mood color mapping (HSL format for design system)
  const moodColors = {
    neutral: "hsl(var(--metric-neutral))",
    frenzied: "hsl(var(--metric-danger))",
    protective: "hsl(var(--metric-info))",
    cosmic: "hsl(var(--primary))",
    zen: "hsl(var(--metric-success))"
  };

  const color = moodColors[mood];
  
  // Lerp function for smooth interpolation
  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
  };

  // 3D rotation matrix
  const rotateX = (y: number, z: number, angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      y: y * cos - z * sin,
      z: y * sin + z * cos
    };
  };

  const rotateY = (x: number, z: number, angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: x * cos + z * sin,
      z: -x * sin + z * cos
    };
  };

  // Render ASCII sphere
  const renderFrame = () => {
    if (!preRef.current) return;

    timeRef.current += 0.016; // ~60fps
    const time = timeRef.current;
    
    // Smooth mouse interpolation
    mouseRef.current.x = lerp(mouseRef.current.x, mouseRef.current.targetX, 0.05);
    mouseRef.current.y = lerp(mouseRef.current.y, mouseRef.current.targetY, 0.05);
    
    // Activity-based animation parameters
    let baseRotSpeed = 0.3 + (intensity / 100) * 0.5;
    let breathScale = 1 + Math.sin(time * 0.5) * 0.05;
    let pulse = Math.sin(time * 2 + intensity / 50) * 0.1;
    let vortexStrength = 0;
    let spiralSpeed = 0;
    
    switch (activity) {
      case "minting":
        // Fast spiral vortex pulling inward
        baseRotSpeed = 2.0 + (intensity / 100);
        spiralSpeed = 3;
        vortexStrength = 0.3;
        pulse = Math.sin(time * 6) * 0.2;
        breathScale = 1 + Math.sin(time * 2) * 0.1;
        break;
      case "analyzing":
        // Scanning wave pattern
        baseRotSpeed = 0.8;
        pulse = Math.sin(time * 4 + intensity / 30) * 0.15;
        breathScale = 1 + Math.sin(time * 1.5) * 0.08;
        break;
      case "executing":
        // Sharp pulsing with fast rotation
        baseRotSpeed = 1.5;
        pulse = Math.abs(Math.sin(time * 5)) * 0.25;
        breathScale = 1 + Math.abs(Math.sin(time * 3)) * 0.12;
        break;
      case "thinking":
        // Slow wave oscillation
        baseRotSpeed = 0.4;
        pulse = Math.sin(time * 1.5) * 0.12;
        breathScale = 1 + Math.sin(time * 0.8) * 0.06;
        break;
      default: // idle
        baseRotSpeed = 0.3 + (intensity / 100) * 0.5;
        pulse = Math.sin(time * 2 + intensity / 50) * 0.1;
        breathScale = 1 + Math.sin(time * 0.5) * 0.05;
    }
    
    const rotX = mouseRef.current.y * 0.5 + Math.sin(time * 0.3) * 0.2;
    const rotY = mouseRef.current.x * 0.5 + time * baseRotSpeed;
    
    let output = "";
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Normalize screen coordinates to -1 to 1
        let screenX = (col / cols) * 2 - 1;
        let screenY = (row / rows) * 2 - 1;
        
        // Aspect ratio correction in screen space
        screenX *= cols / rows;
        
        // Distance from center in screen space
        const distFromCenter = Math.sqrt(screenX * screenX + screenY * screenY);
        
        // Map to sphere coordinates (clamped to radius 1)
        let x = screenX;
        let y = screenY;
        let r = distFromCenter;
        if (r > 1) {
          const scale = 1 / r;
          x *= scale;
          y *= scale;
          r = 1;
        }
        
        // Calculate Z depth (sphere surface)
        let z = Math.sqrt(Math.max(0, 1 - x * x - y * y)) * breathScale;
        
        // Apply vortex effect for minting
        if (vortexStrength > 0) {
          const angle = Math.atan2(y, x);
          const spiralFactor = r * spiralSpeed + time * 2;
          const vortex = Math.sin(angle * 3 + spiralFactor) * vortexStrength * (1 - r);
          z += vortex;
        }
        
        // Apply wave distortion (activity-based)
        const waveSpeed = activity === "analyzing" ? 4 : 1 + (intensity / 100) * 3;
        const waveFreq = activity === "analyzing" ? 5 : 3 + (intensity / 50);
        const wave = Math.sin(x * waveFreq + time * waveSpeed) * 
                     Math.cos(y * waveFreq + time * waveSpeed) * 
                     (activity === "analyzing" ? 0.08 : 0.15);
        z += wave;
        
        // Apply pulse (strongest at center, fades to edge)
        const pulseAmount = (1 - Math.min(1, r)) * pulse;
        z += pulseAmount;
        
        // Apply ripple effect on click (in screen space)
        if (rippleRef.current.active) {
          const rippleTime = time - rippleRef.current.time;
          const rippleRadius = rippleTime * 3;
          const distFromRipple = Math.sqrt(
            Math.pow(screenX - rippleRef.current.x, 2) + 
            Math.pow(screenY - rippleRef.current.y, 2)
          );
          
          if (Math.abs(distFromRipple - rippleRadius) < 0.3) {
            const rippleStrength = Math.max(0, 1 - rippleTime * 0.5);
            z += rippleStrength * 0.3;
          }
          
          // Deactivate ripple after 2 seconds
          if (rippleTime > 2) {
            rippleRef.current.active = false;
          }
        }
        
        // Apply 3D rotations
        let point = { x, y, z };
        const rotatedX = rotateX(point.y, point.z, rotX);
        point.y = rotatedX.y;
        point.z = rotatedX.z;
        
        const rotatedY = rotateY(point.x, point.z, rotY);
        point.x = rotatedY.x;
        point.z = rotatedY.z;
        
        // Calculate shading based on Z-depth and lighting
        const lightX = Math.cos(time * 0.5);
        const lightY = Math.sin(time * 0.5);
        const lightZ = 0.5;
        
        // Normal vector (simplified)
        const normalX = point.x;
        const normalY = point.y;
        const normalZ = point.z;
        
        // Dot product for lighting
        const lighting = Math.max(0, 
          normalX * lightX + 
          normalY * lightY + 
          normalZ * lightZ
        );
        
        // Map lighting to ASCII character
        const charIndex = Math.floor(lighting * (ASCII_CHARS.length - 1));
        const char = ASCII_CHARS[Math.max(0, Math.min(ASCII_CHARS.length - 1, charIndex))];
        
        output += char;
      }
      output += "\n";
    }
    
    preRef.current.textContent = output;
    animationFrameRef.current = requestAnimationFrame(renderFrame);
  };

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    
    mouseRef.current.targetX = x;
    mouseRef.current.targetY = y;
  };

  // Click handler for ripple effect
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    
    rippleRef.current = {
      active: true,
      time: timeRef.current,
      x: x * (cols / rows),
      y: y
    };
  };

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(renderFrame);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [intensity, mood, size]);

  // Calculate glow intensity
  const glowIntensity = 0.5 + (intensity / 100) * 1.5;
  const glowSpeed = 0.5 + (intensity / 100) * 1.5;
  
  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer select-none"
      style={{ width: size, height: size }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div 
        className="absolute inset-0 rounded-full overflow-hidden border-2 border-border"
        style={{
          backgroundColor: color,
          boxShadow: isHovered 
            ? `0 0 ${20 + intensity / 5}px ${color}` 
            : `0 0 10px ${color}`,
          opacity: 0.15 + (intensity / 100) * 0.25
        }}
      >
        <pre
          ref={preRef}
          className="absolute inset-0 flex items-center justify-center font-mono text-[7px] leading-[0.8] whitespace-pre"
          style={{
            color: "hsl(var(--foreground))",
            textShadow: `
              0 0 ${2 * glowIntensity}px hsl(var(--foreground)),
              0 0 ${4 * glowIntensity}px hsl(var(--foreground))
            `,
            animation: `ascii-pulse ${2 / glowSpeed}s ease-in-out infinite`,
            letterSpacing: "0.02em",
            transform: "scale(1.15)",
            transformOrigin: "center center"
          }}
        />
      </div>
    </div>
  );
};

export default AsciiBrain;
