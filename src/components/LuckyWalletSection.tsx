import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useReferralTracking } from "@/hooks/useReferralTracking";
import type { Tables } from "@/integrations/supabase/types";

type LuckyWalletSelection = Tables<"lucky_wallet_selections">;
type Token = Tables<"tokens">;

interface LuckyWalletWithToken extends LuckyWalletSelection {
  tokens?: Pick<Token, "symbol" | "name"> | null;
}

const LuckyWalletSection = () => {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const walletAddress = publicKey?.toBase58() || null;
  
  const { stats, referralCode, loading: referralLoading, shareOnTwitter, getShareUrl } = useReferralTracking(walletAddress);
  
  const [latestWinner, setLatestWinner] = useState<LuckyWalletWithToken | null>(null);
  const [recentWinners, setRecentWinners] = useState<LuckyWalletWithToken[]>([]);
  const [totalDistributed, setTotalDistributed] = useState(0);
  const [totalWinners, setTotalWinners] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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

  const handleShare = () => {
    if (!connected) {
      setVisible(true);
      return;
    }
    shareOnTwitter();
  };

  const copyReferralLink = async () => {
    if (!referralCode) return;
    const url = getShareUrl();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center border-b border-primary/30 px-4 py-3">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="border-t border-primary/30 grid grid-cols-2">
          <div className="p-3 border-r border-primary/30">
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="p-3">
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header - matches TokenDistributionInfo */}
      <div className="flex items-center border-b border-primary/30 overflow-x-auto">
        <div className="px-4 py-3 border-r border-primary/30 shrink-0">
          <span className="data-sm text-muted-foreground">LUCKY WALLET</span>
        </div>
        {latestWinner ? (
          <>
            <div className="px-4 py-3 border-r border-primary/30 shrink-0">
              <span className="data-sm font-mono glow-text">
                {formatAddress(latestWinner.wallet_address)}
              </span>
            </div>
            <div className="px-4 py-3 shrink-0">
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(latestWinner.selection_timestamp)}
              </span>
            </div>
          </>
        ) : (
          <div className="px-4 py-3 shrink-0">
            <span className="text-xs text-muted-foreground">NO WINNERS YET</span>
          </div>
        )}
      </div>

      {/* Content area - recent winners */}
      <div className="flex-1 p-4">
        {recentWinners.length > 0 ? (
          <div className="space-y-2">
            {recentWinners.map((winner) => (
              <div key={winner.id} className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground w-24 truncate">
                  {formatAddress(winner.wallet_address)}
                </span>
                <div className="flex-1 h-1.5 bg-muted/30 relative overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-primary/60"
                    style={{ width: `${Math.min(100, (Number(winner.distribution_amount) / 1000) * 100)}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums glow-text w-16 text-right">
                  +{Number(winner.distribution_amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No recent winners</p>
        )}
      </div>

      {/* Footer stats - matches TokenDistributionInfo structure */}
      <div className="border-t border-primary/30">
        <div className="grid grid-cols-2">
          <div className="p-3 border-r border-primary/30">
            <p className="text-xs text-muted-foreground mb-1">
              {connected ? 'YOUR ENTRIES' : 'DISTRIBUTED'}
            </p>
            <p className="data-sm tabular-nums glow-text">
              {connected && stats ? stats.bonus_entries : totalDistributed.toLocaleString()}
            </p>
          </div>
          <div className="p-3">
            {connected && referralCode ? (
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">REF:</span>
                  <span className="text-xs font-mono">{referralCode}</span>
                  <button 
                    onClick={copyReferralLink}
                    className="text-xs text-primary hover:underline ml-auto"
                  >
                    {copied ? 'COPIED' : 'COPY'}
                  </button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs h-6"
                  onClick={handleShare}
                >
                  SHARE → +10
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground mb-1">
                  {connected ? 'LOADING...' : 'TOTAL WINNERS'}
                </p>
                <p className="data-sm tabular-nums">
                  {connected ? '—' : totalWinners}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LuckyWalletSection;
