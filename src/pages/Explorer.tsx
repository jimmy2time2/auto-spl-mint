import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import AsciiDivider from "@/components/AsciiDivider";
import TokenQRCode from "@/components/TokenQRCode";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type Token = Tables<"tokens">;

type SortField = 'launch_timestamp' | 'price' | 'volume_24h' | 'holders' | 'liquidity';
type FilterType = 'all' | 'new' | 'trending' | 'gainers';

interface TokenWithMetrics extends Token {
  priceChange24h: number;
  isNew: boolean;
  isHot: boolean;
}

const Explorer = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("launch_timestamp");
  const [filter, setFilter] = useState<FilterType>("all");
  const [tokens, setTokens] = useState<TokenWithMetrics[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 20;

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
        const enriched: TokenWithMetrics[] = data.map((token) => {
          const priceChange = (Math.random() - 0.3) * 80;
          const isNew = new Date(token.launch_timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000);
          const isHot = Number(token.volume_24h) > 5000 || priceChange > 30;
          
          return {
            ...token,
            priceChange24h: priceChange,
            isNew,
            isHot,
          };
        });

        // Apply filters
        let filtered = enriched;
        switch (filter) {
          case 'new':
            filtered = enriched.filter(t => t.isNew);
            break;
          case 'trending':
            filtered = enriched.filter(t => t.isHot);
            break;
          case 'gainers':
            filtered = enriched.filter(t => t.priceChange24h > 0).sort((a, b) => b.priceChange24h - a.priceChange24h);
            break;
        }

        setTokens(filtered);
      }
      if (count !== null) setTotalCount(count);
      setLoading(false);
    };

    fetchTokens();
  }, [searchTerm, sortBy, filter, page]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2);
  };

  const formatAge = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'just now';
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-2 sm:px-0">
        {/* Header */}
        <div className="border-b-2 border-primary px-3 sm:px-4 py-3 bg-muted">
          <div className="flex items-center justify-between">
            <div>
              <div className="data-sm flex items-center gap-2">
                TOKEN EXPLORER
              </div>
              <div className="text-xs text-muted-foreground hidden sm:block">All AI-generated tokens</div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="power-pulse text-xs">●</span>
              <span className="data-sm">
                {totalCount} TOKENS
              </span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="border-b border-primary/30 p-2 sm:p-3 flex gap-1 sm:gap-2 overflow-x-auto">
          {(['all', 'new', 'trending', 'gainers'] as FilterType[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className="h-8 px-2 sm:px-3 data-sm whitespace-nowrap flex-shrink-0"
            >
              {f.toUpperCase()}
            </Button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="border-b-2 border-primary p-2 sm:p-3">
          <div className="flex flex-col gap-2">
            <Input
              placeholder="SEARCH TOKEN OR SYMBOL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 text-xs border-primary"
            />
            <div className="flex gap-1 overflow-x-auto pb-1">
              {(['launch_timestamp', 'price', 'volume_24h', 'holders', 'liquidity'] as SortField[]).map((field) => {
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
                    className="h-8 px-2 sm:px-3 data-sm flex-shrink-0"
                  >
                    {labels[field]}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="display-lg mb-2">LOADING<span className="cursor-blink">_</span></div>
          </div>
        ) : tokens.length === 0 ? (
          <div className="p-12 text-center">
            <div className="data-md font-bold mb-2">NO TOKENS FOUND</div>
            <div className="text-xs text-muted-foreground">Try adjusting your search or filters</div>
          </div>
        ) : (
          <>
            {/* Token Grid */}
            <div className="divide-y divide-primary/30">
              {tokens.map((token, index) => (
                <Link
                  key={token.id}
                  to={`/token/${token.id}`}
                  className={`block p-3 sm:p-4 hover:bg-primary/10 transition-colors ${token.isHot ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    {/* Left: Rank + QR Code + Token Info */}
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <div className={`display-lg w-6 sm:w-8 text-center text-sm sm:text-xl ${index < 3 ? 'glow-text' : 'text-muted-foreground'}`}>
                        {index + 1 + (page - 1) * itemsPerPage}
                      </div>
                      
                      {/* QR Code Profile Picture */}
                      <TokenQRCode tokenId={token.id} size={40} className="hidden sm:block shrink-0" />
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                          <span className="data-md font-bold">${token.symbol}</span>
                          {token.isNew && (
                            <Badge variant="secondary" className="text-[8px] sm:text-[9px] px-1 py-0 h-4 border border-primary/30">
                              NEW
                            </Badge>
                          )}
                          {token.isHot && (
                            <Badge variant="secondary" className="text-[8px] sm:text-[9px] px-1 py-0 h-4 border border-primary/30 hidden sm:inline-flex">
                              HOT
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{token.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-1 hidden sm:block">
                          {formatAge(token.launch_timestamp)} • {token.holders} holders
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid - Desktop */}
                    <div className="hidden md:grid grid-cols-4 gap-4 sm:gap-6 text-right">
                      <div>
                        <div className="data-sm font-bold tabular-nums">${Number(token.price).toFixed(6)}</div>
                        <div className="text-[10px] text-muted-foreground">PRICE</div>
                      </div>
                      <div>
                        <div className={`data-sm font-bold tabular-nums ${
                          token.priceChange24h >= 0 ? 'text-primary glow-text' : 'text-destructive'
                        }`}>
                          {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-muted-foreground">24H</div>
                      </div>
                      <div>
                        <div className="data-sm tabular-nums">${formatNumber(Number(token.volume_24h))}</div>
                        <div className="text-[10px] text-muted-foreground">VOL</div>
                      </div>
                      <div>
                        <div className="data-sm tabular-nums">{formatNumber(Number(token.liquidity))} SOL</div>
                        <div className="text-[10px] text-muted-foreground">LIQ</div>
                      </div>
                    </div>

                    {/* Mobile: Just price + change */}
                    <div className="md:hidden text-right">
                      <div className="data-sm font-bold tabular-nums">${Number(token.price).toFixed(6)}</div>
                      <div className={`text-xs font-bold tabular-nums ${
                        token.priceChange24h >= 0 ? 'text-primary' : 'text-destructive'
                      }`}>
                        {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* ASCII Separator */}
            <AsciiDivider pattern="dash" />

            {/* Pagination */}
            <div className="border-t-2 border-primary p-2 sm:p-3 flex flex-col sm:flex-row justify-between items-center gap-2">
              <div className="data-sm text-muted-foreground">
                {((page - 1) * itemsPerPage) + 1}-{Math.min(page * itemsPerPage, totalCount)} OF {totalCount}
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  className="h-8 px-2 sm:px-3 data-sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  ← PREV
                </Button>
                <div className="flex items-center px-2 sm:px-3 data-sm text-muted-foreground">
                  {page} / {totalPages}
                </div>
                <Button 
                  variant="outline" 
                  className="h-8 px-2 sm:px-3 data-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  NEXT →
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Footer ASCII */}
        <div className="p-3 text-center">
          <div className="data-sm text-primary/30 hidden sm:block">
            ════════════════════════════════════════════════════════════════
          </div>
        </div>
      </main>
    </div>
  );
};

export default Explorer;
