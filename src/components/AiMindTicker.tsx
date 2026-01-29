import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface HintData {
  id: string;
  text: string;
  type: "timing" | "sentiment" | "activity" | "signal" | "status";
}

const AiMindTicker = () => {
  const [hints, setHints] = useState<HintData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHints = async () => {
    const newHints: HintData[] = [];

    // Fetch next heartbeat timing
    const { data: heartbeatData } = await supabase
      .from("heartbeat_log")
      .select("next_heartbeat_at, entropy_factor")
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    if (heartbeatData?.next_heartbeat_at) {
      const nextTime = new Date(heartbeatData.next_heartbeat_at);
      const timeUntil = formatDistanceToNow(nextTime, { addSuffix: true });
      newHints.push({
        id: "next-heartbeat",
        text: `NEXT_PULSE: ${timeUntil.toUpperCase()}`,
        type: "timing"
      });
      newHints.push({
        id: "entropy",
        text: `ENTROPY_LVL: ${(heartbeatData.entropy_factor * 100).toFixed(0)}%`,
        type: "signal"
      });
    }

    // Fetch latest market sentiment
    const { data: sentimentData } = await supabase
      .from("market_sentiment")
      .select("sentiment_score, recommendation, confidence")
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    if (sentimentData) {
      const sentimentLabel = sentimentData.sentiment_score > 0.6 ? "BULLISH" : 
                             sentimentData.sentiment_score < 0.4 ? "BEARISH" : "NEUTRAL";
      newHints.push({
        id: "sentiment",
        text: `MARKET_MOOD: ${sentimentLabel}`,
        type: "sentiment"
      });
      newHints.push({
        id: "confidence",
        text: `AI_CONFIDENCE: ${(sentimentData.confidence * 100).toFixed(0)}%`,
        type: "signal"
      });
    }

    // Fetch latest AI decision
    const { data: decisionData } = await supabase
      .from("token_decision_log")
      .select("decision, confidence, token_theme, timestamp")
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    if (decisionData) {
      const timeSince = formatDistanceToNow(new Date(decisionData.timestamp), { addSuffix: true });
      newHints.push({
        id: "last-decision",
        text: `LAST_DECISION: ${decisionData.decision.toUpperCase()} ${timeSince.toUpperCase()}`,
        type: "activity"
      });
      if (decisionData.token_theme) {
        newHints.push({
          id: "theme-hint",
          text: `THEME_DETECTED: ${decisionData.token_theme.toUpperCase().slice(0, 20)}`,
          type: "signal"
        });
      }
    }

    // Fetch AI mood state
    const { data: moodData } = await supabase
      .from("ai_mood_state")
      .select("current_mood, mood_intensity, decision_count")
      .order("last_mood_change", { ascending: false })
      .limit(1)
      .single();

    if (moodData) {
      newHints.push({
        id: "ai-mood",
        text: `M9_MOOD: ${moodData.current_mood.toUpperCase()}`,
        type: "status"
      });
      newHints.push({
        id: "intensity",
        text: `INTENSITY: ${(moodData.mood_intensity * 100).toFixed(0)}%`,
        type: "signal"
      });
    }

    // Fetch recent governor action
    const { data: governorData } = await supabase
      .from("governor_action_log")
      .select("action_type, public_message, timestamp")
      .eq("published", true)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    if (governorData?.public_message) {
      newHints.push({
        id: "gov-message",
        text: `GOV_SAYS: ${governorData.public_message.toUpperCase().slice(0, 30)}`,
        type: "activity"
      });
    }

    // Add some static hints if we don't have enough data
    if (newHints.length < 4) {
      const fallbackHints = [
        { id: "scan-1", text: "SCANNING_MARKETS", type: "status" as const },
        { id: "scan-2", text: "ANALYZING_TRENDS", type: "activity" as const },
        { id: "scan-3", text: "MONITORING_SENTIMENT", type: "signal" as const },
        { id: "scan-4", text: "AWAITING_TRIGGER", type: "timing" as const }
      ];
      newHints.push(...fallbackHints.slice(0, 4 - newHints.length));
    }

    setHints(newHints);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchHints();

    // Refresh hints every 30 seconds
    const interval = setInterval(fetchHints, 30000);

    // Subscribe to realtime updates
    const channel = supabase
      .channel("ai-hints-ticker")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "heartbeat_log" },
        () => fetchHints()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "token_decision_log" },
        () => fetchHints()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_mood_state" },
        () => fetchHints()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const getTypeColor = (type: HintData["type"]) => {
    switch (type) {
      case "timing": return "text-chart-1";
      case "sentiment": return "text-chart-2";
      case "activity": return "text-chart-3";
      case "signal": return "text-chart-4";
      case "status": return "text-primary";
      default: return "text-primary";
    }
  };

  const displayHints = hints.length > 0 ? hints : [
    { id: "init", text: "INITIALIZING_M9", type: "status" as const }
  ];

  return (
    <div className="border-b-2 border-primary overflow-hidden bg-muted/50 backdrop-blur-sm">
      <div className="ticker-wrapper">
        <div className="ticker-content py-2">
          {displayHints.map((hint) => (
            <span key={hint.id} className="ticker-item data-sm">
              <span className={`${getTypeColor(hint.type)} animate-pulse`}>●</span>
              <span className={`ml-2 font-mono tracking-wider ${getTypeColor(hint.type)}`}>
                {hint.text}
              </span>
              <span className="mx-6 text-primary/30">|</span>
            </span>
          ))}
          {displayHints.map((hint) => (
            <span key={`dup-${hint.id}`} className="ticker-item data-sm">
              <span className={`${getTypeColor(hint.type)} animate-pulse`}>●</span>
              <span className={`ml-2 font-mono tracking-wider ${getTypeColor(hint.type)}`}>
                {hint.text}
              </span>
              <span className="mx-6 text-primary/30">|</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AiMindTicker;
