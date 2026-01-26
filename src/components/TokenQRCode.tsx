import { QRCodeSVG } from 'qrcode.react';
import { getTokenUrl } from '@/lib/qrCodeGenerator';

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
  const tokenUrl = getTokenUrl(tokenId);
  
  // Calculate logo size (25% of QR code)
  const logoSize = Math.max(size * 0.28, 14);

  return (
    <div 
      className={`relative border border-border bg-[#0A0A0A] ${className}`}
      style={{ width: size, height: size }}
    >
      <QRCodeSVG
        value={tokenUrl}
        size={size}
        bgColor="#0A0A0A"
        fgColor="#BFFF00"
        level="H" // High error correction to allow for logo overlay
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* M9 Logo Overlay in Center */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div 
          className="bg-[#0A0A0A] border border-primary flex items-center justify-center"
          style={{ 
            width: logoSize, 
            height: logoSize,
          }}
        >
          <span 
            className="font-bold text-primary"
            style={{ 
              fontSize: logoSize * 0.5,
              fontFamily: '"IBM Plex Mono", monospace',
              lineHeight: 1,
            }}
          >
            M9
          </span>
        </div>
      </div>
    </div>
  );
};

export default TokenQRCode;
