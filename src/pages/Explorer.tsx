import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type Token = Tables<"tokens">;

const Explorer = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<keyof Token>("launch_timestamp");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchTokens = async () => {
      let query = supabase
        .from("tokens")
        .select("*", { count: 'exact' });

      if (searchTerm) {
        query = query.ilike("symbol", `%${searchTerm}%`);
      }

      query = query.order(sortBy, { ascending: false });

      const { data, count } = await query;

      if (data) setTokens(data);
      if (count !== null) setTotalCount(count);
    };

    fetchTokens();
  }, [searchTerm, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="border-b border-border px-4 py-3 bg-muted">
          <div className="flex items-center justify-between">
            <div>
              <div className="data-sm">TOKEN EXPLORER</div>
              <div className="text-xs text-muted-foreground">All AI-generated tokens</div>
            </div>
            <div className="data-sm text-muted-foreground">
              {totalCount} TOKENS
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="border-b border-border p-3">
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              placeholder="SEARCH SYMBOL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 h-8 text-xs border-border"
            />
            <div className="flex gap-1">
              <Button
                variant={sortBy === "price" ? "default" : "outline"}
                onClick={() => setSortBy("price")}
                className="h-8 px-3 data-sm"
              >
                PRICE
              </Button>
              <Button
                variant={sortBy === "volume_24h" ? "default" : "outline"}
                onClick={() => setSortBy("volume_24h")}
                className="h-8 px-3 data-sm"
              >
                VOL
              </Button>
              <Button
                variant={sortBy === "launch_timestamp" ? "default" : "outline"}
                onClick={() => setSortBy("launch_timestamp")}
                className="h-8 px-3 data-sm"
              >
                DATE
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[600px]">
            <thead>
              <tr>
                <th>SYMBOL</th>
                <th className="hidden sm:table-cell">NAME</th>
                <th className="text-right">PRICE</th>
                <th className="text-right hidden md:table-cell">VOL 24H</th>
                <th className="text-right">LIQUIDITY</th>
                <th className="text-right hidden lg:table-cell">HOLDERS</th>
                <th className="text-right hidden xl:table-cell">LAUNCHED</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <tr key={token.id}>
                  <td>
                    <Link to={`/token/${token.id}`} className="font-bold hover:underline">
                      ${token.symbol}
                    </Link>
                  </td>
                  <td className="hidden sm:table-cell text-muted-foreground">{token.name}</td>
                  <td className="text-right tabular-nums">${Number(token.price).toFixed(6)}</td>
                  <td className="text-right tabular-nums hidden md:table-cell">${Number(token.volume_24h).toLocaleString()}</td>
                  <td className="text-right tabular-nums">{Number(token.liquidity)} SOL</td>
                  <td className="text-right tabular-nums hidden lg:table-cell">{token.holders}</td>
                  <td className="text-right text-muted-foreground hidden xl:table-cell">
                    {new Date(token.launch_timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-border p-3 flex justify-between items-center">
          <div className="data-sm text-muted-foreground">
            1-{tokens.length} OF {totalCount}
          </div>
          <div className="flex gap-1">
            <Button variant="outline" className="h-8 px-3 data-sm">← PREV</Button>
            <Button variant="outline" className="h-8 px-3 data-sm">NEXT →</Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Explorer;
