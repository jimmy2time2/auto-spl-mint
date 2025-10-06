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
      <TerminalCard className="hover:border-primary transition-all cursor-pointer group">
        <div className="space-y-4">
          <div className="flex items-start justify-between border-b-2 border-border pb-3">
            <div>
              <h3 className="text-4xl font-bold font-mono group-hover:text-primary transition-colors">
                ${symbol}
              </h3>
              <span className="text-[10px] text-foreground font-bold uppercase tracking-widest">{name}</span>
            </div>
          </div>
          
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-baseline border-b border-border pb-2">
              <span className="font-bold uppercase tracking-widest">Prix</span>
              <span className="font-mono font-bold">${price.toFixed(6)}</span>
            </div>
            <div className="flex justify-between items-baseline border-b border-border pb-2">
              <span className="font-bold uppercase tracking-widest">Liquidité</span>
              <span className="font-mono font-bold">{liquidity.toLocaleString()} SOL</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="font-bold uppercase tracking-widest">Volume 24h</span>
              <span className="font-mono font-bold">${volume.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </TerminalCard>
    </Link>
  );
};

export default TokenCard;
