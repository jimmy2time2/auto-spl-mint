import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AIHint {
  id: string;
  content: string;
  timestamp: string;
  ai_score?: number;
}

const PulseMeter = ({ strength = 5 }: { strength?: number }) => {
  return (
    <div className="flex items-end gap-0.5 h-8">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-foreground transition-all duration-300 ${
            i < strength ? "opacity-100" : "opacity-20"
          }`}
          style={{
            height: `${((i + 1) / 10) * 100}%`,
            animation: i < strength ? `pulse ${0.5 + i * 0.1}s ease-in-out infinite` : "none",
          }}
        />
      ))}
    </div>
  );
};

export function AIGovernorStatus() {
  const [hints, setHints] = useState<AIHint[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pulseStrength, setPulseStrength] = useState(5);

  useEffect(() => {
    fetchHints();
    
    const channel = supabase
      .channel("ai-hints-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "protocol_activity",
          filter: "activity_type=eq.AI_HINT",
        },
        () => fetchHints()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (hints.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % hints.length);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [hints.length]);

  const fetchHints = async () => {
    const { data } = await supabase
      .from("protocol_activity")
      .select("*")
      .eq("activity_type", "AI_HINT")
      .order("timestamp", { ascending: false })
      .limit(5);

    if (data) {
      const formatted = data.map((item) => ({
        id: item.id,
        content: item.description,
        timestamp: item.timestamp,
        ai_score: (item.metadata as any)?.ai_score || 5,
      }));
      setHints(formatted);
      if (formatted[0]?.ai_score) {
        setPulseStrength(Math.floor(formatted[0].ai_score));
      }
    }
  };

  if (hints.length === 0) return null;

  return (
    <div className="bg-dark-bg text-dark-text border-2 border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest">
          🧠 AI GOVERNOR STATUS
        </h2>
        <PulseMeter strength={pulseStrength} />
      </div>
      <div className="relative overflow-hidden">
        <p className="text-2xl font-bold font-mono glitch">
          {hints[currentIndex]?.content || "Initializing..."}
        </p>
        {hints.length > 1 && (
          <div className="flex gap-1 mt-4">
            {hints.map((_, i) => (
              <div
                key={i}
                className={`h-0.5 flex-1 ${
                  i === currentIndex ? "bg-foreground" : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
