import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Trophy, Users } from "lucide-react";

const InviteLeaderboard = () => {
  const { data: topInviters } = useQuery({
    queryKey: ["invite-leaderboard"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("invite_log")
        .select("inviter_wallet, inviter_score")
        .order("inviter_score", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Group by wallet and sum scores
      const grouped = data.reduce((acc: any, curr: any) => {
        if (!acc[curr.inviter_wallet]) {
          acc[curr.inviter_wallet] = 0;
        }
        acc[curr.inviter_wallet] += curr.inviter_score;
        return acc;
      }, {});

      return Object.entries(grouped)
        .map(([wallet, score]) => ({ wallet, score }))
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 10);
    },
  });

  return (
    <Card className="p-6">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        Invite Leaderboard
      </h3>

      <div className="space-y-3">
        {topInviters?.map((inviter: any, index: number) => (
          <div
            key={inviter.wallet}
            className="flex items-center justify-between p-3 rounded-lg bg-muted"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0
                    ? "bg-yellow-500 text-black"
                    : index === 1
                    ? "bg-gray-400 text-black"
                    : index === 2
                    ? "bg-orange-600 text-white"
                    : "bg-muted-foreground/20"
                }`}
              >
                {index + 1}
              </div>
              <div>
                <p className="font-mono text-sm">
                  {inviter.wallet.slice(0, 6)}...{inviter.wallet.slice(-4)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-bold">{inviter.score}</span>
            </div>
          </div>
        ))}

        {(!topInviters || topInviters.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No invites yet. Be the first!
          </p>
        )}
      </div>
    </Card>
  );
};

export default InviteLeaderboard;
