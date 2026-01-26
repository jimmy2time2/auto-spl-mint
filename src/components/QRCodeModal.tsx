import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from 'qrcode.react';
import { getTokenUrl } from '@/lib/qrCodeGenerator';
import { useEffect, useState } from 'react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: string;
  tokenName?: string;
}

/**
 * QRCodeModal Component
 * Full-screen modal displaying a large, scannable QR code
 */
const QRCodeModal = ({ isOpen, onClose, tokenId, tokenName }: QRCodeModalProps) => {
  const tokenUrl = getTokenUrl(tokenId);
  const [isInverted, setIsInverted] = useState(false);
  
  // Listen for theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsInverted(document.documentElement.classList.contains('theme-inverted'));
    };
    
    checkTheme();
    
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
  
  const qrSize = 280;
  const logoSize = qrSize * 0.22;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-border bg-background p-6">
        <DialogTitle className="sr-only">QR Code for {tokenName || 'Token'}</DialogTitle>
        
        <div className="flex flex-col items-center gap-6">
          {/* Large QR Code */}
          <div 
            className="relative border-2 border-border p-4"
            style={{ backgroundColor: bgColor }}
          >
            <QRCodeSVG
              value={tokenUrl}
              size={qrSize}
              bgColor={bgColor}
              fgColor={fgColor}
              level="H"
            />
            
            {/* M9 Logo Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="flex items-center justify-center"
                style={{ 
                  width: logoSize, 
                  height: logoSize,
                  backgroundColor: bgColor,
                  border: `2px solid ${fgColor}`,
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
          
          {/* Token Info */}
          <div className="text-center space-y-2">
            {tokenName && (
              <p className="font-mono text-lg font-bold text-primary">{tokenName}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Scan to view token details
            </p>
            <p className="text-xs text-muted-foreground font-mono break-all max-w-[280px]">
              {tokenUrl}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeModal;
