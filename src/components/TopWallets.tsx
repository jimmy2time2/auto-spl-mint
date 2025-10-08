import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "./ui/avatar";

interface WalletStats {
  wallet_address: string;
  total_trades: number;
  total_fees: number;
  rank: number;
}

export function TopWallets() {
  const [wallets, setWallets] = useState<WalletStats[]>([]);

  useEffect(() => {
    fetchTopWallets();
  }, []);

  const fetchTopWallets = async () => {
    const { data: tradeData } = await supabase
      .from("wallet_activity_log")
      .select("wallet_address");

    const { data: feeData } = await supabase
      .from("trade_fees_log")
      .select("trader_address, creator_fee, system_fee");

    if (tradeData && feeData) {
      const walletMap = new Map<string, { trades: number; fees: number }>();

      tradeData.forEach((item) => {
        const current = walletMap.get(item.wallet_address) || { trades: 0, fees: 0 };
        walletMap.set(item.wallet_address, { ...current, trades: current.trades + 1 });
      });

      feeData.forEach((item) => {
        const current = walletMap.get(item.trader_address) || { trades: 0, fees: 0 };
        const totalFee = Number(item.creator_fee) + Number(item.system_fee);
        walletMap.set(item.trader_address, { ...current, fees: current.fees + totalFee });
      });

      const sorted = Array.from(walletMap.entries())
        .map(([address, stats]) => ({
          wallet_address: address,
          total_trades: stats.trades,
          total_fees: stats.fees,
          rank: 0,
        }))
        .sort((a, b) => b.total_fees - a.total_fees)
        .slice(0, 10)
        .map((item, index) => ({ ...item, rank: index + 1 }));

      setWallets(sorted);
    }
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getInitials = (addr: string) => {
    return addr.slice(2, 4).toUpperCase();
  };

  return (
    <div className="border-2 border-border p-6">
      <h2 className="text-xs font-bold uppercase tracking-widest border-b-2 border-border pb-2 mb-4">
        🏆 TOP WALLETS
      </h2>
      <div className="space-y-2">
        {wallets.map((wallet) => (
          <div key={wallet.wallet_address} className="flex items-center gap-3 p-3 border border-border">
            <div className="text-lg font-bold w-8 text-center">{wallet.rank}</div>
            <Avatar className="h-8 w-8 border-2 border-border">
              <AvatarFallback className="text-xs font-mono bg-muted">
                {getInitials(wallet.wallet_address)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-mono font-bold">{shortenAddress(wallet.wallet_address)}</p>
              <p className="text-xs text-muted-foreground">{wallet.total_trades} trades</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-bold">{wallet.total_fees.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">SOL fees</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
