import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import TerminalCard from "@/components/TerminalCard";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

type Wallet = Tables<"wallets">;

const Leaderboard = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [totalDistributed, setTotalDistributed] = useState(0);
  const [avgReward, setAvgReward] = useState(0);

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
      
      <main className="container mx-auto px-4 py-8 max-w-screen-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-tight mb-2">Lucky Wallet Leaderboard</h1>
          <p className="text-xs uppercase tracking-widest opacity-70">Ranked by Rewards Received</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <TerminalCard title="TOTAL DISTRIBUTED 7D">
            <div className="text-4xl font-bold font-mono">{totalDistributed.toFixed(2)} SOL</div>
          </TerminalCard>
          <TerminalCard title="LUCKY WALLETS COUNT">
            <div className="text-4xl font-bold font-mono">{wallets.length}</div>
          </TerminalCard>
          <TerminalCard title="AVG REWARD">
            <div className="text-4xl font-bold font-mono">{avgReward.toFixed(2)} SOL</div>
          </TerminalCard>
        </div>

        <TerminalCard>
          <div className="mb-4 flex gap-2">
            <Button className="border-2 border-black font-mono text-xs">24H</Button>
            <Button variant="outline" className="border-2 border-black font-mono text-xs">7D</Button>
            <Button variant="outline" className="border-2 border-black font-mono text-xs">ALL TIME</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-3 px-2 uppercase tracking-widest font-bold">Rank</th>
                  <th className="text-left py-3 px-2 uppercase tracking-widest font-bold">Wallet Address</th>
                  <th className="text-right py-3 px-2 uppercase tracking-widest font-bold">Rewards (SOL)</th>
                  <th className="text-right py-3 px-2 uppercase tracking-widest font-bold">Count</th>
                  <th className="text-center py-3 px-2 uppercase tracking-widest font-bold">View</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((wallet, index) => {
                  const rank = index + 1;
                  const share = totalDistributed > 0 ? (Number(wallet.total_rewards) / totalDistributed * 100) : 0;
                  
                  return (
                    <tr 
                      key={wallet.id} 
                      className={`border-b border-dashed border-black hover:bg-secondary transition-colors ${rank <= 3 ? 'bg-muted' : ''}`}
                    >
                      <td className="py-3 px-2 font-bold">
                        {rank <= 3 ? `#${rank}` : `#${rank}`}
                      </td>
                      <td className="py-3 px-2 font-mono">{wallet.address}</td>
                      <td className="py-3 px-2 text-right font-bold">{Number(wallet.total_rewards).toFixed(2)}</td>
                      <td className="py-3 px-2 text-right">{wallet.reward_count}</td>
                      <td className="py-3 px-2 text-center">
                        <a 
                          href={`https://solscan.io/account/${wallet.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:opacity-70 transition-opacity text-xs border border-border px-2 py-1"
                        >
                          SOLSCAN
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-center font-mono text-xs">
            <Button variant="outline" className="border-2 border-black font-mono text-xs">
              LOAD MORE
            </Button>
          </div>
        </TerminalCard>
      </main>
    </div>
  );
};

export default Leaderboard;
