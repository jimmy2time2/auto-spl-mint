import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface M9Status {
  mood: string;
  emoji: string;
  energy: number;
  lastDecision: string;
  lastUpdate: string;
}

const MOOD_STYLES: Record<string, string> = {
  'bullish': 'text-green-400',
  'bearish': 'text-red-400',
  'neutral': 'text-muted-foreground',
  'volatile': 'text-yellow-400',
  'analyzing': 'text-blue-400',
  'trading': 'text-primary',
  'creating': 'text-purple-400',
  'idle': 'text-muted-foreground',
};

const MOOD_EMOJIS: Record<string, string> = {
  'bullish': '🚀',
  'bearish': '🐻',
  'neutral': '😐',
  'volatile': '⚡',
  'analyzing': '🔍',
  'trading': '📈',
  'creating': '✨',
  'idle': '💤',
};

export default function M9StatusIndicator() {
  const [status, setStatus] = useState<M9Status | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        // Get latest agent cycle
        const { data: cycle } = await supabase
          .from('m9_agent_cycles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (cycle) {
          const analysisSum = cycle.analysis_summary as Record<string, any> || {};
          const sentiment = analysisSum.sentiment || 'neutral';
          const decisions = (cycle.decisions as any[]) || [];
          const lastAction = decisions.length > 0 ? decisions[0]?.action : 'ANALYZING';
          
          setStatus({
            mood: sentiment,
            emoji: MOOD_EMOJIS[sentiment] || MOOD_EMOJIS['neutral'],
            energy: Math.min(100, (cycle.decisions_made || 0) * 20 + 50),
            lastDecision: lastAction,
            lastUpdate: cycle.created_at,
          });
        } else {
          setStatus({
            mood: 'idle',
            emoji: MOOD_EMOJIS['idle'],
            energy: 50,
            lastDecision: 'INITIALIZING',
            lastUpdate: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error fetching M9 status:', error);
        setStatus({
          mood: 'idle',
          emoji: MOOD_EMOJIS['idle'],
          energy: 50,
          lastDecision: 'OFFLINE',
          lastUpdate: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('m9-status')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'm9_agent_cycles',
      }, fetchStatus)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted animate-pulse">
        <div className="w-6 h-6 rounded-full bg-muted-foreground/20" />
        <div className="w-16 h-4 rounded bg-muted-foreground/20" />
      </div>
    );
  }

  if (!status) return null;

  const timeSinceUpdate = Date.now() - new Date(status.lastUpdate).getTime();
  const isRecent = timeSinceUpdate < 10 * 60 * 1000; // Within 10 minutes

  return (
    <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 hover:bg-muted transition-colors">
      {/* Pulse indicator when recently active */}
      {isRecent && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
      )}
      
      {/* Emoji */}
      <span className="text-lg" title={`Mood: ${status.mood}`}>
        {status.emoji}
      </span>
      
      {/* Status text */}
      <div className="text-xs">
        <div className="font-mono font-bold text-foreground">M9</div>
        <div className={`${MOOD_STYLES[status.mood] || MOOD_STYLES['neutral']} font-mono uppercase text-[10px]`}>
          {status.lastDecision}
        </div>
      </div>
      
      {/* Energy bar */}
      <div className="w-8 h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden" title={`Energy: ${status.energy}%`}>
        <div 
          className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500" 
          style={{ width: `${status.energy}%` }}
        />
      </div>
    </div>
  );
}
