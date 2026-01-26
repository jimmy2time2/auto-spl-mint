const AiMindTicker = () => {
  const thoughts = [
    "INITIALIZING",
    "LOADING_MODELS",
    "CONNECTING_SOLANA",
    "WARMING_UP",
    "SCANNING_MARKETS",
    "READY_TO_LAUNCH",
    "AWAITING_TRIGGER",
    "MONITORING"
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
