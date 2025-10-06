import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

interface AIHintData {
  latestHint: string;
  aiStatus: {
    mood: string;
    status: string;
    energyScore: number;
    hoursSinceLastMint: string;
    lastToken?: {
      name: string;
      symbol: string;
      created: string;
    } | null;
  };
  timestamp: string;
}

export function AIHintDisplay() {
  const [hintData, setHintData] = useState<AIHintData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHint = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('hint-api');
      
      if (error) throw error;
      
      setHintData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching AI hint:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHint();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchHint, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="bg-black/40 border-primary/20">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-primary/20 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-primary/10 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hintData) return null;

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'dormant': return 'text-gray-400';
      case 'stirring': return 'text-yellow-400';
      case 'active': return 'text-orange-400';
      case 'manic': return 'text-red-400 animate-pulse';
      default: return 'text-gray-400';
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'dormant': return '😴';
      case 'stirring': return '👁️';
      case 'active': return '⚡';
      case 'manic': return '🔥';
      default: return '🤖';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-background to-secondary/5 border-primary/30 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-primary/80 mb-1">🧠 AI MIND</h3>
            <Badge variant="outline" className={getMoodColor(hintData.aiStatus.mood)}>
              {getMoodEmoji(hintData.aiStatus.mood)} {hintData.aiStatus.mood.toUpperCase()}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Energy Score</div>
            <div className="text-lg font-bold text-primary">
              {hintData.aiStatus.energyScore.toFixed(1)}/10
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-black/20 rounded-lg border border-primary/20">
            <p className="text-sm font-mono text-primary italic">
              "{hintData.latestHint}"
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Last mint: {hintData.aiStatus.hoursSinceLastMint}h ago</span>
            {hintData.aiStatus.lastToken && (
              <span className="text-primary/70">
                ${hintData.aiStatus.lastToken.symbol}
              </span>
            )}
          </div>

          {parseFloat(hintData.aiStatus.hoursSinceLastMint) >= 24 && (
            <div className="text-center pt-2">
              <div className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold animate-pulse">
                ⚠️ MINT WINDOW OPEN
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
