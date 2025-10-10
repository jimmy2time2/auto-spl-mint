import { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff } from 'lucide-react';

const ASCII_CHARS = ['@', '#', 'S', '%', '?', '*', '+', ';', ':', ',', '.', ' '];

const AsciiWebcam = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outputRef = useRef<HTMLPreElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const WIDTH = 60;  // Reduced for better visibility
  const HEIGHT = 45; // Reduced for better visibility

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
    setFrameCount(prev => prev + 1);
    
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
          console.log('Webcam started, video dimensions:', videoRef.current?.videoWidth, videoRef.current?.videoHeight);
          setIsActive(true);
          setIsLoading(false);
          setFrameCount(0);
          processFrame();
        };
      }
    } catch (err) {
      console.error('Webcam error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Camera access denied';
      setError(`ERROR: ${errorMsg}`);
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
    setFrameCount(0);
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
        <div>
          <h3 className="text-sm font-bold tracking-wider">LIVE FEED</h3>
          {isActive && <div className="text-[10px] metric-label mt-1">FRAMES: {frameCount}</div>}
        </div>
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
      <div className="relative min-h-[200px] bg-card">
        {isLoading && (
          <div className="text-center py-8 text-sm font-mono font-bold">
            REQUESTING CAMERA ACCESS...
          </div>
        )}

        {error && (
          <div className="text-center py-8 px-4">
            <div className="text-sm font-mono font-bold text-destructive mb-2">
              {error}
            </div>
            <div className="text-xs metric-label">
              Check browser permissions
            </div>
          </div>
        )}

        {!isActive && !isLoading && !error && (
          <div className="text-center py-8">
            <div className="text-sm font-mono font-bold mb-2">
              CLICK ENABLE TO START LIVE FEED
            </div>
            <div className="text-xs metric-label">
              Camera required
            </div>
          </div>
        )}

        {isActive && (
          <div className="overflow-x-auto bg-background p-2">
            <pre
              ref={outputRef}
              className="terminal-text text-[8px] sm:text-[10px] leading-[8px] sm:leading-[10px] tracking-[0px]"
              style={{
                fontFamily: "'Courier New', 'Courier', monospace",
                whiteSpace: 'pre',
                color: '#000',
                fontWeight: 'bold',
              }}
            />
            {frameCount === 0 && (
              <div className="text-center text-xs metric-label mt-2">
                Initializing camera...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AsciiWebcam;
