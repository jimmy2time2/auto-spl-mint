interface PriceStatsRowProps {
  volume24h: number;
  price: number;
  change5m: number;
  change1h: number;
  change6h: number;
}

export const PriceStatsRow = ({ 
  volume24h, 
  price, 
  change5m, 
  change1h, 
  change6h 
}: PriceStatsRowProps) => {
  const formatChange = (value: number) => {
    const isPositive = value >= 0;
    return `${isPositive ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getChangeClass = (value: number) => {
    return value >= 0 ? 'text-green-500' : 'text-red-500';
  };

  const formatVolume = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPrice = (value: number) => {
    if (value < 0.000001) return `$${value.toExponential(2)}`;
    if (value < 0.01) return `$${value.toFixed(6)}`;
    return `$${value.toFixed(4)}`;
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 border-b border-border">
      <div className="p-2 sm:p-3 text-center border-r border-border">
        <div className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1">Vol 24h</div>
        <div className="text-xs sm:text-sm font-bold tabular-nums truncate">{formatVolume(volume24h)}</div>
      </div>
      <div className="p-2 sm:p-3 text-center border-r border-border">
        <div className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1">Price</div>
        <div className="text-xs sm:text-sm font-bold tabular-nums truncate">{formatPrice(price)}</div>
      </div>
      <div className="p-2 sm:p-3 text-center border-r border-border hidden sm:block">
        <div className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1">5m</div>
        <div className={`text-xs sm:text-sm font-bold tabular-nums ${getChangeClass(change5m)}`}>
          {formatChange(change5m)}
        </div>
      </div>
      <div className="p-2 sm:p-3 text-center border-r border-border hidden sm:block">
        <div className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1">1h</div>
        <div className={`text-xs sm:text-sm font-bold tabular-nums ${getChangeClass(change1h)}`}>
          {formatChange(change1h)}
        </div>
      </div>
      <div className="p-2 sm:p-3 text-center">
        <div className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1">6h</div>
        <div className={`text-xs sm:text-sm font-bold tabular-nums ${getChangeClass(change6h)}`}>
          {formatChange(change6h)}
        </div>
      </div>
    </div>
  );
};
