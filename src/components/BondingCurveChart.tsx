import { useMemo } from "react";

interface BondingCurveChartProps {
  currentSupply: number;
  totalSupply: number;
  currentPrice: number;
  curveType?: 'linear' | 'exponential' | 'sigmoid';
}

const BondingCurveChart = ({ 
  currentSupply, 
  totalSupply, 
  currentPrice,
  curveType = 'exponential' 
}: BondingCurveChartProps) => {
  const width = 280;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 20, left: 40 };
  
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const curveData = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    const steps = 50;
    
    for (let i = 0; i <= steps; i++) {
      const supply = (i / steps) * totalSupply;
      let price: number;
      
      switch (curveType) {
        case 'linear':
          price = currentPrice * (1 + supply / totalSupply);
          break;
        case 'exponential':
          price = currentPrice * Math.pow(1 + supply / totalSupply, 2);
          break;
        case 'sigmoid':
          const x = (supply / totalSupply - 0.5) * 10;
          price = currentPrice * (1 + 1 / (1 + Math.exp(-x)));
          break;
        default:
          price = currentPrice;
      }
      
      points.push({ x: supply, y: price });
    }
    
    return points;
  }, [totalSupply, currentPrice, curveType]);
  
  const maxPrice = Math.max(...curveData.map(p => p.y));
  
  const scaleX = (val: number) => padding.left + (val / totalSupply) * chartWidth;
  const scaleY = (val: number) => padding.top + chartHeight - (val / maxPrice) * chartHeight;
  
  const pathD = curveData
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`)
    .join(' ');
  
  const filledPathD = `${pathD} L ${scaleX(totalSupply)} ${scaleY(0)} L ${scaleX(0)} ${scaleY(0)} Z`;
  
  const currentX = scaleX(currentSupply);
  const currentY = scaleY(currentPrice);
  
  const progressPercent = (currentSupply / totalSupply) * 100;

  return (
    <div className="border border-border p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="data-sm">BONDING CURVE</span>
        <span className="data-sm text-muted-foreground">{progressPercent.toFixed(1)}% FILLED</span>
      </div>
      
      <svg width={width} height={height} className="w-full">
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={padding.left}
            y1={scaleY(maxPrice * pct)}
            x2={width - padding.right}
            y2={scaleY(maxPrice * pct)}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeDasharray="2,2"
          />
        ))}
        
        {/* Filled area (sold) */}
        <path
          d={`M ${scaleX(0)} ${scaleY(curveData[0].y)} 
              ${curveData
                .filter(p => p.x <= currentSupply)
                .map(p => `L ${scaleX(p.x)} ${scaleY(p.y)}`)
                .join(' ')}
              L ${currentX} ${scaleY(0)}
              L ${scaleX(0)} ${scaleY(0)} Z`}
          fill="currentColor"
          fillOpacity={0.15}
        />
        
        {/* Curve line */}
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeOpacity={0.5}
        />
        
        {/* Active portion */}
        <path
          d={curveData
            .filter(p => p.x <= currentSupply)
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`)
            .join(' ')}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
        />
        
        {/* Current position marker */}
        <circle
          cx={currentX}
          cy={currentY}
          r={4}
          fill="hsl(var(--primary))"
          className="animate-pulse"
        />
        
        {/* Crosshairs */}
        <line
          x1={currentX}
          y1={currentY}
          x2={currentX}
          y2={height - padding.bottom}
          stroke="hsl(var(--primary))"
          strokeDasharray="2,2"
          strokeOpacity={0.5}
        />
        <line
          x1={padding.left}
          y1={currentY}
          x2={currentX}
          y2={currentY}
          stroke="hsl(var(--primary))"
          strokeDasharray="2,2"
          strokeOpacity={0.5}
        />
        
        {/* X-axis label */}
        <text
          x={width / 2}
          y={height - 2}
          textAnchor="middle"
          className="fill-muted-foreground text-[8px] font-mono"
        >
          SUPPLY
        </text>
        
        {/* Y-axis label */}
        <text
          x={8}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90, 8, ${height / 2})`}
          className="fill-muted-foreground text-[8px] font-mono"
        >
          PRICE
        </text>
      </svg>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-border">
        <div className="text-center">
          <div className="text-[9px] text-muted-foreground">SOLD</div>
          <div className="data-sm tabular-nums">{(currentSupply / 1000).toFixed(0)}K</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-muted-foreground">REMAINING</div>
          <div className="data-sm tabular-nums">{((totalSupply - currentSupply) / 1000).toFixed(0)}K</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-muted-foreground">PRICE</div>
          <div className="data-sm tabular-nums">${currentPrice.toFixed(4)}</div>
        </div>
      </div>
    </div>
  );
};

export default BondingCurveChart;
