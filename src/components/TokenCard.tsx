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

const TokenCard = ({ id, symbol, name, price, liquidity, volume }: TokenCardProps) => {
  return (
    <Link to={`/token/${id}`}>
      <div className="relative bg-card border border-border p-6 transition-all hover:border-primary/40 hover:shadow-lg group cursor-pointer overflow-hidden">
        <div className="relative z-10 space-y-4">
          {/* Header with QR code profile picture */}
          <div className="flex items-start gap-4 pb-4 border-b border-border/50">
            {/* QR Code as profile picture */}
            <TokenQRCode tokenId={id} size={56} tokenName={`$${symbol}`} />
            
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors metric-display truncate">
                ${symbol}
              </h3>
              <span className="metric-label text-muted-foreground text-xs block truncate">{name}</span>
            </div>
          </div>
          
          {/* Metrics */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="metric-label">Price</span>
              <span className="metric-display text-lg">${price.toFixed(6)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="metric-label">Liquidity</span>
              <span className="metric-display text-lg">{liquidity.toLocaleString()} SOL</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="metric-label">Volume 24h</span>
              <span className="metric-display text-lg">${volume.toLocaleString()}</span>
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
