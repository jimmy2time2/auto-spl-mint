interface Holder {
  address: string;
  percentage: number;
  isLiquidityPool?: boolean;
}

interface TopHoldersListProps {
  holders: Holder[];
}

export const TopHoldersList = ({ holders }: TopHoldersListProps) => {
  const formatAddress = (addr: string) => {
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <div className="border border-border">
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
        <span className="text-xs font-bold uppercase">Top Holders</span>
        <button className="text-xs text-primary hover:underline">
          View all
        </button>
      </div>
      
      <div className="max-h-64 overflow-y-auto">
        {holders.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No holder data available
          </div>
        ) : (
          holders.map((holder, index) => (
            <div 
              key={holder.address}
              className="flex items-center justify-between p-2 px-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">
                  {formatAddress(holder.address)}
                </span>
                {holder.isLiquidityPool && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary border border-primary/30">
                    LP
                  </span>
                )}
              </div>
              <span className="text-xs tabular-nums font-bold">
                {holder.percentage.toFixed(2)}%
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
