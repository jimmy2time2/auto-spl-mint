import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Shield, 
  Coins, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Clock,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'ai_decision' | 'governor_action' | 'token_launch' | 'profit_rebalance';
  title: string;
  description: string;
  confidence?: number;
  decision?: string;
  icon: any;
  color: string;
  metadata?: any;
}

const Logbook = () => {
  const [combinedLogs, setCombinedLogs] = useState<LogEntry[]>([]);

  // Query AI action logs
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

  // Query governor action logs
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

  // Query protocol activity for token launches and profit events
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

  // Combine and format all logs
  useEffect(() => {
    const logs: LogEntry[] = [];

    // Process AI logs
    if (aiLogs) {
      aiLogs.forEach((log: any) => {
        logs.push({
          id: log.id,
          timestamp: log.timestamp,
          type: 'ai_decision',
          title: `AI ${log.action.toUpperCase()}`,
          description: log.reasoning || 'AI made a decision',
          confidence: log.confidence,
          icon: Brain,
          color: 'text-purple-500',
          metadata: log
        });
      });
    }

    // Process governor logs
    if (governorLogs) {
      governorLogs.forEach((log: any) => {
        const isApproved = log.decision === 'approved';
        const isRejected = log.decision === 'rejected';
        
        logs.push({
          id: log.id,
          timestamp: log.timestamp,
          type: 'governor_action',
          title: `Governor ${log.decision.toUpperCase()}: ${log.action_type}`,
          description: log.public_message || log.reasoning,
          confidence: log.confidence,
          decision: log.decision,
          icon: Shield,
          color: isApproved ? 'text-green-500' : isRejected ? 'text-red-500' : 'text-yellow-500',
          metadata: log
        });
      });
    }

    // Process protocol activity
    if (protocolActivity) {
      protocolActivity.forEach((log: any) => {
        if (log.activity_type === 'token_mint') {
          logs.push({
            id: log.id,
            timestamp: log.timestamp,
            type: 'token_launch',
            title: '🚀 NEW TOKEN LAUNCHED',
            description: log.description,
            icon: Sparkles,
            color: 'text-cyan-500',
            metadata: log
          });
        } else if (log.activity_type === 'allocation_proposal' || log.activity_type === 'allocation_analysis') {
          logs.push({
            id: log.id,
            timestamp: log.timestamp,
            type: 'profit_rebalance',
            title: '💰 PROFIT ALLOCATION UPDATE',
            description: log.description,
            icon: Coins,
            color: 'text-amber-500',
            metadata: log
          });
        }
      });
    }

    // Sort by timestamp
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setCombinedLogs(logs);
  }, [aiLogs, governorLogs, protocolActivity]);

  const getDecisionBadge = (decision?: string) => {
    if (!decision) return null;

    const variants = {
      approved: { color: 'bg-green-500/20 text-green-500 border-green-500', icon: CheckCircle2 },
      rejected: { color: 'bg-red-500/20 text-red-500 border-red-500', icon: XCircle },
      modified: { color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500', icon: AlertTriangle },
      deferred: { color: 'bg-gray-500/20 text-gray-500 border-gray-500', icon: Clock }
    };

    const variant = variants[decision as keyof typeof variants];
    if (!variant) return null;

    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} border-2 font-bold uppercase text-xs`}>
        <Icon className="w-3 h-3 mr-1" />
        {decision}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 border-l-4 border-primary pl-4">
            AI LOGBOOK
          </h1>
          <p className="text-muted-foreground pl-4 text-sm md:text-base">
            Real-time transparency into every AI decision, governor override, and system event
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

          <div className="space-y-6">
            {combinedLogs.length === 0 ? (
              <Card className="border-2 border-border p-8 text-center">
                <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No activity yet. The AI Mind is initializing...</p>
              </Card>
            ) : (
              combinedLogs.map((log) => {
                const Icon = log.icon;
                
                return (
                  <div key={log.id} className="relative pl-0 md:pl-16">
                    {/* Timeline dot */}
                    <div className="absolute left-4 top-6 w-4 h-4 rounded-full bg-primary border-2 border-background hidden md:block" />
                    
                    <Card className="border-2 border-border hover:border-primary transition-all group">
                      <div className="p-4 md:p-6">
                        <div className="flex items-start gap-4">
                          <div className={`${log.color} shrink-0`}>
                            <Icon className="w-6 h-6 md:w-8 md:h-8" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-bold text-sm md:text-base uppercase break-words">
                                {log.title}
                              </h3>
                              <div className="flex items-center gap-2 shrink-0">
                                {getDecisionBadge(log.decision)}
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-3 break-words">
                              {log.description}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-3 text-xs">
                              <span className="text-muted-foreground">
                                {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                              </span>
                              
                              {log.confidence !== undefined && (
                                <Badge variant="outline" className="border-primary/50">
                                  {(log.confidence * 100).toFixed(0)}% confidence
                                </Badge>
                              )}
                              
                              <Badge variant="outline" className="uppercase text-[10px]">
                                {log.type.replace('_', ' ')}
                              </Badge>
                            </div>
                            
                            {/* Additional metadata display */}
                            {log.metadata?.guardrails_triggered && log.metadata.guardrails_triggered.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-xs text-muted-foreground mb-1">Guardrails Triggered:</p>
                                <div className="flex flex-wrap gap-1">
                                  {log.metadata.guardrails_triggered.map((guardrail: string) => (
                                    <Badge key={guardrail} className="bg-red-500/10 text-red-500 border-red-500/30 text-[10px]">
                                      {guardrail}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-2 border-border p-4 text-center">
            <Brain className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">
              {aiLogs?.length || 0}
            </p>
            <p className="text-xs text-muted-foreground uppercase">AI Decisions</p>
          </Card>
          
          <Card className="border-2 border-border p-4 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">
              {governorLogs?.filter((l: any) => l.decision === 'approved').length || 0}
            </p>
            <p className="text-xs text-muted-foreground uppercase">Approved</p>
          </Card>
          
          <Card className="border-2 border-border p-4 text-center">
            <XCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
            <p className="text-2xl font-bold">
              {governorLogs?.filter((l: any) => l.decision === 'rejected').length || 0}
            </p>
            <p className="text-xs text-muted-foreground uppercase">Rejected</p>
          </Card>
          
          <Card className="border-2 border-border p-4 text-center">
            <Sparkles className="w-6 h-6 mx-auto mb-2 text-cyan-500" />
            <p className="text-2xl font-bold">
              {protocolActivity?.filter((l: any) => l.activity_type === 'token_mint').length || 0}
            </p>
            <p className="text-xs text-muted-foreground uppercase">Tokens</p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Logbook;
