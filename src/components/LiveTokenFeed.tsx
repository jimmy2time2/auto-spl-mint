import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface FeedItem {
  id: string;
  type: 'launch' | 'activity';
  message: string;
  symbol?: string;
  tokenId?: string;
  timestamp: Date;
}

const LiveTokenFeed = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      const [tokensRes, activityRes] = await Promise.all([
        supabase
          .from('tokens')
          .select('id, symbol, name, price, launch_timestamp')
          .order('launch_timestamp', { ascending: false })
          .limit(5),
        supabase
          .from('protocol_activity')
          .select('id, activity_type, description, timestamp')
          .order('timestamp', { ascending: false })
          .limit(5),
      ]);

      const feedItems: FeedItem[] = [];

      if (tokensRes.data) {
        tokensRes.data.forEach((t) => {
          feedItems.push({
            id: `token-${t.id}`,
            type: 'launch',
            message: `TOKEN LAUNCHED: $${t.symbol}`,
            symbol: t.symbol,
            tokenId: t.id,
            timestamp: new Date(t.launch_timestamp),
          });
        });
      }

      if (activityRes.data) {
        activityRes.data.forEach((a) => {
          feedItems.push({
            id: `activity-${a.id}`,
            type: 'activity',
            message: a.description.toUpperCase(),
            timestamp: new Date(a.timestamp),
          });
        });
      }

      feedItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setItems(feedItems.slice(0, 12));
    };

    fetchActivity();

    // Subscribe to new token launches & protocol activity
    const channel = supabase
      .channel('live-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tokens' }, () => fetchActivity())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'protocol_activity' }, () => fetchActivity())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        {items.length === 0 ? (
          <div className="text-muted-foreground">AWAITING ACTIVITY<span className="cursor-blink">_</span></div>
        ) : (
          items.map((item, idx) => (
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
            </div>
          ))
        )}
        <div className="text-primary">
          <span className="cursor-blink">_</span>
        </div>
      </div>
    </div>
  );
};

export default LiveTokenFeed;