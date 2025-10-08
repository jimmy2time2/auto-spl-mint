import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

const TreasuryOverview = () => {
  const { data: treasury } = useQuery({
    queryKey: ["dao-treasury"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("dao_treasury")
        .select("*")
        .order("last_update", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as any;
    },
  });

  const { data: recentEvents } = useQuery({
    queryKey: ["treasury-events"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("dao_treasury")
        .select("*")
        .not("event_type", "is", null)
        .order("last_update", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as any[];
    },
  });

  return (
    <Card className="p-6">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <Wallet className="w-5 h-5" />
        DAO Treasury
      </h3>

      <div className="space-y-4">
        <div className="p-4 bg-primary/10 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
          <p className="text-2xl font-bold font-mono">
            {treasury?.balance?.toFixed(2) || "0.00"} SOL
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-1 text-green-500 mb-1">
              <TrendingUp className="w-3 h-3" />
              <p className="text-xs font-medium">Received</p>
            </div>
            <p className="font-bold font-mono text-sm">
              {treasury?.total_received?.toFixed(2) || "0.00"}
            </p>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-1 text-red-500 mb-1">
              <TrendingDown className="w-3 h-3" />
              <p className="text-xs font-medium">Distributed</p>
            </div>
            <p className="font-bold font-mono text-sm">
              {treasury?.total_distributed?.toFixed(2) || "0.00"}
            </p>
          </div>
        </div>

        {recentEvents && recentEvents.length > 0 && (
          <div>
            <h4 className="text-sm font-bold mb-2">Recent Activity</h4>
            <div className="space-y-2">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="text-xs p-2 bg-muted rounded flex justify-between items-start"
                >
                  <div className="flex-1">
                    <p className="font-medium">{event.event_type}</p>
                    {event.description && (
                      <p className="text-muted-foreground text-[10px] mt-1">
                        {event.description}
                      </p>
                    )}
                  </div>
                  {event.amount && (
                    <span className="font-mono font-bold">
                      {event.amount > 0 ? "+" : ""}
                      {event.amount.toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TreasuryOverview;
