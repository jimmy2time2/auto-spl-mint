import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, Time } from "lightweight-charts";

interface ChartDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface TradingChartProProps {
  data: ChartDataPoint[];
  tokenSymbol: string;
}

export const TradingChartPro = ({ data, tokenSymbol }: TradingChartProProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [timeframe, setTimeframe] = useState<'1D' | '5D' | '1M'>('1D');

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'hsl(75, 100%, 50%)',
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(191, 255, 0, 0.1)' },
        horzLines: { color: 'rgba(191, 255, 0, 0.1)' },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: 'rgba(191, 255, 0, 0.5)',
          width: 1,
          style: 2,
          labelBackgroundColor: 'hsl(75, 100%, 50%)',
        },
        horzLine: {
          color: 'rgba(191, 255, 0, 0.5)',
          width: 1,
          style: 2,
          labelBackgroundColor: 'hsl(75, 100%, 50%)',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(191, 255, 0, 0.2)',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: 'rgba(191, 255, 0, 0.2)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: false,
      handleScroll: false,
    });

    chartRef.current = chart;

    // Use line series as a simpler alternative (lightweight-charts v5 API)
    const lineSeries = chart.addSeries({
      type: 'Line',
      color: '#22c55e',
      lineWidth: 2,
      priceFormat: { type: 'price', precision: 8, minMove: 0.00000001 },
    } as any);

    // Add area below line
    const areaSeries = chart.addSeries({
      type: 'Area',
      topColor: 'rgba(34, 197, 94, 0.3)',
      bottomColor: 'rgba(34, 197, 94, 0.0)',
      lineColor: 'rgba(34, 197, 94, 0)',
      lineWidth: 0,
      priceFormat: { type: 'price', precision: 8, minMove: 0.00000001 },
    } as any);

    if (data.length > 0) {
      const lineData = data.map(d => ({
        time: (new Date(d.time).getTime() / 1000) as Time,
        value: d.close,
      }));

      lineSeries.setData(lineData);
      areaSeries.setData(lineData);
      chart.timeScale().fitContent();
    }

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return (
    <div className="border-b border-border">
      <div className="flex items-center justify-between p-2 px-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase">{tokenSymbol}/SOL</span>
          <span className="text-[10px] text-muted-foreground">Market Cap (USD) - 24h</span>
        </div>
        <div className="flex items-center gap-1">
          {(['1D', '5D', '1M'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-1 text-[10px] font-bold transition-colors ${
                timeframe === tf 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      
      <div ref={chartContainerRef} className="h-[300px] sm:h-[400px] w-full" />
    </div>
  );
};
