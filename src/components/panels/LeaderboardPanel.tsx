import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type Wallet = Tables<"wallets">;
type Token = Tables<"tokens">;

const LeaderboardPanel = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [totalDistributed, setTotalDistributed] = useState(0);
  const [activeTab, setActiveTab] = useState('lucky');

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

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 border-b border-primary/30">
        <div className="border-r border-primary/30 p-3 text-center">
          <div className="data-sm tabular-nums glow-text">{totalDistributed.toFixed(2)}</div>
          <div className="text-[10px] text-muted-foreground">SOL DISTRIBUTED</div>
        </div>
        <div className="p-3 text-center">
          <div className="data-sm tabular-nums">{wallets.length}</div>
          <div className="text-[10px] text-muted-foreground">LUCKY WALLETS</div>
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
            value="volume" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-[10px]"
          >
            → TOP VOLUME
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
                    <span className="data-sm text-primary tabular-nums">+{Number(wallet.total_rewards).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Top Volume Tokens Tab */}
        <TabsContent value="volume" className="mt-0 max-h-[250px] overflow-y-auto">
          {tokens.length === 0 ? (
            <div className="p-6 text-center text-[10px] text-muted-foreground">No tokens yet</div>
          ) : (
            <div className="divide-y divide-primary/30">
              {tokens.map((token, index) => {
                const rank = index + 1;
                
                return (
                  <Link
                    key={token.id}
                    to={`/token/${token.id}`}
                    className="flex items-center justify-between p-3 hover:bg-primary/10 transition-colors block"
                  >
                    <div className="flex items-center gap-2">
                      <span className="data-sm w-6">{rank === 1 ? '●' : rank === 2 ? '◐' : rank === 3 ? '○' : rank}</span>
                      <span className="data-sm font-bold">${token.symbol}</span>
                    </div>
                    <div className="text-right">
                      <span className="data-sm tabular-nums">
                        {Number(token.volume_24h) >= 1000
                          ? `$${(Number(token.volume_24h) / 1000).toFixed(1)}K`
                          : `$${Number(token.volume_24h).toFixed(0)}`
                        }
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-2">VOL</span>
                    </div>
                  </Link>
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