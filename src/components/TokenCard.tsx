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
      <TerminalCard className="hover:bg-secondary transition-colors cursor-pointer">
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-bold terminal-text">${symbol}</h3>
            <span className="text-sm terminal-text opacity-70">{name}</span>
          </div>
          
          <div className="border-t-2 border-dashed border-black pt-3 space-y-2">
            <div className="flex justify-between terminal-text">
              <span className="opacity-70">PRICE:</span>
              <span className="font-bold">${price.toFixed(6)}</span>
            </div>
            <div className="flex justify-between terminal-text">
              <span className="opacity-70">LIQUIDITY:</span>
              <span className="font-bold">{liquidity.toLocaleString()} SOL</span>
            </div>
            <div className="flex justify-between terminal-text">
              <span className="opacity-70">VOLUME_24H:</span>
              <span className="font-bold">${volume.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </TerminalCard>
    </Link>
  );
};

export default TokenCard;
