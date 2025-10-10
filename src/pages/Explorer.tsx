import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import TerminalCard from "@/components/TerminalCard";
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

      query = query.order(sortBy, { ascending: sortBy === "price" ? false : false });

      const { data, count } = await query;

      if (data) {
        setTokens(data);
      }
      if (count !== null) {
        setTotalCount(count);
      }
    };

    fetchTokens();
  }, [searchTerm, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-screen-xl">
          <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight mb-2">Token Explorer</h1>
          <p className="text-[10px] md:text-xs uppercase tracking-widest opacity-70">All AI-Generated Tokens</p>
        </div>

        <TerminalCard>
          {/* Toolbar */}
          <div className="mb-4 md:mb-6 flex flex-col md:flex-row gap-2 md:gap-4">
            <Input
              placeholder="SEARCH_BY_SYMBOL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-2 border-black font-mono text-xs md:text-sm"
            />
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={sortBy === "volume_24h" ? "default" : "outline"}
                onClick={() => setSortBy("volume_24h")}
                className="border-2 border-black font-mono text-[10px] md:text-xs flex-1 sm:flex-none"
              >
                TOP VOLUME
              </Button>
              <Button
                variant={sortBy === "launch_timestamp" ? "default" : "outline"}
                onClick={() => setSortBy("launch_timestamp")}
                className="border-2 border-black font-mono text-[10px] md:text-xs flex-1 sm:flex-none"
              >
                NEWEST
              </Button>
              <Button
                variant={sortBy === "holders" ? "default" : "outline"}
                onClick={() => setSortBy("holders")}
                className="border-2 border-black font-mono text-[10px] md:text-xs flex-1 sm:flex-none"
              >
                TRENDING
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto -mx-2 md:mx-0">
            <table className="w-full terminal-text min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-2 md:py-3 px-1 md:px-2 text-[10px] md:text-xs">SYMBOL</th>
                  <th className="text-left py-2 md:py-3 px-1 md:px-2 text-[10px] md:text-xs hidden sm:table-cell">NAME</th>
                  <th className="text-right py-2 md:py-3 px-1 md:px-2 text-[10px] md:text-xs">PRICE</th>
                  <th className="text-right py-2 md:py-3 px-1 md:px-2 text-[10px] md:text-xs hidden md:table-cell">VOLUME_24H</th>
                  <th className="text-right py-2 md:py-3 px-1 md:px-2 text-[10px] md:text-xs">LIQUIDITY</th>
                  <th className="text-right py-2 md:py-3 px-1 md:px-2 text-[10px] md:text-xs hidden lg:table-cell">HOLDERS</th>
                  <th className="text-right py-2 md:py-3 px-1 md:px-2 text-[10px] md:text-xs hidden xl:table-cell">LAUNCH_TIME</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token, index) => (
                  <tr 
                    key={token.id} 
                    className={`border-b border-dashed border-black hover:bg-secondary transition-colors ${index % 2 === 0 ? 'bg-card' : ''}`}
                  >
                    <td className="py-2 md:py-3 px-1 md:px-2 text-[10px] md:text-xs">
                      <Link to={`/token/${token.id}`} className="font-bold hover:opacity-70">
                        ${token.symbol}
                      </Link>
                    </td>
                    <td className="py-2 md:py-3 px-1 md:px-2 text-[10px] md:text-xs hidden sm:table-cell">{token.name}</td>
                    <td className="py-2 md:py-3 px-1 md:px-2 text-right text-[10px] md:text-xs">${Number(token.price).toFixed(6)}</td>
                    <td className="py-2 md:py-3 px-1 md:px-2 text-right text-[10px] md:text-xs hidden md:table-cell">${Number(token.volume_24h).toLocaleString()}</td>
                    <td className="py-2 md:py-3 px-1 md:px-2 text-right text-[10px] md:text-xs">{Number(token.liquidity)} SOL</td>
                    <td className="py-2 md:py-3 px-1 md:px-2 text-right text-[10px] md:text-xs hidden lg:table-cell">{token.holders}</td>
                    <td className="py-2 md:py-3 px-1 md:px-2 text-right text-[10px] md:text-xs opacity-70 hidden xl:table-cell">
                      {new Date(token.launch_timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 md:mt-6 flex flex-col sm:flex-row justify-between items-center gap-2 terminal-text text-[10px] md:text-xs">
            <div className="text-center sm:text-left">SHOWING 1-{tokens.length} OF {totalCount} TOKENS</div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-2 border-black font-mono text-[10px] md:text-xs px-2 md:px-4">{'<'} PREV</Button>
              <Button variant="outline" className="border-2 border-black font-mono text-[10px] md:text-xs px-2 md:px-4">NEXT {'>'}</Button>
            </div>
          </div>
        </TerminalCard>
      </main>
    </div>
  );
};

export default Explorer;
