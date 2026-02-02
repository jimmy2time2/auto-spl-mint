import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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

const LeaderboardPanel = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [totalDistributed, setTotalDistributed] = useState(0);
  const [activeTab, setActiveTab] = useState('lucky');

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
          .order("total_rewards", { ascending: false })
          .limit(5),
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
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-3 border-b border-primary/30">
        <div className="border-r border-primary/30 p-3 text-center">
          <div className="data-sm tabular-nums glow-text">{totalDistributed.toFixed(2)}</div>
          <div className="text-[10px] text-muted-foreground">SOL DIST</div>
        </div>
        <div className="border-r border-primary/30 p-3 text-center">
          <div className="data-sm tabular-nums">{wallets.length}</div>
          <div className="text-[10px] text-muted-foreground">LUCKY</div>
        </div>
        <div className="p-3 text-center">
          <div className="data-sm tabular-nums">{topTraders.reduce((s, t) => s + t.trades, 0)}</div>
          <div className="text-[10px] text-muted-foreground">TRADES</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-primary/30 bg-transparent p-0">
          <TabsTrigger 
            value="lucky" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-[10px]"
          >
            ○ LUCKY
          </TabsTrigger>
          <TabsTrigger 
            value="traders" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-[10px]"
          >
            ◑ TRADERS
          </TabsTrigger>
          <TabsTrigger 
            value="gainers" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-[10px]"
          >
            → GAINERS
          </TabsTrigger>
        </TabsList>

        {/* Lucky Wallets Tab */}
        <TabsContent value="lucky" className="mt-0 max-h-[250px] overflow-y-auto">
          {wallets.length === 0 ? (
            <div className="p-6 text-center text-[10px] text-muted-foreground">No lucky wallets yet</div>
          ) : (
            <div className="divide-y divide-primary/30">
              {wallets.map((wallet, index) => {
                const rank = index + 1;
                const medal = rank === 1 ? '●' : rank === 2 ? '◐' : rank === 3 ? '○' : '';
                
                return (
                  <div key={wallet.id} className={`flex items-center justify-between p-3 ${rank <= 3 ? 'bg-muted/50' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="data-sm w-6">{medal || rank}</span>
                      <span className="font-mono text-[10px] truncate max-w-[100px]">{wallet.address}</span>
                    </div>
                    <span className="data-sm text-green-500 tabular-nums">+{Number(wallet.total_rewards).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Top Traders Tab */}
        <TabsContent value="traders" className="mt-0 max-h-[250px] overflow-y-auto">
          <div className="divide-y divide-primary/30">
            {topTraders.map((trader, index) => {
              const rank = index + 1;
              const medal = rank === 1 ? '●' : rank === 2 ? '◐' : rank === 3 ? '○' : '';
              
              return (
                <div key={trader.wallet} className={`flex items-center justify-between p-3 ${rank <= 3 ? 'bg-muted/50' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className="data-sm w-6">{medal || rank}</span>
                    <span className="font-mono text-[10px]">{trader.wallet}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`data-sm tabular-nums ${trader.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatNumber(trader.pnl)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{trader.winRate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Top Gainers Tab */}
        <TabsContent value="gainers" className="mt-0 max-h-[250px] overflow-y-auto">
          {tokens.length === 0 ? (
            <div className="p-6 text-center text-[10px] text-muted-foreground">No tokens yet</div>
          ) : (
            <div className="divide-y divide-primary/30">
              {tokens.map((token, index) => {
                const change = (Math.random() - 0.2) * 100;
                const rank = index + 1;
                
                return (
                  <div key={token.id} className={`flex items-center justify-between p-3 ${rank <= 3 ? 'bg-muted/50' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="data-sm w-6">{rank === 1 ? '●' : rank === 2 ? '◐' : rank === 3 ? '○' : rank}</span>
                      <span className="data-sm font-bold">${token.symbol}</span>
                    </div>
                    <span className={`data-sm tabular-nums ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeaderboardPanel;
