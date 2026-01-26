import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

type Token = Tables<"tokens">;
type FilterType = 'trending' | 'new' | 'gainers' | 'volume';

interface TokenWithMetrics extends Token {
  priceChange24h: number;
}

const TokenDiscovery = () => {
  const [tokens, setTokens] = useState<TokenWithMetrics[]>([]);
  const [filter, setFilter] = useState<FilterType>('trending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTokens = async () => {
      setLoading(true);
      
      let query = supabase.from('tokens').select('*');
      
      switch (filter) {
        case 'trending':
        case 'volume':
          query = query.order('volume_24h', { ascending: false });
          break;
        case 'new':
          query = query.order('launch_timestamp', { ascending: false });
          break;
        case 'gainers':
          query = query.order('price', { ascending: false });
          break;
      }
      
      query = query.limit(8);
      
      const { data } = await query;
      
      if (data) {
        const enriched: TokenWithMetrics[] = data.map((token) => ({
          ...token,
          priceChange24h: (Math.random() - 0.3) * 100,
        }));
        
        setTokens(enriched);
      }
      
      setLoading(false);
    };
    
    fetchTokens();
  }, [filter]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2);
  };

  const formatAge = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return 'now';
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'trending', label: 'TRENDING' },
    { key: 'new', label: 'NEW' },
    { key: 'gainers', label: 'GAINERS' },
    { key: 'volume', label: 'VOLUME' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="border-b border-primary/30 px-6 py-4 flex items-center justify-between">
        <h2 className="data-sm">DISCOVER TOKENS</h2>
        <span className="data-sm text-muted-foreground">{tokens.length} RESULTS</span>
      </div>
      
      {/* Filter Tabs */}
      <div className="border-b border-primary/30 px-6 py-3 flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter(f.key)}
            className="h-8 px-4 data-sm shrink-0"
          >
            {f.label}
          </Button>
        ))}
      </div>
      
      {/* Token List */}
      {loading ? (
        <div className="p-8 text-center">
          <p className="data-sm text-muted-foreground">LOADING<span className="cursor-blink">_</span></p>
        </div>
      ) : tokens.length === 0 ? (
        <div className="p-8 text-center">
          <p className="data-sm text-muted-foreground">NO TOKENS FOUND</p>
        </div>
      ) : (
        <div className="divide-y divide-primary/30">
          {tokens.map((token, index) => (
            <Link
              key={token.id}
              to={`/token/${token.id}`}
              className="block px-6 py-4 hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left: Rank + Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <span className={`data-md w-6 text-center ${index < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="data-md font-bold truncate">${token.symbol}</p>
                    <p className="text-xs text-muted-foreground truncate">{token.name}</p>
                  </div>
                </div>
                
                {/* Center: Metrics */}
                <div className="hidden sm:flex items-center gap-6 text-xs text-muted-foreground">
                  <span>{token.holders} holders</span>
                  <span>{formatAge(token.launch_timestamp)}</span>
                  <span>${formatNumber(Number(token.volume_24h))}</span>
                </div>
                
                {/* Right: Price + Change */}
                <div className="text-right shrink-0">
                  <p className="data-md tabular-nums">${Number(token.price).toFixed(6)}</p>
                  <p className={`text-xs tabular-nums ${
                    token.priceChange24h >= 0 ? 'text-primary' : 'text-destructive'
                  }`}>
                    {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {/* View All */}
      <div className="border-t border-primary/30 p-4 text-center">
        <Link to="/explorer" className="data-sm text-muted-foreground hover:text-primary transition-colors">
          VIEW ALL TOKENS →
        </Link>
      </div>
    </div>
  );
};

export default TokenDiscovery;
