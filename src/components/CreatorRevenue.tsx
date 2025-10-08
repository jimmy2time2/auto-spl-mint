import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Bot, Target } from "lucide-react";
import { Card } from "./ui/card";
import { supabase } from "@/integrations/supabase/client";

interface RevenueStats {
  totalFromFees: number;
  totalFromAISales: number;
  currentTokenEarnings: number;
}

export const CreatorRevenue = () => {
  const [stats, setStats] = useState<RevenueStats>({
    totalFromFees: 0,
    totalFromAISales: 0,
    currentTokenEarnings: 0
  });

  useEffect(() => {
    fetchRevenue();

    // Real-time updates
    const channel = supabase
      .channel('creator-profits')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'creator_wallet_profits'
      }, () => {
        fetchRevenue();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRevenue = async () => {
    const { data: profits } = await supabase
      .from('creator_wallet_profits')
      .select('amount, profit_source');

    if (profits) {
      const fromFees = profits
        .filter(p => p.profit_source?.includes('fee'))
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const fromAI = profits
        .filter(p => p.profit_source === 'ai_profit_sale')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const fromMint = profits
        .filter(p => p.profit_source === 'mint_allocation')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      setStats({
        totalFromFees: fromFees,
        totalFromAISales: fromAI,
        currentTokenEarnings: fromMint
      });
    }
  };

  const formatCurrency = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const total = stats.totalFromFees + stats.totalFromAISales + stats.currentTokenEarnings;

  return (
    <Card className="p-6 bg-card border-2 border-primary">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="w-8 h-8 text-primary" />
        <h2 className="text-3xl font-orbitron text-primary text-glow">
          CREATOR REVENUE
        </h2>
      </div>

      {/* Total Earnings */}
      <div className="mb-8 p-6 bg-primary/10 border border-primary">
        <div className="text-sm text-muted-foreground mb-2">TOTAL EARNED</div>
        <div className="text-5xl font-orbitron text-primary text-glow">
          {formatCurrency(total)}
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid gap-4">
        <RevenueItem
          icon={<TrendingUp className="w-5 h-5" />}
          label="From Trading Fees"
          amount={stats.totalFromFees}
          color="primary"
        />
        
        <RevenueItem
          icon={<Bot className="w-5 h-5" />}
          label="From AI Sales"
          amount={stats.totalFromAISales}
          color="secondary"
        />
        
        <RevenueItem
          icon={<Target className="w-5 h-5" />}
          label="Current Token Earnings"
          amount={stats.currentTokenEarnings}
          color="accent"
        />
      </div>

      <div className="mt-6 p-4 bg-muted/20 border border-border">
        <p className="text-xs text-muted-foreground font-mono">
          💡 Revenue automatically distributed from:
          <br />
          • 1% trading fees on all buys/sells
          <br />
          • 2% of AI profit sales
          <br />
          • 5% of new token mints
        </p>
      </div>
    </Card>
  );
};

const RevenueItem = ({
  icon,
  label,
  amount,
  color
}: {
  icon: React.ReactNode;
  label: string;
  amount: number;
  color: string;
}) => {
  const formatCurrency = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="flex items-center justify-between p-4 border border-border bg-card/50">
      <div className="flex items-center gap-3">
        <div className={`text-${color}`}>{icon}</div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="text-xl font-mono text-foreground">
        {formatCurrency(amount)}
      </div>
    </div>
  );
};
