import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, Trophy, Sparkles, Users, TrendingUp } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type LuckyWalletSelection = Tables<"lucky_wallet_selections">;
type Token = Tables<"tokens">;

interface LuckyWalletWithToken extends LuckyWalletSelection {
  tokens?: Pick<Token, "symbol" | "name"> | null;
}

const LuckyWalletSection = () => {
  const [latestWinner, setLatestWinner] = useState<LuckyWalletWithToken | null>(null);
  const [recentWinners, setRecentWinners] = useState<LuckyWalletWithToken[]>([]);
  const [totalDistributed, setTotalDistributed] = useState(0);
  const [totalWinners, setTotalWinners] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLuckyWallets = async () => {
      setLoading(true);

      const [latestRes, recentRes, statsRes] = await Promise.all([
        supabase
          .from("lucky_wallet_selections")
          .select("*, tokens(symbol, name)")
          .order("selection_timestamp", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("lucky_wallet_selections")
          .select("*, tokens(symbol, name)")
          .order("selection_timestamp", { ascending: false })
          .limit(5),
        supabase
          .from("lucky_wallet_selections")
          .select("distribution_amount", { count: "exact" })
      ]);

      if (latestRes.data) {
        setLatestWinner(latestRes.data as LuckyWalletWithToken);
      }

      if (recentRes.data) {
        setRecentWinners(recentRes.data as LuckyWalletWithToken[]);
      }

      if (statsRes.data && statsRes.count !== null) {
        const total = statsRes.data.reduce(
          (sum, s) => sum + Number(s.distribution_amount || 0),
          0
        );
        setTotalDistributed(total);
        setTotalWinners(statsRes.count);
      }

      setLoading(false);
    };

    fetchLuckyWallets();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("lucky_wallet_updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "lucky_wallet_selections"
        },
        (payload) => {
          fetchLuckyWallets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="border-b-2 border-primary">
        <div className="border-b border-primary/30 px-6 py-4 flex items-center gap-3">
          <Gift className="h-4 w-4 text-primary" />
          <h2 className="data-sm">LUCKY WALLET REWARDS</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 lg:border-r-2 border-primary p-6">
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="p-6">
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="border-b-2 border-primary">
      <div className="border-b border-primary/30 px-6 py-4 flex items-center gap-3">
        <Gift className="h-4 w-4 text-primary" />
        <h2 className="data-sm">LUCKY WALLET REWARDS</h2>
        <span className="ml-auto status-live" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Latest Winner Spotlight */}
        <div className="lg:col-span-2 lg:border-r-2 border-primary">
          <div className="p-6 sm:p-8">
            {latestWinner ? (
              <div className="relative">
                {/* Winner Badge */}
                <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground px-3 py-1 data-sm flex items-center gap-2">
                  <Trophy className="h-3 w-3" />
                  LATEST WINNER
                </div>

                <div className="border-2 border-primary glow-border p-6 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="data-sm text-muted-foreground mb-2">
                        WALLET ADDRESS
                      </p>
                      <p className="display-lg glow-text break-all font-mono">
                        {formatAddress(latestWinner.wallet_address)}
                      </p>
                    </div>
                    <div>
                      <p className="data-sm text-muted-foreground mb-2">
                        REWARD AMOUNT
                      </p>
                      <p className="display-lg glow-text tabular-nums">
                        {Number(latestWinner.distribution_amount).toLocaleString()}{" "}
                        <span className="data-sm text-muted-foreground">
                          {latestWinner.tokens?.symbol || "TOKENS"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-primary/30">
                    <div>
                      <p className="data-sm text-muted-foreground mb-1">TOKEN</p>
                      <p className="data-md">
                        {latestWinner.tokens?.symbol || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="data-sm text-muted-foreground mb-1">
                        ACTIVITY SCORE
                      </p>
                      <p className="data-md tabular-nums">
                        {Number(latestWinner.activity_score).toFixed(0)}
                      </p>
                    </div>
                    <div>
                      <p className="data-sm text-muted-foreground mb-1">WHEN</p>
                      <p className="data-md">
                        {formatTimestamp(latestWinner.selection_timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-primary/30 p-8 text-center">
                <Sparkles className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="display-lg mb-2">NO WINNERS YET</p>
                <p className="text-sm text-muted-foreground">
                  Be active in trading to become the next lucky wallet!
                </p>
              </div>
            )}
          </div>

          {/* Recent Winners List */}
          {recentWinners.length > 1 && (
            <div className="border-t border-primary/30">
              <div className="px-6 py-3 border-b border-primary/30">
                <p className="data-sm text-muted-foreground">RECENT WINNERS</p>
              </div>
              <div className="divide-y divide-primary/20">
                {recentWinners.slice(1, 5).map((winner) => (
                  <div
                    key={winner.id}
                    className="px-6 py-3 flex items-center justify-between hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Gift className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="data-sm font-mono">
                          {formatAddress(winner.wallet_address)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {winner.tokens?.symbol || "Token"} ·{" "}
                          {formatTimestamp(winner.selection_timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="data-sm glow-text tabular-nums">
                        +{Number(winner.distribution_amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats & Info Panel */}
        <div className="border-t-2 lg:border-t-0 border-primary">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-1 border-b border-primary/30">
            <div className="border-r lg:border-r-0 border-primary/30 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <p className="data-sm text-muted-foreground">TOTAL DISTRIBUTED</p>
              </div>
              <p className="display-lg glow-text tabular-nums">
                {totalDistributed.toLocaleString()}
              </p>
            </div>
            <div className="p-4 sm:p-5 border-b lg:border-b-0 border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-3 w-3 text-muted-foreground" />
                <p className="data-sm text-muted-foreground">TOTAL WINNERS</p>
              </div>
              <p className="display-lg tabular-nums">{totalWinners}</p>
            </div>
          </div>

          {/* How to Win */}
          <div className="p-6">
            <h3 className="data-sm mb-4 flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              HOW TO GET LUCKY
            </h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <span className="data-sm text-primary">01</span>
                <p>Trade actively on the platform</p>
              </div>
              <div className="flex gap-3">
                <span className="data-sm text-primary">02</span>
                <p>Avoid whale behavior (&gt;10% supply)</p>
              </div>
              <div className="flex gap-3">
                <span className="data-sm text-primary">03</span>
                <p>No pump &amp; dump patterns</p>
              </div>
              <div className="flex gap-3">
                <span className="data-sm text-primary">04</span>
                <p>AI randomly selects winners from eligible wallets</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-primary/5 border border-primary/20">
              <p className="data-sm text-primary mb-1">⚡ NEXT DISTRIBUTION</p>
              <p className="text-xs text-muted-foreground">
                Lucky wallets are selected during each profit distribution event
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LuckyWalletSection;
