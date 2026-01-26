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
    <div className="border-b-2 border-primary overflow-hidden bg-muted">
      <div className="ticker-wrapper">
        <div className="ticker-content py-2">
          {thoughts.map((thought, index) => (
            <span key={index} className="ticker-item data-sm">
              <span className="text-primary">⏻</span>
              <span className="ml-2">{thought}</span>
              <span className="mx-6 text-primary/30">|</span>
            </span>
          ))}
          {thoughts.map((thought, index) => (
            <span key={`dup-${index}`} className="ticker-item data-sm">
              <span className="text-primary">⏻</span>
              <span className="ml-2">{thought}</span>
              <span className="mx-6 text-primary/30">|</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AiMindTicker;
