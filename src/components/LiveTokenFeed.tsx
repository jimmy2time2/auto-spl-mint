import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface FeedItem {
  id: string;
  type: 'launch' | 'trade' | 'price' | 'ai_thought';
  message: string;
  symbol?: string;
  tokenId?: string;
  timestamp: Date;
  change?: number;
}

const LiveTokenFeed = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [displayedText, setDisplayedText] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize with startup messages
  useEffect(() => {
    const startupMessages: FeedItem[] = [
      { id: '1', type: 'ai_thought', message: 'SYSTEM_BOOT: M9 CORE ONLINE', timestamp: new Date(Date.now() - 5000) },
      { id: '2', type: 'ai_thought', message: 'CONNECTING: SOLANA_MAINNET', timestamp: new Date(Date.now() - 4000) },
      { id: '3', type: 'ai_thought', message: 'LOADING: MARKET_ANALYZERS', timestamp: new Date(Date.now() - 3000) },
      { id: '4', type: 'ai_thought', message: 'STATUS: MONITORING_TRENDS', timestamp: new Date(Date.now() - 2000) },
      { id: '5', type: 'ai_thought', message: 'READY: AWAITING_TRIGGER', timestamp: new Date(Date.now() - 1000) },
    ];
    setItems(startupMessages);
  }, []);

  // Fetch recent token activity
  useEffect(() => {
    const fetchActivity = async () => {
      const { data: tokens } = await supabase
        .from('tokens')
        .select('id, symbol, name, price, launch_timestamp')
        .order('launch_timestamp', { ascending: false })
        .limit(5);

      if (tokens && tokens.length > 0) {
        const tokenItems: FeedItem[] = tokens.map((t, i) => ({
          id: `token-${t.id}`,
          type: 'launch' as const,
          message: `TOKEN_LAUNCHED: $${t.symbol} (${t.name})`,
          symbol: t.symbol,
          tokenId: t.id,
          timestamp: new Date(t.launch_timestamp),
          change: Math.random() > 0.5 ? Math.random() * 50 : -Math.random() * 20,
        }));

        setItems(prev => [...prev, ...tokenItems].slice(-15));
      }
    };

    fetchActivity();

    // Simulate live updates
    const interval = setInterval(() => {
      const thoughts = [
        'SCAN: TWITTER_SENTIMENT',
        'CALC: OPTIMAL_LAUNCH_WINDOW',
        'EVAL: LIQUIDITY_DEPTH',
        'ANALYZE: WHALE_MOVEMENTS',
        'PROCESS: TREND_DATA',
        'CHECK: GAS_CONDITIONS',
        'MONITOR: NETWORK_ACTIVITY',
        'COMPUTE: RISK_METRICS',
      ];
      
      const newItem: FeedItem = {
        id: `thought-${Date.now()}`,
        type: 'ai_thought',
        message: thoughts[Math.floor(Math.random() * thoughts.length)],
        timestamp: new Date(),
      };
      
      setItems(prev => [...prev, newItem].slice(-15));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Typewriter effect for new items
  useEffect(() => {
    const newTexts = items.map(item => {
      const time = item.timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
      });
      return `[${time}] ${item.message}`;
    });
    setDisplayedText(newTexts);
  }, [items]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedText]);

  const getTypeColor = (type: FeedItem['type']) => {
    switch (type) {
      case 'launch': return 'text-primary glow-text';
      case 'trade': return 'text-primary';
      case 'price': return 'text-primary';
      case 'ai_thought': return 'text-muted-foreground';
      default: return 'text-foreground';
    }
  };

  const getTypePrefix = (type: FeedItem['type']) => {
    switch (type) {
      case 'launch': return '◆';
      case 'trade': return '▶';
      case 'price': return '△';
      case 'ai_thought': return '○';
      default: return '·';
    }
  };

  return (
    <div className="border-2 border-primary bg-background glow-border">
      <div className="border-b-2 border-primary px-4 py-3 bg-muted flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="power-pulse text-lg">⏻</span>
          <span className="data-sm">LIVE FEED</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="data-sm text-muted-foreground">VERSION 1.0</span>
          <span className="data-sm animate-pulse">● REC</span>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="h-48 overflow-y-auto p-3 font-mono text-xs space-y-1"
        style={{ scrollBehavior: 'smooth' }}
      >
        {items.map((item, idx) => (
          <div 
            key={item.id} 
            className={`flex items-start gap-2 ${getTypeColor(item.type)} ${idx === items.length - 1 ? 'animate-fade-in' : ''}`}
          >
            <span className="opacity-50">{getTypePrefix(item.type)}</span>
            <span className="opacity-40 tabular-nums">
              [{item.timestamp.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: false 
              })}]
            </span>
            {item.tokenId ? (
              <Link to={`/token/${item.tokenId}`} className="hover:underline glow-text">
                {item.message}
              </Link>
            ) : (
              <span>{item.message}</span>
            )}
            {item.change !== undefined && (
              <span className={item.change >= 0 ? 'text-primary glow-text' : 'text-destructive'}>
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(1)}%
              </span>
            )}
          </div>
        ))}
        <div className="text-primary">
          <span className="cursor-blink">_</span>
        </div>
      </div>
    </div>
  );
};

export default LiveTokenFeed;
