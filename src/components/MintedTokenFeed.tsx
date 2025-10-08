import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Progress } from "./ui/progress";

interface Token {
  id: string;
  name: string;
  symbol: string;
  price: number;
  volume_24h: number;
  supply: number;
  launch_timestamp: string;
}

export function MintedTokenFeed() {
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    fetchTokens();

    const channel = supabase
      .channel("tokens-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tokens",
        },
        () => fetchTokens()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTokens = async () => {
    const { data } = await supabase
      .from("tokens")
      .select("*")
      .order("launch_timestamp", { ascending: false })
      .limit(10);

    if (data) setTokens(data);
  };

  const isNewToken = (launchTime: string) => {
    const hoursAgo = (new Date().getTime() - new Date(launchTime).getTime()) / (1000 * 60 * 60);
    return hoursAgo < 6;
  };

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-bold uppercase tracking-widest border-b-2 border-border pb-2">
        ⚡ LIVE FEED
      </h2>
      {tokens.map((token) => (
        <Link key={token.id} to={`/token/${token.id}`}>
          <div className="border-2 border-border p-4 hover:bg-muted transition-colors cursor-pointer">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{token.symbol.slice(0, 2)}</span>
                <div>
                  <h3 className="font-bold font-mono">${token.symbol}</h3>
                  <p className="text-xs text-muted-foreground">{token.name}</p>
                </div>
              </div>
              {isNewToken(token.launch_timestamp) && (
                <span className="text-xs bg-foreground text-background px-2 py-1 font-bold">
                  🔥 NEW
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
              <div>
                <span className="text-muted-foreground">PRICE</span>
                <p className="font-mono font-bold">${token.price.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">VOL 24H</span>
                <p className="font-mono font-bold">${token.volume_24h.toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">SUPPLY MINTED</span>
                <span className="font-mono">{((token.supply / 1000000) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(token.supply / 1000000) * 100} className="h-1" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(new Date(token.launch_timestamp), { addSuffix: true })}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
