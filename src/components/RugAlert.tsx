import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

interface Alert {
  id: string;
  token_symbol: string;
  wallet: string;
  amount: number;
  percentage: number;
  timestamp: string;
}

export function RugAlert() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const channel = supabase
      .channel("whale-dumps")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wallet_activity_log",
          filter: "is_whale_flagged=eq.true",
        },
        (payload: any) => {
          const newAlert: Alert = {
            id: payload.new.id,
            token_symbol: "TOKEN",
            wallet: payload.new.wallet_address,
            amount: payload.new.amount,
            percentage: payload.new.percentage_of_supply,
            timestamp: payload.new.timestamp,
          };
          
          setAlerts((prev) => [newAlert, ...prev].slice(0, 5));
          setVisible(true);

          // Play alert sound (optional)
          try {
            const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77RnHwU7k9v0yX0p");
            audio.play();
          } catch (e) {
            // Ignore audio errors
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!visible || alerts.length === 0) return null;

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="fixed top-20 left-0 right-0 z-50 animate-in slide-in-from-top">
      <div className="container mx-auto px-4">
        <div className="bg-destructive text-destructive-foreground border-2 border-border p-4 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                🚨 WHALE DUMP ALERT
              </h3>
              {alerts.slice(0, 1).map((alert) => (
                <div key={alert.id} className="space-y-1">
                  <p className="font-mono font-bold">
                    {shortenAddress(alert.wallet)} dumped {alert.percentage.toFixed(1)}% of supply
                  </p>
                  <p className="text-xs opacity-80">
                    Amount: {alert.amount.toLocaleString()} tokens
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setVisible(false)}
              className="p-1 hover:bg-background/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
