interface ChartData {
  time: string;
  value: number;
}

interface TradingChartProps {
  data: ChartData[];
  tokenSymbol: string;
}

export const TradingChart = ({ data, tokenSymbol }: TradingChartProps) => {
  const minValue = Math.min(...data.map(d => d.value));
  const maxValue = Math.max(...data.map(d => d.value));
  const currentValue = data[data.length - 1]?.value || 0;

  return (
    <div className="w-full border-2 border-border p-6 bg-card">
      <div className="text-xs font-bold uppercase tracking-widest mb-6 border-b-2 border-border pb-2">
        {tokenSymbol} Price Chart (24H)
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="border-2 border-border p-3 bg-background">
            <div className="text-xs opacity-70 uppercase mb-1">Current</div>
            <div className="text-lg font-bold font-mono">${currentValue.toFixed(6)}</div>
          </div>
          <div className="border-2 border-border p-3 bg-background">
            <div className="text-xs opacity-70 uppercase mb-1">Low (24h)</div>
            <div className="text-lg font-bold font-mono text-red-600">${minValue.toFixed(6)}</div>
          </div>
          <div className="border-2 border-border p-3 bg-background">
            <div className="text-xs opacity-70 uppercase mb-1">High (24h)</div>
            <div className="text-lg font-bold font-mono text-green-600">${maxValue.toFixed(6)}</div>
          </div>
        </div>

        <div className="h-48 border-2 border-dashed border-border bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-xs uppercase opacity-70">Price Chart Visualization</div>
            <div className="text-xs mt-2 font-mono">{data.length} data points</div>
          </div>
        </div>

        <div className="text-xs opacity-70 text-center font-mono">
          Chart updates every 5 minutes
        </div>
      </div>
    </div>
  );
};
