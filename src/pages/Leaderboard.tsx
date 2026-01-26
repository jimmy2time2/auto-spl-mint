import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

type Wallet = Tables<"wallets">;

const Leaderboard = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [totalDistributed, setTotalDistributed] = useState(0);
  const [avgReward, setAvgReward] = useState(0);
  const [timeFilter, setTimeFilter] = useState('7d');

  useEffect(() => {
    const fetchWallets = async () => {
      const { data } = await supabase
        .from("wallets")
        .select("*")
        .eq("type", "public_lucky")
        .order("total_rewards", { ascending: false });

      if (data) {
        setWallets(data);
        const total = data.reduce((sum, w) => sum + Number(w.total_rewards), 0);
        setTotalDistributed(total);
        setAvgReward(data.length > 0 ? total / data.length : 0);
      }
    };
    fetchWallets();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b border-border px-4 py-3 bg-muted">
          <div className="data-sm">LUCKY WALLET LEADERBOARD</div>
          <div className="text-xs text-muted-foreground">Ranked by rewards received</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 border-b border-border">
          <div className="border-r border-border p-4 text-center">
            <div className="data-lg tabular-nums">{totalDistributed.toFixed(2)}</div>
            <div className="data-sm text-muted-foreground">TOTAL SOL</div>
          </div>
          <div className="border-r border-border p-4 text-center">
            <div className="data-lg tabular-nums">{wallets.length}</div>
            <div className="data-sm text-muted-foreground">WALLETS</div>
          </div>
          <div className="p-4 text-center">
            <div className="data-lg tabular-nums">{avgReward.toFixed(2)}</div>
            <div className="data-sm text-muted-foreground">AVG SOL</div>
          </div>
        </div>

        {/* Filter */}
        <div className="border-b border-border p-3 flex gap-1">
          <Button 
            variant={timeFilter === '24h' ? 'default' : 'outline'} 
            onClick={() => setTimeFilter('24h')}
            className="h-8 px-3 data-sm"
          >
            24H
          </Button>
          <Button 
            variant={timeFilter === '7d' ? 'default' : 'outline'} 
            onClick={() => setTimeFilter('7d')}
            className="h-8 px-3 data-sm"
          >
            7D
          </Button>
          <Button 
            variant={timeFilter === 'all' ? 'default' : 'outline'} 
            onClick={() => setTimeFilter('all')}
            className="h-8 px-3 data-sm"
          >
            ALL
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[500px]">
            <thead>
              <tr>
                <th>#</th>
                <th>WALLET</th>
                <th className="text-right">REWARDS</th>
                <th className="text-right hidden sm:table-cell">COUNT</th>
                <th className="text-center">VIEW</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((wallet, index) => {
                const rank = index + 1;
                
                return (
                  <tr key={wallet.id} className={rank <= 3 ? 'bg-muted' : ''}>
                    <td className="font-bold">{rank}</td>
                    <td className="font-mono truncate max-w-[200px]">{wallet.address}</td>
                    <td className="text-right tabular-nums font-bold">
                      {Number(wallet.total_rewards).toFixed(2)} SOL
                    </td>
                    <td className="text-right tabular-nums hidden sm:table-cell">
                      {wallet.reward_count}
                    </td>
                    <td className="text-center">
                      <a 
                        href={`https://solscan.io/account/${wallet.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="data-sm hover:underline"
                      >
                        SOLSCAN →
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Load More */}
        <div className="border-t border-border p-3 text-center">
          <Button variant="outline" className="h-8 px-6 data-sm">
            LOAD MORE
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
