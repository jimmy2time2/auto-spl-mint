interface BondingCurveProgressProps {
  currentSol: number;
  targetSol: number;
  hasGraduated?: boolean;
}

export const BondingCurveProgress = ({ 
  currentSol, 
  targetSol, 
  hasGraduated = false 
}: BondingCurveProgressProps) => {
  const progress = Math.min((currentSol / targetSol) * 100, 100);
  const remaining = targetSol - currentSol;

  const formatValue = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="border border-border p-3">
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className="text-[10px] sm:text-xs font-bold uppercase truncate">Bonding Curve</span>
        <span className="text-xs font-bold tabular-nums shrink-0">{progress.toFixed(1)}%</span>
      </div>
      
      <div className="h-2 bg-muted rounded-none overflow-hidden mb-2">
        <div 
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {hasGraduated ? (
        <div className="text-xs text-primary font-bold">
          Coin has graduated!
        </div>
      ) : (
        <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground gap-2">
          <span className="truncate">{currentSol.toFixed(2)} SOL in curve</span>
          <span className="shrink-0">{formatValue(remaining * 150)} to grad</span>
        </div>
      )}
    </div>
  );
};
