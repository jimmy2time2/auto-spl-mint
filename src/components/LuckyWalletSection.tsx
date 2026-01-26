import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
          .limit(4),
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

    const channel = supabase
      .channel("lucky_wallet_updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "lucky_wallet_selections"
        },
        () => fetchLuckyWallets()
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

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const handleShareTwitter = () => {
    const text = "Join @M9_Protocol - an autonomous AI that creates and trades tokens on Solana. Get lucky and win rewards!";
    const url = window.location.origin;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  if (loading) {
    return (
      <section className="border-b-2 border-primary">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
          <div className="lg:col-span-3 lg:border-r border-primary/30 p-4">
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="p-4">
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b-2 border-primary">
      <div className="grid grid-cols-1 lg:grid-cols-4">
        {/* Latest Winner + Recent */}
        <div className="lg:col-span-3 lg:border-r border-primary/30">
          <div className="flex items-center border-b border-primary/30">
            <div className="px-4 py-3 border-r border-primary/30">
              <span className="data-sm text-muted-foreground">LUCKY WALLET</span>
            </div>
            {latestWinner && (
              <>
                <div className="px-4 py-3 border-r border-primary/30">
                  <span className="data-sm text-muted-foreground mr-2">WINNER</span>
                  <span className="data-sm font-mono glow-text">
                    {formatAddress(latestWinner.wallet_address)}
                  </span>
                </div>
                <div className="px-4 py-3 border-r border-primary/30">
                  <span className="data-sm text-muted-foreground mr-2">REWARD</span>
                  <span className="data-sm tabular-nums">
                    {Number(latestWinner.distribution_amount).toLocaleString()}
                  </span>
                </div>
                <div className="px-4 py-3 hidden sm:block">
                  <span className="data-sm text-muted-foreground">
                    {formatTimestamp(latestWinner.selection_timestamp)}
                  </span>
                </div>
              </>
            )}
            {!latestWinner && (
              <div className="px-4 py-3">
                <span className="data-sm text-muted-foreground">NO WINNERS YET</span>
              </div>
            )}
          </div>

          {/* Recent Winners Row */}
          {recentWinners.length > 1 && (
            <div className="flex items-center divide-x divide-primary/20 overflow-x-auto">
              <div className="px-4 py-2 shrink-0">
                <span className="text-xs text-muted-foreground">RECENT</span>
              </div>
              {recentWinners.slice(1).map((winner) => (
                <div key={winner.id} className="px-4 py-2 shrink-0">
                  <span className="text-xs font-mono text-muted-foreground">
                    {formatAddress(winner.wallet_address)}
                  </span>
                  <span className="text-xs text-primary ml-2">
                    +{Number(winner.distribution_amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats + Share */}
        <div className="border-t lg:border-t-0 border-primary/30">
          <div className="grid grid-cols-2 lg:grid-cols-1">
            <div className="p-4 border-r lg:border-r-0 border-b border-primary/30">
              <p className="text-xs text-muted-foreground mb-1">DISTRIBUTED</p>
              <p className="data-md tabular-nums">{totalDistributed.toLocaleString()}</p>
            </div>
            <div className="p-4 border-b border-primary/30">
              <p className="text-xs text-muted-foreground mb-1">WINNERS</p>
              <p className="data-md tabular-nums">{totalWinners}</p>
            </div>
          </div>
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-2">SHARE FOR +10 ENTRIES</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs"
              onClick={handleShareTwitter}
            >
              SHARE ON X →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LuckyWalletSection;
