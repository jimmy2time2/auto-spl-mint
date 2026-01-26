import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import AsciiDivider from "@/components/AsciiDivider";
import { format } from "date-fns";

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'ai_decision' | 'governor_action' | 'token_launch' | 'profit_rebalance';
  title: string;
  description: string;
  confidence?: number;
  decision?: string;
  symbol: string;
  metadata?: any;
}

const Logbook = () => {
  const [combinedLogs, setCombinedLogs] = useState<LogEntry[]>([]);

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

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setCombinedLogs(logs);
  }, [aiLogs, governorLogs, protocolActivity]);

  const getDecisionClass = (decision?: string) => {
    if (!decision) return '';
    const classes: Record<string, string> = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      modified: 'bg-yellow-100 text-yellow-800',
      deferred: 'bg-gray-100 text-gray-800'
    };
    return classes[decision] || '';
  };

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
              {combinedLogs.length} ENTRIES
            </div>
          </div>
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
            <div className="data-lg">{protocolActivity?.filter((l: any) => l.activity_type === 'token_mint').length || 0}</div>
            <div className="data-sm text-muted-foreground">MINT</div>
          </div>
        </div>

        {/* ASCII Separator */}
        <AsciiDivider pattern="dot" text="ACTIVITY LOG" />

        {/* Log Entries */}
        <div className="divide-y divide-border">
          {combinedLogs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-2xl mb-2">○</div>
              <div className="data-sm text-muted-foreground">NO ACTIVITY YET</div>
              <div className="text-xs text-muted-foreground mt-1">AI Mind is initializing...</div>
            </div>
          ) : (
            combinedLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-secondary transition-colors">
                <div className="flex gap-4">
                  {/* Symbol */}
                  <div className="w-8 text-center shrink-0">
                    <span className="text-lg">{log.symbol}</span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="data-sm font-bold">{log.title}</span>
                      {log.decision && (
                        <span className={`data-sm px-1.5 py-0.5 ${getDecisionClass(log.decision)}`}>
                          {log.decision.toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {log.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{format(new Date(log.timestamp), 'MMM dd HH:mm:ss')}</span>
                      
                      {log.confidence !== undefined && (
                        <span className="border border-border px-1.5 py-0.5">
                          {(log.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                      
                      <span className="border border-border px-1.5 py-0.5 uppercase">
                        {log.type.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {log.metadata?.guardrails_triggered?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <div className="text-xs text-muted-foreground mb-1">GUARDRAILS:</div>
                        <div className="flex flex-wrap gap-1">
                          {log.metadata.guardrails_triggered.map((guardrail: string) => (
                            <span key={guardrail} className="text-xs px-1.5 py-0.5 bg-red-100 text-red-800">
                              {guardrail}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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
