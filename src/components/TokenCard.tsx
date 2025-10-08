import { Link } from "react-router-dom";

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
      <div className="relative bg-card border border-border rounded-2xl p-6 transition-all hover:border-primary/40 hover:shadow-lg group cursor-pointer overflow-hidden">
        <div className="relative z-10 space-y-4">
          {/* Header with decorative dots */}
          <div className="flex items-start justify-between pb-4 border-b border-border/50">
            <div>
              <h3 className="text-3xl font-light tracking-tight group-hover:text-primary transition-colors metric-display">
                ${symbol}
              </h3>
              <span className="metric-label text-muted-foreground">{name}</span>
            </div>
            <div className="flex gap-1 pt-2">
              <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <div className="w-1 h-1 rounded-full bg-muted-foreground/20" />
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
