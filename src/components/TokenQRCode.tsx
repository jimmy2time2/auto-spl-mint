import { useState, useEffect } from 'react';
import { generateM9QRCodeWithLogo } from '@/lib/qrCodeGenerator';

interface TokenQRCodeProps {
  tokenId: string;
  size?: number;
  className?: string;
}

/**
 * TokenQRCode Component
 * Displays a branded M9 QR code that links to the token page
 * - Lime (#BFFF00) on black theme
 * - "M9" logo in center
 */
const TokenQRCode = ({ tokenId, size = 56, className = '' }: TokenQRCodeProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const generateQR = async () => {
      try {
        setIsLoading(true);
        setError(false);
        
        // Generate QR code with M9 logo
        const dataUrl = await generateM9QRCodeWithLogo({ 
          tokenId, 
          size: Math.max(size * 2, 200) // Generate at higher res for quality
        });
        
        setQrCodeUrl(dataUrl);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (tokenId) {
      generateQR();
    }
  }, [tokenId, size]);

  // Loading state - show M9 placeholder
  if (isLoading) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted border border-border ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xs font-bold text-muted-foreground">M9</span>
      </div>
    );
  }

  // Error state - show M9 text fallback
  if (error || !qrCodeUrl) {
    return (
      <div 
        className={`flex items-center justify-center bg-card border border-border ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-lg font-bold text-primary">M9</span>
      </div>
    );
  }

  return (
    <img 
      src={qrCodeUrl} 
      alt={`QR code for token ${tokenId}`}
      className={`border border-border ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

export default TokenQRCode;
