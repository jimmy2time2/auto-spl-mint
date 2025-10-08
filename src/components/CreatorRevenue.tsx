import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";

interface Revenue {
  total: number;
  ai_share: number;
  fees: number;
}

export function CreatorRevenue({ walletAddress }: { walletAddress?: string }) {
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (walletAddress) {
      fetchRevenue();
    } else {
      setLoading(false);
    }
  }, [walletAddress]);

  const fetchRevenue = async () => {
    if (!walletAddress) return;

    const { data } = await supabase
      .from("creator_wallet_profits")
      .select("amount, profit_source")
      .eq("creator_address", walletAddress);

    if (data) {
      const total = data.reduce((sum, item) => sum + Number(item.amount), 0);
      const ai_share = data
        .filter((item) => item.profit_source === "AI_PROFIT")
        .reduce((sum, item) => sum + Number(item.amount), 0);
      const fees = data
        .filter((item) => item.profit_source === "TRADING_FEE")
        .reduce((sum, item) => sum + Number(item.amount), 0);

      setRevenue({ total, ai_share, fees });
    }
    setLoading(false);
  };

  if (!walletAddress) {
    return (
      <div className="border-2 border-border p-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Connect your wallet to view creator revenue
        </p>
        <Button variant="outline">CONNECT WALLET</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border-2 border-border p-6">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted w-1/2"></div>
          <div className="h-8 bg-muted w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!revenue) return null;

  return (
    <div className="border-2 border-border p-6">
      <h2 className="text-xs font-bold uppercase tracking-widest border-b-2 border-border pb-2 mb-4">
        💼 YOUR REVENUE
      </h2>
      <div className="space-y-4">
        <div className="border-2 border-border p-4">
          <p className="text-xs text-muted-foreground">TOTAL EARNINGS</p>
          <p className="text-3xl font-bold font-mono">{revenue.total.toFixed(4)} SOL</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-border p-3">
            <p className="text-xs text-muted-foreground">AI PROFIT SHARE</p>
            <p className="text-lg font-mono font-bold">{revenue.ai_share.toFixed(4)}</p>
          </div>
          <div className="border border-border p-3">
            <p className="text-xs text-muted-foreground">TRADING FEES</p>
            <p className="text-lg font-mono font-bold">{revenue.fees.toFixed(4)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
