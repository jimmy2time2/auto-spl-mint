import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff } from 'lucide-react';

const AsciiWebcam = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // ASCII characters from darkest to lightest
  const asciiChars = ['@', '#', 'S', '%', '?', '*', '+', ';', ':', ',', '.', ' '];
  
  // Canvas dimensions (smaller = more pixelated)
  const WIDTH = 60;
  const HEIGHT = 45;

  const convertToAscii = () => {
    if (!isActive || !videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0, WIDTH, HEIGHT);
    const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    
    let ascii = '';
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      
      // Convert to grayscale
      const brightness = (r + g + b) / 3;
      const charIndex = Math.floor((brightness / 255) * (asciiChars.length - 1));
      
      ascii += asciiChars[charIndex];
      
      // Add line breaks
      if ((i / 4 + 1) % WIDTH === 0) {
        ascii += '\n';
      }
    }
    
    const output = document.getElementById('ascii-output');
    if (output) {
      output.textContent = ascii;
    }
    
    setFrameCount(prev => prev + 1);
    animationFrameRef.current = requestAnimationFrame(convertToAscii);
  };

  const startWebcam = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        console.log('Webcam started, video dimensions:', videoRef.current.videoWidth, videoRef.current.videoHeight);
      }
      
      setIsActive(true);
      setFrameCount(0);
      convertToAscii();
    } catch (err) {
      console.error('Webcam error:', err);
      setError(`Camera access denied: ${err instanceof Error ? err.message : 'Unknown error'}. Check browser permissions.`);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setIsActive(false);
    setFrameCount(0);
  };

  const toggleWebcam = () => {
    if (isActive) {
      stopWebcam();
    } else {
      startWebcam();
    }
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div className="border-2 border-border bg-card p-4">
      <h3 className="metric-label mb-4 font-bold">LIVE FEED</h3>
      
      <Button
        onClick={toggleWebcam}
        variant="default"
        className="w-full mb-3 font-bold uppercase tracking-wide text-xs"
      >
        {isActive ? (
          <>
            <VideoOff className="mr-2 h-3 w-3" />
            DISABLE WEBCAM
          </>
        ) : (
          <>
            <Video className="mr-2 h-3 w-3" />
            ENABLE WEBCAM
          </>
        )}
      </Button>
      
      {error && (
        <div className="text-[10px] text-destructive mb-2 p-2 border border-destructive">
          {error}
        </div>
      )}
      
      {!isActive && !error && (
        <div className="text-[10px] metric-label mb-2">
          Click to enable webcam
        </div>
      )}
      
      {isActive && (
        <div className="border-2 border-border bg-card p-2 min-h-[200px]">
          <pre 
            id="ascii-output"
            className="font-mono text-[8px] sm:text-[10px] leading-[8px] sm:leading-[10px] tracking-[2px] whitespace-pre overflow-hidden font-bold"
            style={{ color: '#000000' }}
          >
            {frameCount === 0 ? 'Initializing camera...' : ''}
          </pre>
        </div>
      )}
      
      {/* Hidden video and canvas elements */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="hidden"
        width={WIDTH}
        height={HEIGHT}
      />
    </div>
  );
};

export default AsciiWebcam;
