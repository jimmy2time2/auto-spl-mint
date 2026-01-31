import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface FeedItem {
  id: string;
  type: 'launch' | 'trade' | 'system';
  message: string;
  symbol?: string;
  tokenId?: string;
  timestamp: Date;
  change?: number;
}

const LiveTokenFeed = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const startupMessages: FeedItem[] = [
      { id: '1', type: 'system', message: 'SYSTEM INITIALIZED', timestamp: new Date(Date.now() - 5000) },
      { id: '2', type: 'system', message: 'CONNECTED TO SOLANA MAINNET', timestamp: new Date(Date.now() - 4000) },
      { id: '3', type: 'system', message: 'MARKET ANALYZERS LOADED', timestamp: new Date(Date.now() - 3000) },
      { id: '4', type: 'system', message: 'MONITORING ACTIVE', timestamp: new Date(Date.now() - 2000) },
    ];
    setItems(startupMessages);
  }, []);

  useEffect(() => {
    const fetchActivity = async () => {
      const { data: tokens } = await supabase
        .from('tokens')
        .select('id, symbol, name, price, launch_timestamp')
        .order('launch_timestamp', { ascending: false })
        .limit(5);

      if (tokens && tokens.length > 0) {
        const tokenItems: FeedItem[] = tokens.map((t) => ({
          id: `token-${t.id}`,
          type: 'launch' as const,
          message: `TOKEN LAUNCHED: $${t.symbol}`,
          symbol: t.symbol,
          tokenId: t.id,
          timestamp: new Date(t.launch_timestamp),
          change: Math.random() > 0.5 ? Math.random() * 50 : -Math.random() * 20,
        }));

        setItems(prev => [...prev, ...tokenItems].slice(-12));
      }
    };

    fetchActivity();

    const interval = setInterval(() => {
      const actions = [
        'SCANNING MARKET CONDITIONS',
        'ANALYZING SENTIMENT',
        'EVALUATING LIQUIDITY',
        'PROCESSING SIGNALS',
        'MONITORING ACTIVITY',
      ];
      
      const newItem: FeedItem = {
        id: `system-${Date.now()}`,
        type: 'system',
        message: actions[Math.floor(Math.random() * actions.length)],
        timestamp: new Date(),
      };
      
      setItems(prev => [...prev, newItem].slice(-12));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [items]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="h-full">
      <div className="border-b border-primary/30 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="status-live" />
          <span className="data-sm">LIVE FEED</span>
        </div>
        <span className="data-sm text-muted-foreground hidden sm:block">RECORDING</span>
      </div>
      
      <div 
        ref={containerRef}
        className="h-48 overflow-y-auto p-3 sm:p-4 font-mono text-[10px] sm:text-xs space-y-2"
      >
        {items.map((item, idx) => (
          <div 
            key={item.id} 
            className={`flex items-start gap-2 sm:gap-3 ${
              item.type === 'launch' ? 'text-primary' : 'text-muted-foreground'
            } ${idx === items.length - 1 ? 'animate-fade-in' : ''}`}
          >
            <span className="tabular-nums opacity-50 shrink-0 hidden sm:inline">
              {formatTime(item.timestamp)}
            </span>
            <span className="tabular-nums opacity-50 shrink-0 sm:hidden">
              {item.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
            {item.tokenId ? (
              <Link to={`/token/${item.tokenId}`} className="hover:underline truncate min-w-0">
                {item.message}
              </Link>
            ) : (
              <span className="truncate min-w-0">{item.message}</span>
            )}
            {item.change !== undefined && (
              <span className={`ml-auto shrink-0 ${item.change >= 0 ? 'text-primary' : 'text-destructive'}`}>
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
