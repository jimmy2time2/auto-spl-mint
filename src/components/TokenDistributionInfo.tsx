const TokenDistributionInfo = () => {
  const distributions = [
    { label: "PUBLIC SALE", percentage: 83, description: "Available for trading" },
    { label: "AI WALLET", percentage: 7, description: "Autonomous profit generation" },
    { label: "CREATOR", percentage: 5, description: "Token creator reward" },
    { label: "LUCKY WALLET", percentage: 3, description: "Random active user reward" },
    { label: "SYSTEM", percentage: 2, description: "Protocol operations" },
  ];

  return (
    <div className="border-b-2 border-primary h-full">
      <div className="border-b border-primary/30 px-6 py-4">
        <h2 className="data-sm">TOKEN DISTRIBUTION</h2>
      </div>
      <div className="p-6">
        <p className="text-xs text-muted-foreground mb-4">
          When a new token is created, the supply is distributed as follows:
        </p>
        <div className="space-y-3">
          {distributions.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-12 text-right">
                <span className="data-sm tabular-nums glow-text">{item.percentage}%</span>
              </div>
              <div className="flex-1 h-2 bg-muted/30 relative overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-primary/80"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <div className="w-32 sm:w-40">
                <p className="data-sm truncate">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-primary/20">
          <p className="text-xs text-muted-foreground mb-2">TRADING FEES</p>
          <div className="flex gap-6">
            <div>
              <span className="data-sm glow-text">1%</span>
              <span className="text-xs text-muted-foreground ml-2">to Creator</span>
            </div>
            <div>
              <span className="data-sm glow-text">1%</span>
              <span className="text-xs text-muted-foreground ml-2">to System</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenDistributionInfo;
