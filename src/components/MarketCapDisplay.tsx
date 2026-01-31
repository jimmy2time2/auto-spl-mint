interface MarketCapDisplayProps {
  marketCap: number;
  priceChange24h: number;
  athMarketCap?: number;
}

export const MarketCapDisplay = ({ 
  marketCap, 
  priceChange24h, 
  athMarketCap 
}: MarketCapDisplayProps) => {
  const formatMarketCap = (value: number) => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const changeValue = marketCap * (priceChange24h / 100);
  const isPositive = priceChange24h >= 0;

  return (
    <div className="p-3 sm:p-4 border-b border-border">
      <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mb-1">
        Market Cap
      </div>
      
      <div className="flex flex-col gap-2">
        <div className="min-w-0">
          <div className="text-xl sm:text-2xl md:text-3xl font-bold tabular-nums truncate">
            {formatMarketCap(marketCap)}
          </div>
          <div className={`text-xs sm:text-sm tabular-nums truncate ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{formatMarketCap(Math.abs(changeValue))} ({isPositive ? '+' : ''}{priceChange24h.toFixed(2)}%) 
            <span className="text-muted-foreground ml-1">24h</span>
          </div>
        </div>
        
        {athMarketCap && (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-0">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min((marketCap / athMarketCap) * 100, 100)}%` }}
              />
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap shrink-0">
              ATH <span className="text-foreground font-bold">{formatMarketCap(athMarketCap)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
