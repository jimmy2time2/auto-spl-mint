/**
 * M9 Token Name Generator
 * Generates 7-digit random token names with M9 branding
 */

/**
 * Generate a 7-digit random token name
 * Format: "1234567 Created by M9"
 */
export function generateTokenName(): { name: string; symbol: string } {
  // Generate 7 random digits (ensuring first digit is not 0)
  const digits = Math.floor(1000000 + Math.random() * 9000000).toString();
  
  return {
    name: `${digits} Created by M9`,
    symbol: digits.slice(0, 5).toUpperCase(), // Use first 5 digits as symbol
  };
}

/**
 * Get the token URL for QR code
 */
export function getTokenUrl(tokenId: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://mind9.app';
  
  return `${baseUrl}/token/${tokenId}`;
}
