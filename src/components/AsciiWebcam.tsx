import { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff } from 'lucide-react';

const ASCII_CHARS = ['@', '#', 'S', '%', '?', '*', '+', ';', ':', ',', '.', ' '];

const AsciiWebcam = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outputRef = useRef<HTMLPreElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const WIDTH = 80;
  const HEIGHT = 60;

  const brightnessToAscii = (brightness: number): string => {
    const index = Math.floor((brightness / 255) * (ASCII_CHARS.length - 1));
    return ASCII_CHARS[ASCII_CHARS.length - 1 - index];
  };

  const processFrame = () => {
    if (!videoRef.current || !canvasRef.current || !outputRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(videoRef.current, 0, 0, WIDTH, HEIGHT);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    const pixels = imageData.data;

    // Convert to ASCII
    let ascii = '';
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const i = (y * WIDTH + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        // Calculate brightness (grayscale)
        const brightness = (r + g + b) / 3;
        ascii += brightnessToAscii(brightness);
      }
      ascii += '\n';
    }

    outputRef.current.textContent = ascii;
    
    // Continue animation loop
    animationRef.current = requestAnimationFrame(processFrame);
  };

  const startWebcam = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: WIDTH },
          height: { ideal: HEIGHT }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsActive(true);
          setIsLoading(false);
          processFrame();
        };
      }
    } catch (err) {
      console.error('Webcam error:', err);
      setError('Camera access denied or unavailable');
      setIsLoading(false);
      setIsActive(false);
    }
  };

  const stopWebcam = () => {
    // Stop animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Clear ASCII output
    if (outputRef.current) {
      outputRef.current.textContent = '';
    }

    setIsActive(false);
    setError(null);
  };

  const toggleWebcam = () => {
    if (isActive) {
      stopWebcam();
    } else {
      startWebcam();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div className="border-2 border-black p-4 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold tracking-wider">LIVE FEED</h3>
        <button
          onClick={toggleWebcam}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground border-2 border-black hover:bg-primary/90 transition-colors disabled:opacity-50 text-xs font-bold tracking-wider"
        >
          {isActive ? (
            <>
              <CameraOff className="w-4 h-4" />
              <span className="hidden sm:inline">DISABLE</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">ENABLE</span>
            </>
          )}
        </button>
      </div>

      {/* Hidden video and canvas elements */}
      <video
        ref={videoRef}
        className="hidden"
        width={WIDTH}
        height={HEIGHT}
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="hidden"
        width={WIDTH}
        height={HEIGHT}
      />

      {/* ASCII Output */}
      <div className="relative">
        {isLoading && (
          <div className="text-center py-8 text-sm font-mono">
            REQUESTING CAMERA ACCESS...
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-sm font-mono text-destructive">
            {error}
          </div>
        )}

        {!isActive && !isLoading && !error && (
          <div className="text-center py-8 text-sm font-mono">
            CLICK ENABLE TO START LIVE FEED
          </div>
        )}

        {isActive && (
          <div className="overflow-x-auto">
            <pre
              ref={outputRef}
              className="terminal-text text-[6px] sm:text-[8px] leading-[6px] sm:leading-[8px] tracking-[1px] sm:tracking-[2px]"
              style={{
                fontFamily: "'Courier New', monospace",
                whiteSpace: 'pre',
                color: '#000',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AsciiWebcam;
