const AiMindTicker = () => {
  const thoughts = [
    "ANALYZING_MARKET_CONDITIONS",
    "CALCULATING_OPTIMAL_LAUNCH_TIME",
    "GENERATING_TOKEN_METADATA",
    "MONITORING_LIQUIDITY_POOLS",
    "SELECTING_LUCKY_WALLETS",
    "PROCESSING_FEE_DISTRIBUTION",
    "SCANNING_SOLANA_NETWORK",
    "OPTIMIZING_BONDING_CURVES",
    "EVALUATING_TREASURY_BALANCE",
    "QUEUING_NEXT_TOKEN_MINT"
  ];

  return (
    <div className="bg-secondary text-primary border-y border-border overflow-hidden py-3">
      <div className="ticker-wrapper">
        <div className="ticker-content font-mono text-xs tracking-wider">
          {thoughts.map((thought, index) => (
            <span key={index} className="ticker-item">
              {'>'} {thought} <span className="mx-6 text-primary">●</span>
            </span>
          ))}
          {thoughts.map((thought, index) => (
            <span key={`duplicate-${index}`} className="ticker-item">
              {'>'} {thought} <span className="mx-6 text-primary">●</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AiMindTicker;
