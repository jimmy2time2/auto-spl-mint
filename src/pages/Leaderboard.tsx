import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import AsciiDivider from "@/components/AsciiDivider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tables } from "@/integrations/supabase/types";

type Wallet = Tables<"wallets">;
type Token = Tables<"tokens">;

interface TopTrader {
  wallet: string;
  volume: number;
  trades: number;
  pnl: number;
  winRate: number;
}

interface TopGainer {
  token: Token;
  change24h: number;
}

const Leaderboard = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [totalDistributed, setTotalDistributed] = useState(0);
  const [avgReward, setAvgReward] = useState(0);
  const [timeFilter, setTimeFilter] = useState('7d');
  const [activeTab, setActiveTab] = useState('lucky');

  // Mock top traders data
  const [topTraders] = useState<TopTrader[]>([
    { wallet: 'Dex4...K9vP', volume: 125000, trades: 342, pnl: 8500, winRate: 68 },
    { wallet: 'Gh7R...W2nL', volume: 98000, trades: 287, pnl: 6200, winRate: 62 },
    { wallet: 'Ak3M...Y8pQ', volume: 87500, trades: 198, pnl: 4800, winRate: 71 },
    { wallet: 'Np9X...H4tR', volume: 76000, trades: 156, pnl: 3200, winRate: 58 },
    { wallet: 'Ws2F...J7mK', volume: 65000, trades: 134, pnl: 2100, winRate: 55 },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      const [walletRes, tokenRes] = await Promise.all([
        supabase
          .from("wallets")
          .select("*")
          .eq("type", "public_lucky")
          .order("total_rewards", { ascending: false }),
        supabase
          .from("tokens")
          .select("*")
          .order("volume_24h", { ascending: false })
          .limit(5)
      ]);

      if (walletRes.data) {
        setWallets(walletRes.data);
        const total = walletRes.data.reduce((sum, w) => sum + Number(w.total_rewards), 0);
        setTotalDistributed(total);
        setAvgReward(walletRes.data.length > 0 ? total / walletRes.data.length : 0);
      }
      
      if (tokenRes.data) {
        setTokens(tokenRes.data);
      }
    };
    
    fetchData();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="border-b border-border px-4 py-3 bg-muted">
          <div className="data-sm">LEADERBOARDS & STATS</div>
          <div className="text-xs text-muted-foreground">Community rankings and performance metrics</div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-border">
          <div className="border-r border-b md:border-b-0 border-border p-4 text-center">
            <div className="data-lg tabular-nums">{totalDistributed.toFixed(2)}</div>
            <div className="data-sm text-muted-foreground">TOTAL SOL DIST</div>
          </div>
          <div className="border-b md:border-b-0 md:border-r border-border p-4 text-center">
            <div className="data-lg tabular-nums">{wallets.length}</div>
            <div className="data-sm text-muted-foreground">LUCKY WALLETS</div>
          </div>
          <div className="border-r border-border p-4 text-center">
            <div className="data-lg tabular-nums">{tokens.length}</div>
            <div className="data-sm text-muted-foreground">TOKENS LAUNCHED</div>
          </div>
          <div className="p-4 text-center">
            <div className="data-lg tabular-nums">{topTraders.reduce((s, t) => s + t.trades, 0)}</div>
            <div className="data-sm text-muted-foreground">TOTAL TRADES</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger 
              value="lucky" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 data-sm"
            >
              🍀 LUCKY WALLETS
            </TabsTrigger>
            <TabsTrigger 
              value="traders" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 data-sm"
            >
              📊 TOP TRADERS
            </TabsTrigger>
            <TabsTrigger 
              value="gainers" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 data-sm"
            >
              🚀 TOP GAINERS
            </TabsTrigger>
          </TabsList>

          {/* Lucky Wallets Tab */}
          <TabsContent value="lucky" className="mt-0">
            {/* Filter */}
            <div className="border-b border-border p-3 flex gap-1">
              {['24h', '7d', 'all'].map((f) => (
                <Button 
                  key={f}
                  variant={timeFilter === f ? 'default' : 'outline'} 
                  onClick={() => setTimeFilter(f)}
                  className="h-8 px-3 data-sm"
                >
                  {f.toUpperCase()}
                </Button>
              ))}
            </div>

            <AsciiDivider pattern="asterisk" text="RANKINGS" />

            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[500px]">
                <thead>
                  <tr>
                    <th className="w-12">#</th>
                    <th>WALLET</th>
                    <th className="text-right">REWARDS</th>
                    <th className="text-right hidden sm:table-cell">COUNT</th>
                    <th className="text-center">VIEW</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8">
                        <div className="text-muted-foreground">No lucky wallets yet</div>
                      </td>
                    </tr>
                  ) : (
                    wallets.map((wallet, index) => {
                      const rank = index + 1;
                      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                      
                      return (
                        <tr key={wallet.id} className={rank <= 3 ? 'bg-muted/50' : ''}>
                          <td className="font-bold">
                            {medal || rank}
                          </td>
                          <td className="font-mono truncate max-w-[200px]">{wallet.address}</td>
                          <td className="text-right tabular-nums font-bold text-green-500">
                            +{Number(wallet.total_rewards).toFixed(2)} SOL
                          </td>
                          <td className="text-right tabular-nums hidden sm:table-cell">
                            {wallet.reward_count}x
                          </td>
                          <td className="text-center">
                            <a 
                              href={`https://solscan.io/account/${wallet.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="data-sm hover:underline"
                            >
                              →
                            </a>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Top Traders Tab */}
          <TabsContent value="traders" className="mt-0">
            <AsciiDivider pattern="arrow" text="TOP TRADERS" />
            
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[600px]">
                <thead>
                  <tr>
                    <th className="w-12">#</th>
                    <th>WALLET</th>
                    <th className="text-right">VOLUME</th>
                    <th className="text-right">TRADES</th>
                    <th className="text-right">P&L</th>
                    <th className="text-right">WIN %</th>
                  </tr>
                </thead>
                <tbody>
                  {topTraders.map((trader, index) => {
                    const rank = index + 1;
                    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                    
                    return (
                      <tr key={trader.wallet} className={rank <= 3 ? 'bg-muted/50' : ''}>
                        <td className="font-bold">{medal || rank}</td>
                        <td className="font-mono">{trader.wallet}</td>
                        <td className="text-right tabular-nums">{formatNumber(trader.volume)}</td>
                        <td className="text-right tabular-nums">{trader.trades}</td>
                        <td className={`text-right tabular-nums font-bold ${trader.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {trader.pnl >= 0 ? '+' : ''}{formatNumber(trader.pnl)}
                        </td>
                        <td className="text-right tabular-nums">
                          <span className={trader.winRate >= 60 ? 'text-green-500' : trader.winRate >= 50 ? 'text-yellow-500' : 'text-red-500'}>
                            {trader.winRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Top Gainers Tab */}
          <TabsContent value="gainers" className="mt-0">
            <AsciiDivider pattern="block" text="TOP GAINERS" />
            
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[500px]">
                <thead>
                  <tr>
                    <th className="w-12">#</th>
                    <th>TOKEN</th>
                    <th className="text-right">PRICE</th>
                    <th className="text-right">24H CHANGE</th>
                    <th className="text-right">VOLUME</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8">
                        <div className="text-muted-foreground">No tokens yet</div>
                      </td>
                    </tr>
                  ) : (
                    tokens.map((token, index) => {
                      const change = (Math.random() - 0.2) * 100; // Simulated
                      const rank = index + 1;
                      
                      return (
                        <tr key={token.id} className={rank <= 3 ? 'bg-muted/50' : ''}>
                          <td className="font-bold">
                            {rank === 1 ? '🚀' : rank === 2 ? '📈' : rank === 3 ? '💹' : rank}
                          </td>
                          <td>
                            <span className="font-bold">${token.symbol}</span>
                            <span className="text-muted-foreground ml-2 text-xs">{token.name}</span>
                          </td>
                          <td className="text-right tabular-nums">${Number(token.price).toFixed(6)}</td>
                          <td className={`text-right tabular-nums font-bold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                          </td>
                          <td className="text-right tabular-nums">{formatNumber(Number(token.volume_24h))}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Load More */}
        <div className="border-t border-border p-3 text-center">
          <Button variant="outline" className="h-8 px-6 data-sm">
            LOAD MORE
          </Button>
        </div>

        {/* Footer ASCII */}
        <div className="p-3 text-center">
          <div className="data-sm text-muted-foreground opacity-50">
            ════════════════════════════════════════════════════════════════
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
