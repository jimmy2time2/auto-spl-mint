import { useState, useRef, useEffect, useCallback } from 'react';

const CONFIG = {
  asciiWidth: 30,
  asciiHeight: 30,
  videoWidth: 640,
  videoHeight: 480,
  frameRate: 30,
  asciiChars: ['@', '#', 'S', '%', '?', '*', '+', ';', ':', ',', '.', ' ']
};

const AsciiWebcam = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Click to enable camera');
  const [showStatus, setShowStatus] = useState(true);
  const [asciiText, setAsciiText] = useState('WEBCAM DISABLED\nCLICK BUTTON TO START');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isActiveRef = useRef(false);

  const convertToAscii = useCallback(() => {
    if (!isActiveRef.current || !videoRef.current || !canvasRef.current) {
      return;
    }

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const video = videoRef.current;

      if (!ctx) return;

      ctx.drawImage(video, 0, 0, CONFIG.asciiWidth, CONFIG.asciiHeight);
      const imageData = ctx.getImageData(0, 0, CONFIG.asciiWidth, CONFIG.asciiHeight);
      const pixels = imageData.data;

      let ascii = '';
      
      for (let y = 0; y < CONFIG.asciiHeight; y++) {
        for (let x = 0; x < CONFIG.asciiWidth; x++) {
          const index = (y * CONFIG.asciiWidth + x) * 4;
          const r = pixels[index];
          const g = pixels[index + 1];
          const b = pixels[index + 2];
          const brightness = (r + g + b) / 3;
          const charIndex = Math.floor((1 - brightness / 255) * (CONFIG.asciiChars.length - 1));
          ascii += CONFIG.asciiChars[charIndex];
        }
        ascii += '\n';
      }

      setAsciiText(ascii);
      animationFrameRef.current = requestAnimationFrame(convertToAscii);
    } catch (error) {
      console.error('Conversion error:', error);
      setAsciiText('ERROR DURING CONVERSION\n' + (error as Error).message);
      stopWebcam();
    }
  }, []);

  const startWebcam = async () => {
    try {
      setStatus('⏳ Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: CONFIG.videoWidth },
          height: { ideal: CONFIG.videoHeight },
          facingMode: 'user',
          frameRate: { ideal: CONFIG.frameRate }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Video load timeout - camera might be in use'));
          }, 10000);

          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              clearTimeout(timeout);
              resolve();
            };
            videoRef.current.onerror = () => {
              clearTimeout(timeout);
              reject(new Error('Video load error'));
            };
          }
        });

        await videoRef.current.play();
        await new Promise(resolve => setTimeout(resolve, 500));

        setIsActive(true);
        isActiveRef.current = true;
        setShowStatus(false);
        setAsciiText('INITIALIZING ASCII CONVERSION...\nPLEASE WAIT...');

        setTimeout(() => {
          convertToAscii();
        }, 300);
      }
    } catch (error) {
      console.error('Webcam error:', error);
      let errorMsg = 'ERROR: ' + (error as Error).message + '\n\n';
      errorMsg += 'TROUBLESHOOTING:\n';
      errorMsg += '• Check camera permissions\n';
      errorMsg += '• Close other apps using camera\n';
      errorMsg += '• Try refreshing the page\n';
      errorMsg += '• Use Chrome or Firefox browser\n';
      
      setStatus('❌ ' + (error as Error).message);
      setShowStatus(true);
      setAsciiText(errorMsg);
      stopWebcam();
    }
  };

  const stopWebcam = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    isActiveRef.current = false;
    setShowStatus(true);
    setStatus('Click to enable camera');
    setAsciiText('WEBCAM DISABLED\nCLICK BUTTON TO START');
  };

  const handleToggle = () => {
    if (!isActive) {
      startWebcam();
    } else {
      stopWebcam();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = CONFIG.asciiWidth;
      canvas.height = CONFIG.asciiHeight;
    }

    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div style={{ 
      backgroundColor: '#d4e7a1', 
      border: '2px solid #000', 
      padding: '8px',
      fontFamily: "'Courier New', monospace",
      width: '120px'
    }}>
      <button
        onClick={handleToggle}
        disabled={false}
        style={{
          backgroundColor: '#000',
          color: '#d4e7a1',
          border: '2px solid #000',
          padding: '6px',
          fontFamily: "'Courier New', monospace",
          fontSize: '10px',
          cursor: 'pointer',
          width: '100%',
          marginBottom: '6px',
          fontWeight: 'bold',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px'
        }}
      >
        <span style={{ fontSize: '12px' }}>
          {isActive ? '⏸' : '📷'}
        </span>
      </button>

      <div style={{
        backgroundColor: '#000',
        border: '2px solid #000',
        width: '104px',
        height: '104px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        <pre style={{
          color: '#d4e7a1',
          fontFamily: "'Courier New', monospace",
          fontSize: '3.4px',
          lineHeight: '3.4px',
          letterSpacing: '0px',
          margin: 0,
          whiteSpace: 'pre',
          fontWeight: 'normal'
        }}>
          {asciiText}
        </pre>
      </div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      />
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default AsciiWebcam;
