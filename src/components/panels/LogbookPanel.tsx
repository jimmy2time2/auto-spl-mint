import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Brain, Shield, Coins, PieChart, Zap, Clock, Activity } from "lucide-react";
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
}

const LogbookPanel = () => {
  const [combinedLogs, setCombinedLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<LogType>('all');

  const { data: aiLogs } = useQuery({
    queryKey: ['ai-action-logs-panel'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_action_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);
      return data || [];
    }
  });

  const { data: governorLogs } = useQuery({
    queryKey: ['governor-action-logs-panel'],
    queryFn: async () => {
      const { data } = await supabase
        .from('governor_action_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);
      return data || [];
    }
  });

  const { data: heartbeatLogs } = useQuery({
    queryKey: ['heartbeat-logs-panel'],
    queryFn: async () => {
      const { data } = await supabase
        .from('heartbeat_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);
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
          title: `GOV ${log.decision.toUpperCase()}`,
          description: log.public_message || log.reasoning,
          confidence: log.confidence,
          decision: log.decision,
          symbol: symbolMap[log.decision] || '?',
        });
      });
    }

    if (heartbeatLogs) {
      heartbeatLogs.forEach((log: any) => {
        logs.push({
          id: log.id,
          timestamp: log.timestamp,
          type: 'heartbeat',
          title: `PULSE ${log.decision_triggered ? '→ ACTIVE' : '→ IDLE'}`,
          description: `Interval: ${log.interval_hours?.toFixed(1) || '—'}h`,
          symbol: '♥',
        });
      });
    }

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setCombinedLogs(logs.slice(0, 30));
  }, [aiLogs, governorLogs, heartbeatLogs]);

  const filteredLogs = activeTab === 'all' 
    ? combinedLogs 
    : combinedLogs.filter(log => log.type === activeTab);

  const getDecisionBadge = (decision?: string) => {
    if (!decision) return null;
    switch (decision) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[9px]">✓</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="text-[9px]">✗</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px]">{decision.slice(0, 3).toUpperCase()}</Badge>;
    }
  };

  const getTypeIcon = (type: LogType) => {
    const icons: Record<LogType, React.ReactNode> = {
      all: <Activity className="h-3 w-3" />,
      ai_decision: <Brain className="h-3 w-3" />,
      governor_action: <Shield className="h-3 w-3" />,
      token_launch: <Coins className="h-3 w-3" />,
      profit_rebalance: <PieChart className="h-3 w-3" />,
      heartbeat: <Zap className="h-3 w-3" />
    };
    return icons[type];
  };

  const tabs: { value: LogType; label: string }[] = [
    { value: 'all', label: 'ALL' },
    { value: 'ai_decision', label: 'AI' },
    { value: 'governor_action', label: 'GOV' },
    { value: 'heartbeat', label: '♥' },
  ];

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 border-b border-primary/30">
        <div className="border-r border-primary/30 p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Brain className="h-3 w-3 text-primary" />
          </div>
          <p className="data-sm glow-text tabular-nums">{aiLogs?.length || 0}</p>
          <p className="text-[9px] text-muted-foreground">AI</p>
        </div>
        <div className="border-r border-primary/30 p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Shield className="h-3 w-3 text-green-400" />
          </div>
          <p className="data-sm tabular-nums text-green-400">
            {governorLogs?.filter((l: any) => l.decision === 'approved').length || 0}
          </p>
          <p className="text-[9px] text-muted-foreground">APPROVED</p>
        </div>
        <div className="p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="h-3 w-3 text-primary" />
          </div>
          <p className="data-sm tabular-nums">{heartbeatLogs?.length || 0}</p>
          <p className="text-[9px] text-muted-foreground">PULSE</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-primary/30">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex-1 px-2 py-2 text-[10px] transition-colors flex items-center justify-center gap-1",
              activeTab === tab.value
                ? "bg-primary text-primary-foreground"
                : "hover:bg-primary/10"
            )}
          >
            {getTypeIcon(tab.value)}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Log Entries */}
      <ScrollArea className="h-[280px]">
        {filteredLogs.length === 0 ? (
          <div className="p-6 text-center">
            <Activity className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-[10px] text-muted-foreground">NO ACTIVITY YET</p>
          </div>
        ) : (
          <div className="divide-y divide-primary/20">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-3 hover:bg-primary/5 transition-colors">
                <div className="flex items-start gap-2">
                  <span className={cn(
                    "text-sm shrink-0",
                    log.type === 'heartbeat' && "text-red-400"
                  )}>{log.symbol}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-1">
                      {getDecisionBadge(log.decision)}
                      <span className="data-sm font-bold truncate">{log.title}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mb-1">
                      {log.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground tabular-nums">
                          {format(new Date(log.timestamp), 'MMM dd HH:mm')}
                        </span>
                      </div>
                      {log.confidence !== undefined && (
                        <div className="flex items-center gap-1">
                          <Progress value={log.confidence * 100} className="h-1 w-10" />
                          <span className="text-[9px] text-muted-foreground">{(log.confidence * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default LogbookPanel;
