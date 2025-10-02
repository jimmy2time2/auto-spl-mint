import { Link } from "react-router-dom";
import TerminalCard from "./TerminalCard";

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
      <TerminalCard className="hover:shadow-xl hover:border-primary transition-all cursor-pointer group">
        <div className="space-y-6">
          <div className="flex items-baseline justify-between">
            <h3 className="text-5xl font-extrabold group-hover:text-primary transition-colors">
              ${symbol}
            </h3>
            <span className="text-sm text-muted-foreground font-medium">{name}</span>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Price</span>
              <span className="font-mono font-extrabold text-2xl">${price.toFixed(6)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Liquidity</span>
              <span className="font-mono font-extrabold text-2xl">{liquidity.toLocaleString()} SOL</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Volume 24h</span>
              <span className="font-mono font-extrabold text-2xl">${volume.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </TerminalCard>
    </Link>
  );
};

export default TokenCard;
