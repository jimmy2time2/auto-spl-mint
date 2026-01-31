import { Link } from "react-router-dom";
import TokenQRCode from "./TokenQRCode";

interface TokenCardProps {
  id: string;
  symbol: string;
  name: string;
  price: number;
  liquidity: number;
  volume: number;
}

const formatValue = (num: number, prefix = '', suffix = '') => {
  if (num >= 1_000_000) return `${prefix}${(num / 1_000_000).toFixed(1)}M${suffix}`;
  if (num >= 1_000) return `${prefix}${(num / 1_000).toFixed(1)}K${suffix}`;
  return `${prefix}${num.toFixed(2)}${suffix}`;
};

const formatPrice = (price: number) => {
  if (price < 0.000001) return `$${price.toExponential(2)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
  return `$${price.toFixed(4)}`;
};

const TokenCard = ({ id, symbol, name, price, liquidity, volume }: TokenCardProps) => {
  return (
    <Link to={`/token/${id}`}>
      <div className="relative bg-card border border-border p-4 sm:p-6 transition-all hover:border-primary/40 hover:shadow-lg group cursor-pointer overflow-hidden">
        <div className="relative z-10 space-y-3 sm:space-y-4">
          {/* Header with QR code profile picture */}
          <div className="flex items-start gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-border/50">
            {/* QR Code as profile picture */}
            <TokenQRCode tokenId={id} size={48} tokenName={`$${symbol}`} className="shrink-0" />
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight group-hover:text-primary transition-colors metric-display truncate">
                ${symbol}
              </h3>
              <span className="metric-label text-muted-foreground text-xs block truncate">{name}</span>
            </div>
          </div>
          
          {/* Metrics */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-baseline gap-2">
              <span className="metric-label shrink-0">Price</span>
              <span className="metric-display text-base sm:text-lg truncate">{formatPrice(price)}</span>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="metric-label shrink-0">Liquidity</span>
              <span className="metric-display text-base sm:text-lg truncate">{formatValue(liquidity, '', ' SOL')}</span>
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className="metric-label shrink-0">Volume 24h</span>
              <span className="metric-display text-base sm:text-lg truncate">{formatValue(volume, '$')}</span>
            </div>
          </div>
        </div>

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/[0.02] pointer-events-none group-hover:to-primary/[0.04] transition-all" />
      </div>
    </Link>
  );
};

export default TokenCard;
