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
      <TerminalCard className="hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:border-primary transition-all cursor-pointer group">
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h3 className="pixel-text text-4xl group-hover:text-primary transition-colors">
              ${symbol}
            </h3>
            <span className="terminal-text text-sm text-muted-foreground">{name}</span>
          </div>
          
          <div className="border-t-2 border-dashed border-black pt-4 space-y-2">
            <div className="flex justify-between terminal-text">
              <span className="text-muted-foreground">PRICE:</span>
              <span className="font-bold">${price.toFixed(6)}</span>
            </div>
            <div className="flex justify-between terminal-text">
              <span className="text-muted-foreground">LIQUIDITY:</span>
              <span className="font-bold">{liquidity.toLocaleString()} SOL</span>
            </div>
            <div className="flex justify-between terminal-text">
              <span className="text-muted-foreground">VOLUME_24H:</span>
              <span className="font-bold">${volume.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </TerminalCard>
    </Link>
  );
};

export default TokenCard;
