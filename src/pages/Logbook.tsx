import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEngagementTracking } from "@/hooks/useEngagementTracking";
import { format } from "date-fns";
import { Brain, Shield, Coins, PieChart, Zap, ChevronDown, ChevronRight, Clock, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

type LogType = 'all' | 'ai_decision' | 'governor_action' | 'token_launch' | 'profit_rebalance' | 'heartbeat';

interface LogEntry {
  id: string;
  timestamp: string;
  type: LogType;
  title: string;
  description: string;
  confidence?: number;
  decision?: string;
  symbol: string;
  metadata?: any;
}

const Logbook = () => {
  useEngagementTracking();
  const [combinedLogs, setCombinedLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<LogType>('all');
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const { data: aiLogs, isLoading: aiLoading } = useQuery({
    queryKey: ['ai-action-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_action_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: governorLogs, isLoading: govLoading } = useQuery({
    queryKey: ['governor-action-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('governor_action_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: protocolActivity, isLoading: protoLoading } = useQuery({
    queryKey: ['protocol-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('protocol_activity')
        .select('*')
        .in('activity_type', ['token_mint', 'allocation_proposal', 'allocation_analysis'])
        .order('timestamp', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: heartbeatLogs, isLoading: hbLoading } = useQuery({
    queryKey: ['heartbeat-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('heartbeat_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    }
  });

  const loading = aiLoading || govLoading || protoLoading || hbLoading;

  useEffect(() => {
    const logs: LogEntry[] = [];

    if (aiLogs) {
      aiLogs.forEach((log: any) => {
        logs.push({
          id: log.id,
          timestamp: log.timestamp,
          type: 'ai_decision',
          title: `AI ${log.action.toUpperCase()}`,
          description: log.reasoning || 'AI made a decision',
          confidence: log.confidence,
          symbol: '◉',
          metadata: log
        });
      });
    }

    if (governorLogs) {
      governorLogs.forEach((log: any) => {
        const symbolMap: Record<string, string> = {
          approved: '✓',
          rejected: '✗',
          modified: '~',
          deferred: '○'
        };
        
        logs.push({
          id: log.id,
          timestamp: log.timestamp,
          type: 'governor_action',
          title: `GOVERNOR ${log.decision.toUpperCase()}: ${log.action_type}`,
          description: log.public_message || log.reasoning,
          confidence: log.confidence,
          decision: log.decision,
          symbol: symbolMap[log.decision] || '?',
          metadata: log
        });
      });
    }

    if (protocolActivity) {
      protocolActivity.forEach((log: any) => {
        if (log.activity_type === 'token_mint') {
          logs.push({
            id: log.id,
            timestamp: log.timestamp,
            type: 'token_launch',
            title: 'TOKEN MINTED',
            description: log.description,
            symbol: '+',
            metadata: log
          });
        } else if (log.activity_type === 'allocation_proposal' || log.activity_type === 'allocation_analysis') {
          logs.push({
            id: log.id,
            timestamp: log.timestamp,
            type: 'profit_rebalance',
            title: 'ALLOCATION UPDATE',
            description: log.description,
            symbol: '%',
            metadata: log
          });
        }
      });
    }

    if (heartbeatLogs) {
      heartbeatLogs.forEach((log: any) => {
        logs.push({
          id: log.id,
          timestamp: log.timestamp,
          type: 'heartbeat',
          title: `AI WAKE ${log.decision_triggered ? '→ DECISION' : '→ IDLE'}`,
          description: `Interval: ${log.interval_hours}h | Entropy: ${(log.entropy_factor * 100).toFixed(0)}%${log.decision_result ? ` | Result: ${log.decision_result}` : ''}`,
          symbol: '♥',
          metadata: log
        });
      });
    }

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setCombinedLogs(logs);
  }, [aiLogs, governorLogs, protocolActivity, heartbeatLogs]);

  const filteredLogs = activeTab === 'all' 
    ? combinedLogs 
    : combinedLogs.filter(log => log.type === activeTab);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedEntries(newExpanded);
  };

  const getDecisionBadge = (decision?: string) => {
    if (!decision) return null;
    switch (decision) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">APPROVED</Badge>;
      case "rejected":
        return <Badge variant="destructive">REJECTED</Badge>;
      case "modified":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">MODIFIED</Badge>;
      case "deferred":
        return <Badge variant="secondary">DEFERRED</Badge>;
      default:
        return <Badge variant="outline">{decision.toUpperCase()}</Badge>;
    }
  };

  const getTypeIcon = (type: LogType) => {
    const icons: Record<LogType, React.ReactNode> = {
      all: <Activity className="h-4 w-4" />,
      ai_decision: <Brain className="h-4 w-4" />,
      governor_action: <Shield className="h-4 w-4" />,
      token_launch: <Coins className="h-4 w-4" />,
      profit_rebalance: <PieChart className="h-4 w-4" />,
      heartbeat: <Zap className="h-4 w-4" />
    };
    return icons[type];
  };

  const renderMarketSignals = (signals: any) => {
    if (!signals) return null;
    return (
      <div className="space-y-2">
        <p className="data-sm text-muted-foreground">MARKET SIGNALS</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(signals).map(([key, value]) => (
            <div key={key} className="border border-primary/30 p-2">
              <p className="data-sm text-muted-foreground">{key.replace(/_/g, ' ').toUpperCase()}</p>
              <p className="data-sm">
                {typeof value === 'number' ? value.toFixed(2) : String(value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderExpandedDetails = (log: LogEntry) => {
    const { metadata, type } = log;
    if (!metadata) return null;

    return (
      <div className="mt-4 pt-4 border-t border-primary/20 space-y-4">
        {/* Full Reasoning */}
        {metadata.reasoning && (
          <div>
            <p className="data-sm text-muted-foreground mb-2">FULL REASONING</p>
            <p className="text-sm bg-primary/5 border border-primary/20 p-3">{metadata.reasoning}</p>
          </div>
        )}

        {/* Market Signals */}
        {metadata.market_signals && renderMarketSignals(metadata.market_signals)}

        {/* Input Data for AI decisions */}
        {type === 'ai_decision' && metadata.input_data && (
          <div>
            <p className="data-sm text-muted-foreground mb-2">INPUT DATA</p>
            <pre className="text-xs bg-primary/5 border border-primary/20 p-3 overflow-x-auto font-mono">
              {JSON.stringify(metadata.input_data, null, 2)}
            </pre>
          </div>
        )}

        {/* Execution Result */}
        {metadata.execution_result && (
          <div>
            <p className="data-sm text-muted-foreground mb-2">EXECUTION RESULT</p>
            <pre className="text-xs bg-primary/5 border border-primary/20 p-3 overflow-x-auto font-mono">
              {JSON.stringify(metadata.execution_result, null, 2)}
            </pre>
          </div>
        )}

        {/* Heartbeat specific details */}
        {type === 'heartbeat' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border border-primary/30 p-3 text-center">
              <p className="display-lg">{metadata.interval_hours}h</p>
              <p className="data-sm text-muted-foreground">INTERVAL</p>
            </div>
            <div className="border border-primary/30 p-3 text-center">
              <p className="display-lg">{(metadata.entropy_factor * 100).toFixed(0)}%</p>
              <p className="data-sm text-muted-foreground">ENTROPY</p>
            </div>
            {metadata.market_activity_score !== null && (
              <div className="border border-primary/30 p-3 text-center">
                <p className="display-lg">{metadata.market_activity_score?.toFixed(1) || '—'}</p>
                <p className="data-sm text-muted-foreground">ACTIVITY</p>
              </div>
            )}
            {metadata.time_of_day_factor !== null && (
              <div className="border border-primary/30 p-3 text-center">
                <p className="display-lg">{metadata.time_of_day_factor?.toFixed(2) || '—'}</p>
                <p className="data-sm text-muted-foreground">TIME FACTOR</p>
              </div>
            )}
          </div>
        )}

        {/* Governor specific: Guardrails */}
        {type === 'governor_action' && metadata.guardrails_triggered?.length > 0 && (
          <div>
            <p className="data-sm text-muted-foreground mb-2">GUARDRAILS TRIGGERED</p>
            <div className="flex flex-wrap gap-2">
              {metadata.guardrails_triggered.map((guardrail: string) => (
                <Badge key={guardrail} variant="destructive">{guardrail}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Governor specific: Original vs Modified */}
        {type === 'governor_action' && metadata.original_value && metadata.modified_value && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="data-sm text-muted-foreground mb-2">ORIGINAL</p>
              <pre className="text-xs bg-red-500/10 border border-red-500/30 p-3 overflow-x-auto font-mono">
                {JSON.stringify(metadata.original_value, null, 2)}
              </pre>
            </div>
            <div>
              <p className="data-sm text-muted-foreground mb-2">MODIFIED</p>
              <pre className="text-xs bg-green-500/10 border border-green-500/30 p-3 overflow-x-auto font-mono">
                {JSON.stringify(metadata.modified_value, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Token/Protocol activity metadata */}
        {(type === 'token_launch' || type === 'profit_rebalance') && metadata.metadata && (
          <div>
            <p className="data-sm text-muted-foreground mb-2">DETAILS</p>
            <pre className="text-xs bg-primary/5 border border-primary/20 p-3 overflow-x-auto font-mono">
              {JSON.stringify(metadata.metadata, null, 2)}
            </pre>
          </div>
        )}

        {/* Next heartbeat */}
        {type === 'heartbeat' && metadata.next_heartbeat_at && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="data-sm">Next wake: {format(new Date(metadata.next_heartbeat_at), 'MMM dd HH:mm:ss')}</span>
          </div>
        )}
      </div>
    );
  };

  const tabs: { value: LogType; label: string; count: number }[] = [
    { value: 'all', label: 'ALL', count: combinedLogs.length },
    { value: 'ai_decision', label: 'AI', count: aiLogs?.length || 0 },
    { value: 'governor_action', label: 'GOVERNOR', count: governorLogs?.length || 0 },
    { value: 'token_launch', label: 'MINTS', count: protocolActivity?.filter((l: any) => l.activity_type === 'token_mint').length || 0 },
    { value: 'profit_rebalance', label: 'ALLOC', count: protocolActivity?.filter((l: any) => l.activity_type !== 'token_mint').length || 0 },
    { value: 'heartbeat', label: 'PULSE', count: heartbeatLogs?.length || 0 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="data-lg mb-2">LOADING<span className="cursor-blink">_</span></div>
          <div className="data-sm text-muted-foreground">FETCHING LOG DATA</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="w-full">
        {/* Header */}
        <section className="border-b-2 border-primary">
          <div className="p-6 sm:p-8 lg:p-12">
            <p className="data-sm text-muted-foreground mb-4">TRANSPARENCY</p>
            <h1 className="display-xl mb-4 glow-text">LOGBOOK</h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              Complete timeline of AI decisions, governor actions, and system events. Full transparency into the autonomous mind.
            </p>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 border-b-2 border-primary">
          <div className="border-r border-b md:border-b-0 border-primary/30 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-primary" />
              <p className="data-sm text-muted-foreground">AI DECISIONS</p>
            </div>
            <p className="display-lg glow-text tabular-nums">{aiLogs?.length || 0}</p>
          </div>
          <div className="border-r-0 md:border-r border-b md:border-b-0 border-primary/30 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-green-400" />
              <p className="data-sm text-muted-foreground">APPROVED</p>
            </div>
            <p className="display-lg tabular-nums text-green-400">
              {governorLogs?.filter((l: any) => l.decision === 'approved').length || 0}
            </p>
          </div>
          <div className="border-r border-primary/30 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-red-400" />
              <p className="data-sm text-muted-foreground">REJECTED</p>
            </div>
            <p className="display-lg tabular-nums text-red-400">
              {governorLogs?.filter((l: any) => l.decision === 'rejected').length || 0}
            </p>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <p className="data-sm text-muted-foreground">HEARTBEATS</p>
            </div>
            <p className="display-lg tabular-nums">{heartbeatLogs?.length || 0}</p>
          </div>
        </section>

        {/* Log Section */}
        <section className="border-b-2 border-primary">
          {/* Tab Navigation */}
          <div className="flex border-b border-primary/30 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "flex-1 min-w-[100px] px-4 py-3 data-sm transition-colors flex items-center justify-center gap-2",
                  activeTab === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-primary/10"
                )}
              >
                {getTypeIcon(tab.value)}
                <span>{tab.label}</span>
                <span className="opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Log Entries */}
          <ScrollArea className="h-[600px]">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="data-sm text-muted-foreground">NO ACTIVITY YET</p>
                <p className="text-xs text-muted-foreground mt-1">AI Mind is initializing...</p>
              </div>
            ) : (
              <div className="divide-y divide-primary/20">
                {filteredLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="p-6 hover:bg-primary/5 transition-colors cursor-pointer"
                    onClick={() => toggleExpand(log.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Symbol */}
                      <div className="w-10 h-10 border border-primary/30 flex items-center justify-center shrink-0">
                        <span className={cn(
                          "text-xl",
                          log.type === 'heartbeat' && "text-red-400"
                        )}>{log.symbol}</span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            {getDecisionBadge(log.decision)}
                            <Badge variant="outline" className="gap-1">
                              {getTypeIcon(log.type)}
                              {log.type.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <span className="text-muted-foreground shrink-0">
                            {expandedEntries.has(log.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </span>
                        </div>
                        
                        <h3 className="display-lg mb-1">{log.title}</h3>
                        
                        <p className={cn(
                          "text-sm text-muted-foreground mb-3",
                          !expandedEntries.has(log.id) && "line-clamp-2"
                        )}>
                          {log.description}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <p className="data-sm text-muted-foreground mb-1">TIME</p>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <p className="data-sm">{format(new Date(log.timestamp), 'MMM dd HH:mm:ss')}</p>
                            </div>
                          </div>
                          
                          {log.confidence !== undefined && (
                            <div>
                              <p className="data-sm text-muted-foreground mb-1">CONFIDENCE</p>
                              <div className="flex items-center gap-2">
                                <Progress value={log.confidence * 100} className="h-2 flex-1 max-w-[80px]" />
                                <span className="data-sm">{(log.confidence * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          )}
                          
                          {log.metadata?.guardrails_triggered?.length > 0 && (
                            <div>
                              <p className="data-sm text-muted-foreground mb-1">GUARDRAILS</p>
                              <p className="data-sm text-red-400">{log.metadata.guardrails_triggered.length} triggered</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Expandable Details */}
                        {expandedEntries.has(log.id) && renderExpandedDetails(log)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </section>

        {/* Footer */}
        <footer className="p-6 sm:p-8 text-center">
          <p className="display-lg mb-2 glow-text">M9 LOGBOOK</p>
          <p className="data-sm text-muted-foreground">
            FULL TRANSPARENCY · AUTONOMOUS DECISIONS
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Logbook;
