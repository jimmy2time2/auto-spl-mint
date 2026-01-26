import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import AsciiDivider from "@/components/AsciiDivider";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronRight, Activity, Brain, Shield, Coins, PieChart, Zap } from "lucide-react";
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
  const [combinedLogs, setCombinedLogs] = useState<LogEntry[]>([]);
  const [activeFilter, setActiveFilter] = useState<LogType>('all');
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const { data: aiLogs } = useQuery({
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

  const { data: governorLogs } = useQuery({
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

  const { data: protocolActivity } = useQuery({
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

  const { data: heartbeatLogs } = useQuery({
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

  const filteredLogs = activeFilter === 'all' 
    ? combinedLogs 
    : combinedLogs.filter(log => log.type === activeFilter);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedEntries(newExpanded);
  };

  const getDecisionClass = (decision?: string) => {
    if (!decision) return '';
    const classes: Record<string, string> = {
      approved: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      modified: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      deferred: 'bg-muted text-muted-foreground border-border'
    };
    return classes[decision] || '';
  };

  const getTypeIcon = (type: LogType) => {
    const icons: Record<LogType, React.ReactNode> = {
      all: <Activity size={14} />,
      ai_decision: <Brain size={14} />,
      governor_action: <Shield size={14} />,
      token_launch: <Coins size={14} />,
      profit_rebalance: <PieChart size={14} />,
      heartbeat: <Zap size={14} />
    };
    return icons[type];
  };

  const renderMarketSignals = (signals: any) => {
    if (!signals) return null;
    return (
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Market Signals</div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(signals).map(([key, value]) => (
            <div key={key} className="flex justify-between border border-border px-2 py-1">
              <span className="text-xs text-muted-foreground">{key.replace(/_/g, ' ')}</span>
              <span className="text-xs font-mono">
                {typeof value === 'number' ? value.toFixed(2) : String(value)}
              </span>
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
      <div className="mt-3 pt-3 border-t border-border space-y-4 animate-in slide-in-from-top-2">
        {/* Full Reasoning */}
        {metadata.reasoning && (
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Full Reasoning</div>
            <p className="text-sm bg-secondary/50 p-2 rounded">{metadata.reasoning}</p>
          </div>
        )}

        {/* Market Signals */}
        {metadata.market_signals && renderMarketSignals(metadata.market_signals)}

        {/* Input Data for AI decisions */}
        {type === 'ai_decision' && metadata.input_data && (
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Input Data</div>
            <pre className="text-xs bg-secondary/50 p-2 rounded overflow-x-auto font-mono">
              {JSON.stringify(metadata.input_data, null, 2)}
            </pre>
          </div>
        )}

        {/* Execution Result */}
        {metadata.execution_result && (
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Execution Result</div>
            <pre className="text-xs bg-secondary/50 p-2 rounded overflow-x-auto font-mono">
              {JSON.stringify(metadata.execution_result, null, 2)}
            </pre>
          </div>
        )}

        {/* Heartbeat specific details */}
        {type === 'heartbeat' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="border border-border p-2 text-center">
              <div className="text-lg font-mono">{metadata.interval_hours}h</div>
              <div className="text-xs text-muted-foreground">Interval</div>
            </div>
            <div className="border border-border p-2 text-center">
              <div className="text-lg font-mono">{(metadata.entropy_factor * 100).toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Entropy</div>
            </div>
            {metadata.market_activity_score !== null && (
              <div className="border border-border p-2 text-center">
                <div className="text-lg font-mono">{metadata.market_activity_score?.toFixed(1) || '—'}</div>
                <div className="text-xs text-muted-foreground">Activity</div>
              </div>
            )}
            {metadata.time_of_day_factor !== null && (
              <div className="border border-border p-2 text-center">
                <div className="text-lg font-mono">{metadata.time_of_day_factor?.toFixed(2) || '—'}</div>
                <div className="text-xs text-muted-foreground">Time Factor</div>
              </div>
            )}
          </div>
        )}

        {/* Governor specific: Guardrails */}
        {type === 'governor_action' && metadata.guardrails_triggered?.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Guardrails Triggered</div>
            <div className="flex flex-wrap gap-1">
              {metadata.guardrails_triggered.map((guardrail: string) => (
                <span key={guardrail} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                  {guardrail}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Governor specific: Original vs Modified */}
        {type === 'governor_action' && metadata.original_value && metadata.modified_value && (
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Original</div>
              <pre className="text-xs bg-red-500/10 border border-red-500/20 p-2 rounded overflow-x-auto font-mono">
                {JSON.stringify(metadata.original_value, null, 2)}
              </pre>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Modified</div>
              <pre className="text-xs bg-green-500/10 border border-green-500/20 p-2 rounded overflow-x-auto font-mono">
                {JSON.stringify(metadata.modified_value, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Token/Protocol activity metadata */}
        {(type === 'token_launch' || type === 'profit_rebalance') && metadata.metadata && (
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Details</div>
            <pre className="text-xs bg-secondary/50 p-2 rounded overflow-x-auto font-mono">
              {JSON.stringify(metadata.metadata, null, 2)}
            </pre>
          </div>
        )}

        {/* Next heartbeat */}
        {type === 'heartbeat' && metadata.next_heartbeat_at && (
          <div className="text-xs text-muted-foreground">
            Next wake: {format(new Date(metadata.next_heartbeat_at), 'MMM dd HH:mm:ss')}
          </div>
        )}
      </div>
    );
  };

  const filterTabs: { value: LogType; label: string; count: number }[] = [
    { value: 'all', label: 'ALL', count: combinedLogs.length },
    { value: 'ai_decision', label: 'AI', count: aiLogs?.length || 0 },
    { value: 'governor_action', label: 'GOV', count: governorLogs?.length || 0 },
    { value: 'token_launch', label: 'MINT', count: protocolActivity?.filter((l: any) => l.activity_type === 'token_mint').length || 0 },
    { value: 'profit_rebalance', label: 'ALLOC', count: protocolActivity?.filter((l: any) => l.activity_type !== 'token_mint').length || 0 },
    { value: 'heartbeat', label: 'PULSE', count: heartbeatLogs?.length || 0 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b border-border px-4 py-3 bg-muted">
          <div className="flex items-center justify-between">
            <div>
              <div className="data-sm">AI LOGBOOK</div>
              <div className="text-xs text-muted-foreground">All decisions, actions, and events</div>
            </div>
            <div className="data-sm text-muted-foreground">
              {filteredLogs.length} ENTRIES
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="border-b border-border bg-secondary/30 overflow-x-auto">
          <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as LogType)}>
            <TabsList className="w-full justify-start bg-transparent rounded-none h-auto p-0">
              {filterTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent",
                    "flex items-center gap-2 text-xs"
                  )}
                >
                  {getTypeIcon(tab.value)}
                  <span>{tab.label}</span>
                  <span className="text-muted-foreground">({tab.count})</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 border-b border-border">
          <div className="border-r border-border p-3 text-center">
            <div className="data-lg">{aiLogs?.length || 0}</div>
            <div className="data-sm text-muted-foreground">AI</div>
          </div>
          <div className="border-r border-border p-3 text-center">
            <div className="data-lg">{governorLogs?.filter((l: any) => l.decision === 'approved').length || 0}</div>
            <div className="data-sm text-muted-foreground">OK</div>
          </div>
          <div className="border-r border-border p-3 text-center">
            <div className="data-lg">{governorLogs?.filter((l: any) => l.decision === 'rejected').length || 0}</div>
            <div className="data-sm text-muted-foreground">DENY</div>
          </div>
          <div className="p-3 text-center">
            <div className="data-lg">{heartbeatLogs?.length || 0}</div>
            <div className="data-sm text-muted-foreground">PULSE</div>
          </div>
        </div>

        {/* ASCII Separator */}
        <AsciiDivider pattern="dot" text="ACTIVITY LOG" />

        {/* Log Entries */}
        <div className="divide-y divide-border">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-2xl mb-2">○</div>
              <div className="data-sm text-muted-foreground">NO ACTIVITY YET</div>
              <div className="text-xs text-muted-foreground mt-1">AI Mind is initializing...</div>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() => toggleExpand(log.id)}
              >
                <div className="flex gap-4">
                  {/* Symbol + Expand indicator */}
                  <div className="w-8 text-center shrink-0 flex flex-col items-center">
                    <span className={cn(
                      "text-lg",
                      log.type === 'heartbeat' && "text-red-400 animate-pulse"
                    )}>{log.symbol}</span>
                    <span className="mt-1 text-muted-foreground">
                      {expandedEntries.has(log.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="data-sm font-bold">{log.title}</span>
                      {log.decision && (
                        <span className={`data-sm px-1.5 py-0.5 border ${getDecisionClass(log.decision)}`}>
                          {log.decision.toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <p className={cn(
                      "text-xs text-muted-foreground mb-2",
                      !expandedEntries.has(log.id) && "line-clamp-2"
                    )}>
                      {log.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{format(new Date(log.timestamp), 'MMM dd HH:mm:ss')}</span>
                      
                      {log.confidence !== undefined && (
                        <span className="flex items-center gap-1.5 border border-border px-1.5 py-0.5">
                          <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${log.confidence * 100}%` }}
                            />
                          </div>
                          <span>{(log.confidence * 100).toFixed(0)}%</span>
                        </span>
                      )}
                      
                      <span className="border border-border px-1.5 py-0.5 uppercase flex items-center gap-1">
                        {getTypeIcon(log.type)}
                        {log.type.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {/* Expandable Details */}
                    {expandedEntries.has(log.id) && renderExpandedDetails(log)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer ASCII */}
        <div className="p-3 text-center">
          <div className="data-sm text-muted-foreground opacity-50">
            ···································································
          </div>
        </div>
      </main>
    </div>
  );
};

export default Logbook;
