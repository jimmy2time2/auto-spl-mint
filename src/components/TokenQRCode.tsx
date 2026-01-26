import { QRCodeSVG } from 'qrcode.react';
import { getTokenUrl } from '@/lib/qrCodeGenerator';
import { useEffect, useState } from 'react';
import QRCodeModal from './QRCodeModal';

interface TokenQRCodeProps {
  tokenId: string;
  size?: number;
  className?: string;
  tokenName?: string;
  clickable?: boolean;
}

/**
 * TokenQRCode Component
 * Displays a branded M9 QR code that links to the token page
 * - Theme-aware: inverts colors based on website theme
 * - "M9" logo in center with matching background
 * - Optional click to expand for scanning
 */
const TokenQRCode = ({ 
  tokenId, 
  size = 56, 
  className = '', 
  tokenName,
  clickable = true 
}: TokenQRCodeProps) => {
  const tokenUrl = getTokenUrl(tokenId);
  const [isInverted, setIsInverted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Listen for theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsInverted(document.documentElement.classList.contains('theme-inverted'));
    };
    
    checkTheme();
    
    // Watch for class changes on root element
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);
  
  // Theme-aware colors
  const bgColor = isInverted ? '#BFFF00' : '#0A0A0A';
  const fgColor = isInverted ? '#0A0A0A' : '#BFFF00';
  
  // Calculate logo size (28% of QR code)
  const logoSize = Math.max(size * 0.28, 14);

  const handleClick = (e: React.MouseEvent) => {
    if (clickable) {
      e.preventDefault();
      e.stopPropagation();
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div 
        className={`relative border border-border ${clickable ? 'cursor-pointer hover:border-primary transition-colors' : ''} ${className}`}
        style={{ 
          width: size, 
          height: size,
          backgroundColor: bgColor,
        }}
        onClick={handleClick}
        title={clickable ? "Click to enlarge QR code" : undefined}
      >
        <QRCodeSVG
          value={tokenUrl}
          size={size}
          bgColor={bgColor}
          fgColor={fgColor}
          level="H" // High error correction to allow for logo overlay
          style={{ width: '100%', height: '100%' }}
        />
        
        {/* M9 Logo Overlay in Center */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div 
            className="flex items-center justify-center"
            style={{ 
              width: logoSize, 
              height: logoSize,
              backgroundColor: bgColor,
              border: `1px solid ${fgColor}`,
            }}
          >
            <span 
              className="font-bold"
              style={{ 
                fontSize: logoSize * 0.5,
                fontFamily: '"IBM Plex Mono", monospace',
                lineHeight: 1,
                color: fgColor,
              }}
            >
              M9
            </span>
          </div>
        </div>
      </div>
      
      {clickable && (
        <QRCodeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tokenId={tokenId}
          tokenName={tokenName}
        />
      )}
    </>
  );
};

export default TokenQRCode;
