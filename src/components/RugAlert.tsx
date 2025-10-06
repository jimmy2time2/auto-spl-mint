import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RugEvent {
  wallet_address: string;
  token_id: string;
  percentage: number;
  timestamp: string;
}

export const RugAlert = () => {
  const [alerts, setAlerts] = useState<RugEvent[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    fetchAlerts();

    // Real-time whale detection
    const channel = supabase
      .channel('whale-alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'protocol_activity',
        filter: 'activity_type=eq.whale_detected'
      }, (payload) => {
        const metadata = payload.new.metadata as any;
        if (metadata?.type === 'sell' && metadata?.percentageOfSupply > 50) {
          const newAlert: RugEvent = {
            wallet_address: metadata.wallet,
            token_id: metadata.tokenId,
            percentage: metadata.percentageOfSupply,
            timestamp: new Date().toISOString()
          };
          setAlerts(prev => [newAlert, ...prev].slice(0, 3));
          setVisible(true);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlerts = async () => {
    const { data } = await supabase
      .from('protocol_activity')
      .select('metadata, timestamp')
      .eq('activity_type', 'whale_detected')
      .order('timestamp', { ascending: false })
      .limit(3);

    if (data) {
      const recentAlerts = data
        .filter(d => {
          const meta = d.metadata as any;
          return meta?.type === 'sell' && meta?.percentageOfSupply > 50;
        })
        .map(d => {
          const meta = d.metadata as any;
          return {
            wallet_address: meta.wallet,
            token_id: meta.tokenId,
            percentage: meta.percentageOfSupply,
            timestamp: d.timestamp
          };
        });

      if (recentAlerts.length > 0) {
        setAlerts(recentAlerts);
      }
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (!visible || alerts.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-destructive border-b-2 border-destructive-foreground"
      >
        <div className="ticker-wrapper">
          <div className="ticker-content">
            {alerts.map((alert, idx) => (
              <div key={idx} className="ticker-item px-8 py-3 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive-foreground flex-shrink-0" />
                <span className="font-orbitron text-destructive-foreground">
                  ⚠️ LARGE HOLDER JUST DUMPED
                </span>
                <span className="font-mono text-destructive-foreground/80">
                  {shortenAddress(alert.wallet_address)}
                </span>
                <span className="font-orbitron text-destructive-foreground">
                  SOLD {alert.percentage.toFixed(0)}%
                </span>
                <span className="mx-4 text-destructive-foreground/40">|</span>
              </div>
            ))}
            {/* Duplicate for seamless loop */}
            {alerts.map((alert, idx) => (
              <div key={`dup-${idx}`} className="ticker-item px-8 py-3 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive-foreground flex-shrink-0" />
                <span className="font-orbitron text-destructive-foreground">
                  ⚠️ LARGE HOLDER JUST DUMPED
                </span>
                <span className="font-mono text-destructive-foreground/80">
                  {shortenAddress(alert.wallet_address)}
                </span>
                <span className="font-orbitron text-destructive-foreground">
                  SOLD {alert.percentage.toFixed(0)}%
                </span>
                <span className="mx-4 text-destructive-foreground/40">|</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setVisible(false)}
          className="absolute top-2 right-2 p-1 hover:bg-destructive-foreground/20 rounded"
        >
          <X className="w-4 h-4 text-destructive-foreground" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
