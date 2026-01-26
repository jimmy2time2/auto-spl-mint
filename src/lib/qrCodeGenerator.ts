/**
 * M9 QR Code Generator
 * Generates branded QR codes with M9 logo in center
 * Colors match the website theme (lime on black)
 */

import QRCode from 'qrcode';

interface QRCodeOptions {
  tokenId: string;
  size?: number;
}

/**
 * Generate a 7-digit random token name
 * Format: "1234567 Created by M9"
 */
export function generateTokenName(): { name: string; symbol: string } {
  // Generate 7 random digits
  const digits = Math.floor(1000000 + Math.random() * 9000000).toString();
  
  return {
    name: `${digits} Created by M9`,
    symbol: digits.slice(0, 5).toUpperCase(), // Use first 5 digits as symbol
  };
}

/**
 * Generate a QR code data URL with M9 branding
 * - Lime (#BFFF00) on black background
 * - "M9" text in center
 */
export async function generateM9QRCode({ tokenId, size = 200 }: QRCodeOptions): Promise<string> {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://mind9.app';
  
  const tokenUrl = `${baseUrl}/token/${tokenId}`;
  
  try {
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(tokenUrl, {
      width: size,
      margin: 2,
      color: {
        dark: '#BFFF00', // Neon lime (foreground/modules)
        light: '#0A0A0A', // Near black (background)
      },
      errorCorrectionLevel: 'H', // High error correction to allow for logo overlay
    });
    
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    // Return a fallback placeholder
    return '';
  }
}

/**
 * Generate QR code with M9 logo overlay
 * Uses canvas for the overlay effect
 */
export async function generateM9QRCodeWithLogo({ tokenId, size = 200 }: QRCodeOptions): Promise<string> {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://mind9.app';
  
  const tokenUrl = `${baseUrl}/token/${tokenId}`;
  
  return new Promise((resolve, reject) => {
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    // Generate QR code to canvas
    QRCode.toCanvas(canvas, tokenUrl, {
      width: size,
      margin: 2,
      color: {
        dark: '#BFFF00', // Neon lime
        light: '#0A0A0A', // Near black
      },
      errorCorrectionLevel: 'H',
    }, (error) => {
      if (error) {
        reject(error);
        return;
      }
      
      // Draw M9 logo in center
      const logoSize = size * 0.25; // 25% of QR code size
      const logoX = (size - logoSize) / 2;
      const logoY = (size - logoSize) / 2;
      
      // Draw black background for logo
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(logoX - 4, logoY - 4, logoSize + 8, logoSize + 8);
      
      // Draw lime border around logo area
      ctx.strokeStyle = '#BFFF00';
      ctx.lineWidth = 2;
      ctx.strokeRect(logoX - 4, logoY - 4, logoSize + 8, logoSize + 8);
      
      // Draw "M9" text
      ctx.fillStyle = '#BFFF00';
      ctx.font = `bold ${logoSize * 0.6}px "IBM Plex Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('M9', size / 2, size / 2);
      
      // Convert to data URL
      resolve(canvas.toDataURL('image/png'));
    });
  });
}

/**
 * Generate QR code SVG string (for server-side/edge functions)
 */
export async function generateM9QRCodeSVG({ tokenId, size = 200 }: QRCodeOptions): Promise<string> {
  const baseUrl = 'https://mind9.app';
  const tokenUrl = `${baseUrl}/token/${tokenId}`;
  
  try {
    const svg = await QRCode.toString(tokenUrl, {
      type: 'svg',
      width: size,
      margin: 2,
      color: {
        dark: '#BFFF00',
        light: '#0A0A0A',
      },
      errorCorrectionLevel: 'H',
    });
    
    // Inject M9 logo into SVG
    const logoSize = size * 0.25;
    const logoX = (size - logoSize) / 2;
    const logoY = (size - logoSize) / 2;
    
    const logoSvg = `
      <rect x="${logoX - 4}" y="${logoY - 4}" width="${logoSize + 8}" height="${logoSize + 8}" fill="#0A0A0A" stroke="#BFFF00" stroke-width="2"/>
      <text x="${size / 2}" y="${size / 2}" fill="#BFFF00" font-family="monospace" font-size="${logoSize * 0.6}" font-weight="bold" text-anchor="middle" dominant-baseline="central">M9</text>
    `;
    
    // Insert logo before closing svg tag
    return svg.replace('</svg>', `${logoSvg}</svg>`);
  } catch (error) {
    console.error('Error generating QR SVG:', error);
    return '';
  }
}
