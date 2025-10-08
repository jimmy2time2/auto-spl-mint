import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AIHint {
  hint: string;
  timestamp: string;
  aiScore?: number;
}

export const AIGovernorStatus = () => {
  const [hints, setHints] = useState<AIHint[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [aiScore, setAIScore] = useState(0);

  useEffect(() => {
    fetchHints();
    
    // Subscribe to new hints
    const channel = supabase
      .channel('ai-hints')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'protocol_activity',
        filter: 'activity_type=eq.ai_clue_broadcast'
      }, () => {
        fetchHints();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (hints.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % hints.length);
      }, 30000); // Rotate every 30 seconds

      return () => clearInterval(interval);
    }
  }, [hints.length]);

  const fetchHints = async () => {
    const { data: clues } = await supabase
      .from('protocol_activity')
      .select('description, timestamp, metadata')
      .eq('activity_type', 'ai_clue_broadcast')
      .order('timestamp', { ascending: false })
      .limit(5);

    if (clues) {
      setHints(clues.map(c => ({
        hint: c.description,
        timestamp: c.timestamp,
        aiScore: (c.metadata as any)?.aiScore
      })));
    }

    // Get latest AI score
    const { data: decision } = await supabase
      .from('logs')
      .select('details')
      .eq('action', 'AI_MIND_DECISION')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (decision?.details) {
      setAIScore((decision.details as any).aiScore || 0);
    }
  };

  const currentHint = hints[currentIndex] || {
    hint: "The AI Mind observes...",
    timestamp: new Date().toISOString()
  };

  return (
    <div className="relative overflow-hidden border-2 border-primary bg-card">
      {/* Glitch overlay */}
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
      
      <div className="relative p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary pulse-glow" />
            <h2 className="text-2xl font-orbitron text-primary text-glow">
              AI MIND
            </h2>
          </div>

          {/* AI Pulse Meter */}
          <AIPulseMeter score={aiScore} />
        </div>

        {/* Hint Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-mono text-foreground leading-relaxed"
          >
            <span className="text-glow">{currentHint.hint}</span>
            <span className="cursor-blink text-primary">_</span>
          </motion.div>
        </AnimatePresence>

        {/* Hint Counter */}
        {hints.length > 1 && (
          <div className="mt-4 flex gap-2">
            {hints.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 transition-all ${
                  idx === currentIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AIPulseMeter = ({ score }: { score: number }) => {
  const bars = 10;
  const activeBars = Math.min(bars, Math.ceil((score / 10) * bars));

  return (
    <div className="flex items-center gap-2">
      <Zap className="w-4 h-4 text-primary" />
      <div className="flex gap-1">
        {Array.from({ length: bars }).map((_, idx) => (
          <motion.div
            key={idx}
            className={`w-1 h-8 ${
              idx < activeBars
                ? idx < bars * 0.7
                  ? 'bg-primary'
                  : 'bg-secondary'
                : 'bg-muted'
            }`}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: idx < activeBars ? 1 : 0.3 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground font-orbitron">
        {score.toFixed(1)}/10
      </span>
    </div>
  );
};
