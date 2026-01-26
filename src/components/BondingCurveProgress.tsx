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

  return (
    <div className="border border-border p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase">Bonding Curve Progress</span>
        <span className="text-xs font-bold tabular-nums">{progress.toFixed(1)}%</span>
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
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{currentSol.toFixed(2)} SOL in bonding curve</span>
          <span>${(remaining * 150).toFixed(0)} to graduate</span>
        </div>
      )}
    </div>
  );
};
