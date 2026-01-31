const TokenDistributionInfo = () => {
  const distributions = [
    { label: "PUBLIC", percentage: 83, description: "Available for trading" },
    { label: "AI", percentage: 7, description: "Autonomous profit generation" },
    { label: "PROTOCOL", percentage: 7, description: "Development & operations" },
    { label: "LUCKY", percentage: 3, description: "Random active user reward" },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header - matches LuckyWalletSection */}
      <div className="flex items-center border-b border-primary/30 overflow-x-auto scrollbar-hide">
        <div className="px-3 sm:px-4 py-2 sm:py-3 border-r border-primary/30 shrink-0">
          <span className="data-sm text-muted-foreground">DISTRIBUTION</span>
        </div>
        <div className="px-3 sm:px-4 py-2 sm:py-3 shrink-0">
          <span className="text-xs text-muted-foreground">AT MINT</span>
        </div>
      </div>

      {/* Distribution bars */}
      <div className="flex-1 p-3 sm:p-4">
        <div className="space-y-2">
          {distributions.map((item) => (
            <div key={item.label} className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 sm:w-10 text-right shrink-0">
                <span className="text-[10px] sm:text-xs tabular-nums glow-text">{item.percentage}%</span>
              </div>
              <div className="flex-1 h-1.5 bg-muted/30 relative overflow-hidden min-w-0">
                <div 
                  className="absolute inset-y-0 left-0 bg-primary/80"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <div className="w-16 sm:w-24 shrink-0">
                <p className="text-[10px] sm:text-xs truncate">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer stats - matches LuckyWalletSection structure */}
      <div className="border-t border-primary/30">
        <div className="grid grid-cols-2">
          <div className="p-2 sm:p-3 border-r border-primary/30">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">TRADE FEE</p>
            <p className="data-sm tabular-nums glow-text">2%</p>
          </div>
          <div className="p-2 sm:p-3">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">NET</p>
            <p className="data-sm tabular-nums">98%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenDistributionInfo;
