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
            <h3 className="text-3xl font-bold group-hover:text-primary transition-colors">
              ${symbol}
            </h3>
            <span className="text-sm text-muted-foreground">{name}</span>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="font-mono font-semibold text-lg">${price.toFixed(6)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Liquidity</span>
              <span className="font-mono font-semibold">{liquidity.toLocaleString()} SOL</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Volume 24h</span>
              <span className="font-mono font-semibold">${volume.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </TerminalCard>
    </Link>
  );
};

export default TokenCard;
