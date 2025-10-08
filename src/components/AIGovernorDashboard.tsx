/**
 * AI Governor Dashboard
 * 
 * Displays AI Mind decisions, market sentiment, and clue broadcasts
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Shield, Sparkles } from 'lucide-react';

interface AILog {
  id: string;
  timestamp: string;
  action_taken: string;
  ai_score: number | null;
  result: any;
  execution_time_ms: number | null;
  error_message: string | null;
}

interface MarketSentiment {
  id: string;
  timestamp: string;
  sentiment_score: number;
  recommendation: string;
  confidence: number;
  whale_activity_level: string | null;
}

interface ClueMessage {
  id: string;
  activity_type: string;
  description: string;
  timestamp: string;
  metadata: any;
}

export function AIGovernorDashboard() {
  const [aiLogs, setAiLogs] = useState<AILog[]>([]);
  const [sentiment, setSentiment] = useState<MarketSentiment | null>(null);
  const [clues, setClues] = useState<ClueMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('ai-governor-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_governor_log'
        },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadData() {
    try {
      const [logsRes, sentimentRes, cluesRes] = await Promise.all([
        supabase
          .from('ai_governor_log')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(10),
        supabase
          .from('market_sentiment')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('protocol_activity')
          .select('*')
          .like('activity_type', 'clue_%')
          .order('timestamp', { ascending: false })
          .limit(5)
      ]);

      if (logsRes.data) setAiLogs(logsRes.data as AILog[]);
      if (sentimentRes.data) setSentiment(sentimentRes.data as MarketSentiment);
      if (cluesRes.data) setClues(cluesRes.data as ClueMessage[]);
    } catch (error) {
      console.error('Failed to load AI Governor data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getScoreBadge = (score: number | null) => {
    if (!score) return <Badge variant="secondary">N/A</Badge>;
    if (score > 7) return <Badge className="bg-green-500">HIGH: {score}</Badge>;
    if (score >= 5) return <Badge className="bg-yellow-500">MED: {score}</Badge>;
    return <Badge className="bg-red-500">LOW: {score}</Badge>;
  };

  const getSentimentBadge = (score: number) => {
    if (score > 6) return <Badge className="bg-green-500">BULLISH</Badge>;
    if (score >= 3) return <Badge className="bg-yellow-500">NEUTRAL</Badge>;
    return <Badge className="bg-red-500">BEARISH</Badge>;
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="animate-pulse">
          <CardHeader className="h-24 bg-muted" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Sentiment */}
      {sentiment && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>Market Sentiment</CardTitle>
              </div>
              {getSentimentBadge(sentiment.sentiment_score)}
            </div>
            <CardDescription>
              Updated {new Date(sentiment.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Score</p>
                <p className="text-2xl font-bold">{sentiment.sentiment_score}/10</p>
              </div>
              <div>
                <p className="text-muted-foreground">Confidence</p>
                <p className="text-2xl font-bold">{(sentiment.confidence * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Recommendation</p>
                <p className="font-semibold uppercase">{sentiment.recommendation}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Whale Activity</p>
                <p className="font-semibold uppercase">{sentiment.whale_activity_level || 'LOW'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent AI Decisions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle>AI Mind Decisions</CardTitle>
            </div>
            <CardDescription>Recent autonomous decisions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No decisions yet</p>
              ) : (
                aiLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{log.action_taken}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                      {log.execution_time_ms && (
                        <p className="text-xs text-muted-foreground">
                          {log.execution_time_ms}ms
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getScoreBadge(log.ai_score)}
                      {log.error_message ? (
                        <Shield className="h-4 w-4 text-red-500" />
                      ) : (
                        <Shield className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Clues */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Cryptic Clues</CardTitle>
            </div>
            <CardDescription>Hints from the AI Mind</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clues.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">The Mind is silent...</p>
              ) : (
                clues.map((clue) => (
                  <div
                    key={clue.id}
                    className="border-l-2 border-primary pl-3 py-2"
                  >
                    <p className="text-sm font-medium italic">{clue.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {clue.activity_type.replace('clue_', '')}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {new Date(clue.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Decision Log */}
      <Card>
        <CardHeader>
          <CardTitle>Decision Log</CardTitle>
          <CardDescription>Complete history of AI Governor actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {aiLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between border border-border rounded-lg p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge>{log.action_taken}</Badge>
                    {log.ai_score && getScoreBadge(log.ai_score)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                  {log.result?.reasoning && (
                    <p className="text-sm mt-2">{log.result.reasoning}</p>
                  )}
                  {log.error_message && (
                    <p className="text-sm text-red-500 mt-2">Error: {log.error_message}</p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground ml-4">
                  {log.execution_time_ms}ms
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
