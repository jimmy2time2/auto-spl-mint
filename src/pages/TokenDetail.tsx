import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { TokenHeader } from "@/components/TokenHeader";
import { MarketCapDisplay } from "@/components/MarketCapDisplay";
import { PriceStatsRow } from "@/components/PriceStatsRow";
import { TradingChartPro } from "@/components/TradingChartPro";
import { TradePanel } from "@/components/TradePanel";
import { BondingCurveProgress } from "@/components/BondingCurveProgress";
import { TopHoldersList } from "@/components/TopHoldersList";
import { TokenComments } from "@/components/TokenComments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tables } from "@/integrations/supabase/types";

type Token = Tables<"tokens">;

interface ChartDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

const TokenDetail = () => {
  const { id } = useParams();
  const [token, setToken] = useState<Token | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceChanges, setPriceChanges] = useState({
    change5m: 0,
    change1h: 0,
    change6h: 0,
    change24h: 0,
  });

  useEffect(() => {
    if (id) {
      fetchTokenData();
    }
  }, [id]);

  const fetchTokenData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setToken(data);
        generateChartData(Number(data.price));
        generatePriceChanges();
      }
    } catch (error) {
      console.error('Error fetching token:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (currentPrice: number) => {
    const data: ChartDataPoint[] = [];
    const now = Date.now();
    let price = currentPrice * 0.7;
    
    for (let i = 48; i >= 0; i--) {
      const change = (Math.random() - 0.45) * 0.1;
      price = price * (1 + change);
      const high = price * (1 + Math.random() * 0.02);
      const low = price * (1 - Math.random() * 0.02);
      
      data.push({
        time: new Date(now - i * 30 * 60 * 1000).toISOString(),
        open: price,
        high: high,
        low: low,
        close: price * (1 + (Math.random() - 0.5) * 0.01),
        volume: Math.random() * 10000,
      });
    }
    
    // Ensure last point matches current price
    if (data.length > 0) {
      data[data.length - 1].close = currentPrice;
    }
    
    setChartData(data);
  };

  const generatePriceChanges = () => {
    setPriceChanges({
      change5m: (Math.random() - 0.5) * 20,
      change1h: (Math.random() - 0.5) * 30,
      change6h: (Math.random() - 0.5) * 50,
      change24h: (Math.random() - 0.5) * 60,
    });
  };

  const mockHolders = [
    { address: 'Liquidity pool', percentage: 7.86, isLiquidityPool: true },
    { address: '7eNR...KTto', percentage: 2.17 },
    { address: 'CpKu...C5mo', percentage: 1.99 },
    { address: 'F9c9...u5JL', percentage: 1.95 },
    { address: '4KW1...yuot', percentage: 1.85 },
    { address: 'EJPF...uiQM', percentage: 1.59 },
    { address: '3h65...axoE', percentage: 1.26 },
    { address: 'GJdJ...1hLC', percentage: 1.22 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="data-lg mb-2">LOADING<span className="cursor-blink">_</span></div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="p-8 text-center">
          <div className="data-sm text-muted-foreground mb-4">TOKEN NOT FOUND</div>
          <Link to="/explorer" className="text-sm text-primary hover:underline">
            Back to Explorer
          </Link>
        </div>
      </div>
    );
  }

  const marketCap = Number(token.price) * Number(token.supply);
  const athMarketCap = marketCap * 1.5;
  const bondingCurveSol = Number(token.liquidity) || 0;
  const targetSol = 85;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="w-full">
        {/* Token Header */}
        <TokenHeader
          name={token.name}
          symbol={token.symbol}
          mintAddress={token.mint_address}
          launchTimestamp={token.launch_timestamp}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px]">
          {/* Left Column - Chart & Info */}
          <div className="border-r border-border">
            {/* Market Cap */}
            <MarketCapDisplay
              marketCap={marketCap}
              priceChange24h={priceChanges.change24h}
              athMarketCap={athMarketCap}
            />

            {/* Trading Chart */}
            <TradingChartPro
              data={chartData}
              tokenSymbol={token.symbol}
            />

            {/* Price Stats Row */}
            <PriceStatsRow
              volume24h={Number(token.volume_24h)}
              price={Number(token.price)}
              change5m={priceChanges.change5m}
              change1h={priceChanges.change1h}
              change6h={priceChanges.change6h}
            />

            {/* Description & Tabs */}
            <div className="p-4 border-b border-border">
              <Tabs defaultValue="comments" className="w-full">
                <TabsList className="w-full justify-start gap-4 bg-transparent border-b border-border rounded-none h-auto p-0">
                  <TabsTrigger 
                    value="comments" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-0 pb-2 bg-transparent text-xs font-bold uppercase"
                  >
                    Comments
                  </TabsTrigger>
                  <TabsTrigger 
                    value="trades" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-0 pb-2 bg-transparent text-xs font-bold uppercase"
                  >
                    Trades
                  </TabsTrigger>
                  <TabsTrigger 
                    value="holders" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-0 pb-2 bg-transparent text-xs font-bold uppercase"
                  >
                    Holders
                  </TabsTrigger>
                  <TabsTrigger 
                    value="info" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-0 pb-2 bg-transparent text-xs font-bold uppercase"
                  >
                    Info
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="comments" className="mt-4">
                  <TokenComments tokenId={token.id} />
                </TabsContent>
                
                <TabsContent value="trades" className="mt-4">
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No recent trades
                  </div>
                </TabsContent>
                
                <TabsContent value="holders" className="mt-4">
                  <div className="space-y-2">
                    {mockHolders.map((holder, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <span className="font-mono text-xs">{holder.address}</span>
                        <span className="text-xs font-bold tabular-nums">{holder.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="info" className="mt-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Supply</span>
                      <span className="font-mono tabular-nums">{Number(token.supply).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Holders</span>
                      <span className="font-mono tabular-nums">{token.holders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Liquidity</span>
                      <span className="font-mono tabular-nums">{Number(token.liquidity)} SOL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Launch</span>
                      <span className="font-mono text-xs">{new Date(token.launch_timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Column - Trade Panel & Info */}
          <div className="space-y-4 p-4">
            {/* Trade Panel */}
            <TradePanel
              tokenId={token.id}
              tokenSymbol={token.symbol}
              currentPrice={Number(token.price)}
              onTradeComplete={fetchTokenData}
            />

            {/* Bonding Curve Progress */}
            <BondingCurveProgress
              currentSol={bondingCurveSol}
              targetSol={targetSol}
              hasGraduated={bondingCurveSol >= targetSol}
            />

            {/* Top Holders */}
            <TopHoldersList holders={mockHolders} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default TokenDetail;
