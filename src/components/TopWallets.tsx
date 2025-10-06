import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Clock, Award } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface WalletStats {
  wallet_address: string;
  total_trades: number;
  total_fees: number;
  first_trade: string;
  rank: number;
}

export const TopWallets = () => {
  const [topTraders, setTopTraders] = useState<WalletStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopWallets();

    // Real-time updates
    const channel = supabase
      .channel('wallet-activity')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'wallet_activity_log'
      }, () => {
        fetchTopWallets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTopWallets = async () => {
    try {
      // Aggregate wallet activity
      const { data: activity } = await supabase
        .from('wallet_activity_log')
        .select('wallet_address, amount, timestamp')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (activity) {
        // Group by wallet and calculate stats
        const walletMap = new Map<string, WalletStats>();

        activity.forEach(a => {
          const existing = walletMap.get(a.wallet_address);
          if (existing) {
            existing.total_trades += 1;
            existing.total_fees += Number(a.amount || 0) * 0.02; // 2% fees
            existing.first_trade = a.timestamp < existing.first_trade ? a.timestamp : existing.first_trade;
          } else {
            walletMap.set(a.wallet_address, {
              wallet_address: a.wallet_address,
              total_trades: 1,
              total_fees: Number(a.amount || 0) * 0.02,
              first_trade: a.timestamp,
              rank: 0
            });
          }
        });

        // Sort and rank
        const sorted = Array.from(walletMap.values())
          .sort((a, b) => b.total_trades - a.total_trades)
          .slice(0, 10)
          .map((w, idx) => ({ ...w, rank: idx + 1 }));

        setTopTraders(sorted);
      }
    } finally {
      setLoading(false);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const getHoldingTime = (firstTrade: string) => {
    const days = Math.floor((Date.now() - new Date(firstTrade).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "1 day";
    return `${days} days`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-primary" />;
      case 2:
        return <Award className="w-6 h-6 text-secondary" />;
      case 3:
        return <Award className="w-6 h-6 text-accent" />;
      default:
        return <span className="w-6 text-center text-muted-foreground font-orbitron">{rank}</span>;
    }
  };

  return (
    <Card className="p-6 bg-card border-2 border-border">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-8 h-8 text-primary" />
        <h2 className="text-3xl font-orbitron text-primary text-glow">
          TOP TRADERS
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground font-mono">
          Loading leaderboard...
        </div>
      ) : topTraders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground font-mono">
          No trades yet. Be the first!
        </div>
      ) : (
        <div className="space-y-2">
          {topTraders.map((wallet, idx) => (
            <motion.div
              key={wallet.wallet_address}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-center gap-4 p-4 border ${
                idx === 0
                  ? 'border-primary bg-primary/10'
                  : idx === 1
                  ? 'border-secondary bg-secondary/5'
                  : 'border-border bg-card/30'
              }`}
            >
              {/* Rank */}
              <div className="flex-shrink-0">
                {getRankIcon(wallet.rank)}
              </div>

              {/* Wallet Address */}
              <div className="flex-1 min-w-0">
                <div className="font-mono text-base text-foreground truncate">
                  {shortenAddress(wallet.wallet_address)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  <span>Holder for {getHoldingTime(wallet.first_trade)}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-shrink-0 text-right">
                <div className="font-orbitron text-lg text-foreground">
                  {wallet.total_trades}
                </div>
                <div className="text-xs text-muted-foreground">trades</div>
              </div>

              <div className="flex-shrink-0 text-right">
                <div className="font-mono text-lg text-secondary">
                  ${formatAmount(wallet.total_fees)}
                </div>
                <div className="text-xs text-muted-foreground">fees gen.</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground font-mono">
          💎 Rankings update in real-time
        </p>
      </div>
    </Card>
  );
};
