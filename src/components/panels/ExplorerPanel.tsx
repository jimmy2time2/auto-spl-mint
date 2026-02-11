import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import TokenQRCode from "@/components/TokenQRCode";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type Token = Tables<"tokens">;
type SortField = 'launch_timestamp' | 'price' | 'volume_24h' | 'holders' | 'liquidity';

interface TokenWithFlags extends Token {
  isNew: boolean;
}

const ExplorerPanel = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("launch_timestamp");
  const [tokens, setTokens] = useState<TokenWithFlags[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchTokens = async () => {
      setLoading(true);
      
      let query = supabase
        .from("tokens")
        .select("*", { count: 'exact' });

      if (searchTerm) {
        query = query.or(`symbol.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`);
      }

      query = query.order(sortBy, { ascending: false });
      query = query.range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

      const { data, count } = await query;

      if (data) {
        const enriched: TokenWithFlags[] = data.map((token) => {
          const isNew = new Date(token.launch_timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000);
          return { ...token, isNew };
        });
        setTokens(enriched);
      }
      if (count !== null) setTotalCount(count);
      setLoading(false);
    };

    fetchTokens();
  }, [searchTerm, sortBy, page]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div>
      {/* Search */}
      <div className="p-2">
        <Input
          placeholder="SEARCH TOKEN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9 text-xs border-primary"
        />
        <div className="flex gap-1 mt-2 overflow-x-auto">
          {(['launch_timestamp', 'price', 'volume_24h'] as SortField[]).map((field) => {
            const labels: Record<SortField, string> = {
              launch_timestamp: 'DATE',
              price: 'PRICE',
              volume_24h: 'VOL',
              holders: 'HOLD',
              liquidity: 'LIQ',
            };
            return (
              <Button
                key={field}
                variant={sortBy === field ? "default" : "outline"}
                onClick={() => setSortBy(field)}
                className="h-7 px-2 text-[10px] flex-shrink-0"
              >
                {labels[field]}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Token List */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="data-sm">LOADING<span className="cursor-blink">_</span></div>
        </div>
      ) : tokens.length === 0 ? (
        <div className="p-8 text-center">
          <div className="data-sm text-muted-foreground">NO TOKENS FOUND</div>
        </div>
      ) : (
        <>
          <div className="divide-y divide-primary/30 max-h-[400px] overflow-y-auto">
            {tokens.map((token, index) => (
              <Link
                key={token.id}
                to={`/token/${token.id}`}
                className="block p-3 hover:bg-primary/10 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`data-sm w-5 text-center ${index < 3 ? 'glow-text' : 'text-muted-foreground'}`}>
                      {index + 1}
                    </div>
                    <TokenQRCode tokenId={token.id} size={28} className="hidden sm:block shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="data-sm font-bold">${token.symbol}</span>
                        {token.isNew && (
                          <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5">NEW</Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">{token.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="data-sm font-bold tabular-nums">${Number(token.price).toFixed(6)}</div>
                    <div className="text-[10px] text-muted-foreground tabular-nums">
                      VOL: {Number(token.volume_24h) >= 1000
                        ? `$${(Number(token.volume_24h) / 1000).toFixed(1)}K`
                        : `$${Number(token.volume_24h).toFixed(0)}`
                      }
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-primary/30 p-2 flex justify-between items-center">
              <div className="data-sm text-muted-foreground">
                {page}/{totalPages}
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  className="h-7 px-2 text-[10px]"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  ←
                </Button>
                <Button 
                  variant="outline" 
                  className="h-7 px-2 text-[10px]"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  →
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExplorerPanel;