const AiMindTicker = () => {
  const thoughts = [
    "ANALYZING_MARKET",
    "CALC_LAUNCH_TIME",
    "GEN_TOKEN_META",
    "SCAN_LIQUIDITY",
    "SELECT_LUCKY",
    "PROCESS_FEES",
    "SCAN_NETWORK",
    "OPT_CURVES",
    "EVAL_TREASURY",
    "QUEUE_MINT"
  ];

  return (
    <div className="border-b border-border overflow-hidden">
      <div className="ticker-wrapper">
        <div className="ticker-content py-1">
          {thoughts.map((thought, index) => (
            <span key={index} className="ticker-item data-sm text-muted-foreground">
              {'>'}{thought}<span className="mx-6 opacity-30">|</span>
            </span>
          ))}
          {thoughts.map((thought, index) => (
            <span key={`dup-${index}`} className="ticker-item data-sm text-muted-foreground">
              {'>'}{thought}<span className="mx-6 opacity-30">|</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AiMindTicker;
