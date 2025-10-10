import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff } from 'lucide-react';

const AsciiWebcam = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Click to enable webcam');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const asciiOutputRef = useRef<HTMLPreElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // ASCII characters from darkest to lightest
  const asciiChars = ['█', '▓', '▒', '░', ' '];
  
  // Canvas dimensions (smaller = more pixelated)
  const WIDTH = 80;
  const HEIGHT = 60;

  const convertToAscii = () => {
    if (!isActive) return;

    if (!videoRef.current || !canvasRef.current || !asciiOutputRef.current) {
      // Wait until all elements are mounted
      animationFrameRef.current = requestAnimationFrame(convertToAscii);
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('No canvas context available');
      animationFrameRef.current = requestAnimationFrame(convertToAscii);
      return;
    }
    
    // Check if video is ready
    if (video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(convertToAscii);
      return;
    }
    
    try {
      ctx.drawImage(video, 0, 0, WIDTH, HEIGHT);
      const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
      
      let ascii = '';
      for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
          const index = (y * WIDTH + x) * 4;
          const r = imageData.data[index];
          const g = imageData.data[index + 1];
          const b = imageData.data[index + 2];
          
          // Convert to grayscale
          const brightness = (r + g + b) / 3;
          
          // INVERTED MAPPING - darker parts of image = darker characters
          const charIndex = asciiChars.length - 1 - Math.floor((brightness / 255) * (asciiChars.length - 1));
          
          ascii += asciiChars[charIndex];
        }
        ascii += '\n';
      }
      
      asciiOutputRef.current.textContent = ascii;
      setStatus('Camera active');
      
      // Debug logging occasionally
      if (Math.random() < 0.02) {
        console.log('First 100 chars:', ascii.substring(0, 100));
        console.log('Total ASCII length:', ascii.length);
      }
      
    } catch (err) {
      console.error('Error converting to ASCII:', err);
      setError(`Processing error: ${err instanceof Error ? err.message : 'Unknown'}`);
      return;
    }
    
    animationFrameRef.current = requestAnimationFrame(convertToAscii);
  };

  const startWebcam = async () => {
    console.log('Starting webcam...');
    console.log('Refs available:', { video: !!videoRef.current, canvas: !!canvasRef.current, output: !!asciiOutputRef.current });
    
    try {
      setError(null);
      setStatus('Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      console.log('Stream obtained:', stream.getTracks());
      streamRef.current = stream;
      
      if (!videoRef.current) {
        throw new Error('Video element not found');
      }
      
      if (!canvasRef.current) {
        throw new Error('Canvas element not found');
      }
      
      const video = videoRef.current;
      video.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          console.log('Video metadata loaded:', video.videoWidth, 'x', video.videoHeight);
          video.play()
            .then(() => {
              console.log('Video playing');
              resolve();
            })
            .catch(reject);
        };
        
        video.onerror = () => {
          reject(new Error('Video failed to load'));
        };
        
        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Video load timeout')), 5000);
      });
      
      setIsActive(true);
      setStatus('Camera active');
      console.log('Starting ASCII conversion...');
      convertToAscii();
      
    } catch (err) {
      console.error('Webcam error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Camera error: ${errorMsg}`);
      setStatus('Error - check console');
    }
  };

  const stopWebcam = () => {
    console.log('Stopping webcam...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
    setStatus('Click to enable webcam');
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
      
      <div id="webcam-status" className="text-[10px] metric-label mb-2">
        Status: {status}
      </div>
      
      {error && (
        <div className="text-[10px] text-destructive mb-2 p-2 border border-destructive bg-destructive/10">
          ERROR: {error}
        </div>
      )}
      
      <div
        className="ascii-webcam-container mt-3"
        style={{ 
          backgroundColor: '#ffffff', 
          border: '3px solid #000', 
          padding: 10, 
          display: isActive ? 'block' : 'none',
          maxWidth: 600,
          width: '100%',
          overflowX: 'auto'
        }}
      >
        <pre 
          id="ascii-output"
          ref={asciiOutputRef}
          className="font-mono font-bold m-0"
          style={{ 
            color: '#000000', 
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            lineHeight: '12px',
            letterSpacing: '0px',
            whiteSpace: 'pre',
            overflowX: 'auto',
            padding: 10
          }}
        />
      </div>
      
      {/* Hidden video and canvas elements - MUST be rendered */}
      <video
        id="webcam"
        ref={videoRef}
        style={{ display: 'none' }}
        playsInline
        muted
        autoPlay
      />
      <canvas
        id="webcam-canvas"
        ref={canvasRef}
        style={{ display: 'none' }}
        width={WIDTH}
        height={HEIGHT}
      />
    </div>
  );
};

export default AsciiWebcam;
