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
  const asciiChars = ['@', '#', 'S', '%', '?', '*', '+', ';', ':', ',', '.', ' '];
  
  // Canvas dimensions (smaller = more pixelated)
  const WIDTH = 60;
  const HEIGHT = 45;

  const convertToAscii = () => {
    if (!isActive || !videoRef.current || !canvasRef.current || !asciiOutputRef.current) {
      console.log('convertToAscii stopped:', { isActive, hasVideo: !!videoRef.current, hasCanvas: !!canvasRef.current, hasOutput: !!asciiOutputRef.current });
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('No canvas context available');
      return;
    }
    
    // Check if video is ready
    if (video.readyState < 2) {
      console.log('Video not ready yet, waiting...');
      animationFrameRef.current = requestAnimationFrame(convertToAscii);
      return;
    }
    
    try {
      ctx.drawImage(video, 0, 0, WIDTH, HEIGHT);
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
      
      asciiOutputRef.current.textContent = ascii;
      setStatus(`Active - Frame: ${Math.floor(performance.now())}`);
      
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
      
      <div className="text-[10px] metric-label mb-2">
        Status: {status}
      </div>
      
      {error && (
        <div className="text-[10px] text-destructive mb-2 p-2 border border-destructive bg-destructive/10">
          ERROR: {error}
        </div>
      )}
      
      {isActive && (
        <div 
          className="border-2 border-border p-2 min-h-[200px] overflow-hidden"
          style={{ backgroundColor: '#d4e7a1' }}
        >
          <pre 
            ref={asciiOutputRef}
            className="font-mono text-[8px] sm:text-[10px] leading-[8px] sm:leading-[10px] tracking-[2px] whitespace-pre overflow-hidden font-bold m-0"
            style={{ color: '#000000' }}
          >
            Initializing...
          </pre>
        </div>
      )}
      
      {/* Hidden video and canvas elements - MUST be rendered */}
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        playsInline
        muted
        autoPlay
      />
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
        width={WIDTH}
        height={HEIGHT}
      />
    </div>
  );
};

export default AsciiWebcam;
