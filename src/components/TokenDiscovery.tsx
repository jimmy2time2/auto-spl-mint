import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

type Token = Tables<"tokens">;

type FilterType = 'trending' | 'new' | 'gainers' | 'volume';

interface TokenWithBadges extends Token {
  badges: string[];
  priceChange24h: number;
  isHot: boolean;
}

const TokenDiscovery = () => {
  const [tokens, setTokens] = useState<TokenWithBadges[]>([]);
  const [filter, setFilter] = useState<FilterType>('trending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTokens = async () => {
      setLoading(true);
      
      let query = supabase.from('tokens').select('*');
      
      switch (filter) {
        case 'trending':
          query = query.order('volume_24h', { ascending: false });
          break;
        case 'new':
          query = query.order('launch_timestamp', { ascending: false });
          break;
        case 'gainers':
          query = query.order('price', { ascending: false });
          break;
        case 'volume':
          query = query.order('volume_24h', { ascending: false });
          break;
      }
      
      query = query.limit(10);
      
      const { data } = await query;
      
      if (data) {
        const enriched: TokenWithBadges[] = data.map((token, index) => {
          const badges: string[] = [];
          const priceChange = (Math.random() - 0.3) * 100; // Simulated
          
          // Badge logic
          if (index < 3) badges.push('🔥 HOT');
          if (new Date(token.launch_timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
            badges.push('✨ NEW');
          }
          if (priceChange > 20) badges.push('🚀 PUMP');
          if (token.holders > 500) badges.push('👥 POPULAR');
          if (Number(token.volume_24h) > 10000) badges.push('📈 HIGH VOL');
          
          return {
            ...token,
            badges,
            priceChange24h: priceChange,
            isHot: index < 3 || priceChange > 30,
          };
        });
        
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

  return (
    <div className="border-2 border-primary glow-border">
      {/* Header */}
      <div className="border-b-2 border-primary px-4 py-3 bg-muted flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="power-pulse">⏻</span>
          <span className="data-sm">TOKEN DISCOVERY</span>
        </div>
        <span className="data-sm text-muted-foreground">{tokens.length} TOKENS</span>
      </div>
      
      {/* Filter Tabs */}
      <div className="border-b border-primary/30 p-3 flex gap-2 flex-wrap">
        {(['trending', 'new', 'gainers', 'volume'] as FilterType[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className="h-8 px-3 data-sm"
          >
            {f === 'trending' && '🔥 '}
            {f === 'new' && '✨ '}
            {f === 'gainers' && '🚀 '}
            {f === 'volume' && '📊 '}
            {f.toUpperCase()}
          </Button>
        ))}
      </div>
      
      {/* Token Grid */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="data-sm">LOADING<span className="cursor-blink">_</span></div>
        </div>
      ) : tokens.length === 0 ? (
        <div className="p-8 text-center">
          <div className="text-2xl mb-2 opacity-30">⏻</div>
          <div className="data-sm text-muted-foreground">NO TOKENS YET</div>
        </div>
      ) : (
        <div className="divide-y divide-primary/30">
          {tokens.map((token, index) => (
            <Link
              key={token.id}
              to={`/token/${token.id}`}
              className={`block p-4 hover:bg-primary/10 transition-colors ${token.isHot ? 'bg-primary/5' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left: Rank + Info */}
                <div className="flex items-start gap-4">
                  <div className={`display-lg w-8 ${index < 3 ? 'glow-text' : 'text-muted-foreground'}`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="data-md font-bold">${token.symbol}</span>
                      {token.badges.slice(0, 2).map((badge, i) => (
                        <Badge 
                          key={i} 
                          variant="secondary" 
                          className="text-[9px] px-1.5 py-0.5 h-4 border border-primary/30"
                        >
                          {badge}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">{token.name}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{token.holders} holders</span>
                      <span>•</span>
                      <span>{formatAge(token.launch_timestamp)} old</span>
                    </div>
                  </div>
                </div>
                
                {/* Right: Price + Change */}
                <div className="text-right">
                  <div className="data-md font-bold tabular-nums">${Number(token.price).toFixed(6)}</div>
                  <div className={`text-xs font-bold tabular-nums ${
                    token.priceChange24h >= 0 ? 'text-primary glow-text' : 'text-destructive'
                  }`}>
                    {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ${formatNumber(Number(token.volume_24h))} vol
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {/* View All */}
      <div className="border-t-2 border-primary p-3 text-center">
        <Link to="/explorer" className="data-sm hover:text-primary transition-colors">
          VIEW ALL TOKENS →
        </Link>
      </div>
    </div>
  );
};

export default TokenDiscovery;
