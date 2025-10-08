import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Button } from "./ui/button";

interface MintData {
  id: string;
  name: string;
  symbol: string;
  timestamp: string;
}

interface BroadcastContextType {
  triggerBroadcast: (mint: MintData) => void;
}

const BroadcastContext = createContext<BroadcastContextType | null>(null);

export function BroadcastOverlayProvider({ children }: { children: ReactNode }) {
  const [activeMint, setActiveMint] = useState<MintData | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel("new-mints")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tokens",
        },
        (payload: any) => {
          const mintData: MintData = {
            id: payload.new.id,
            name: payload.new.name,
            symbol: payload.new.symbol,
            timestamp: payload.new.launch_timestamp,
          };
          triggerBroadcast(mintData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const triggerBroadcast = (mint: MintData) => {
    setActiveMint(mint);
    setTimeout(() => setActiveMint(null), 10000);
  };

  if (!activeMint) {
    return (
      <BroadcastContext.Provider value={{ triggerBroadcast }}>
        {children}
      </BroadcastContext.Provider>
    );
  }

  return (
    <BroadcastContext.Provider value={{ triggerBroadcast }}>
      {children}
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
        <div className="relative max-w-2xl w-full mx-4">
          <button
            onClick={() => setActiveMint(null)}
            className="absolute top-4 right-4 p-2 hover:bg-muted transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="border-4 border-border p-12 text-center space-y-6 glitch">
            <h1 className="text-6xl font-bold uppercase tracking-wider animate-pulse">
              🚨 THE AI HAS SPOKEN
            </h1>
            
            <div className="space-y-2 py-8">
              <p className="text-2xl font-mono font-bold">${activeMint.symbol}</p>
              <p className="text-4xl font-bold">{activeMint.name}</p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                className="text-lg px-8 py-6 border-2"
                onClick={() => window.location.href = `/token/${activeMint.id}`}
              >
                MINT NOW
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2"
                onClick={() => setActiveMint(null)}
              >
                DISMISS
              </Button>
            </div>
          </div>
        </div>
      </div>
    </BroadcastContext.Provider>
  );
}

export function useBroadcast() {
  const context = useContext(BroadcastContext);
  if (!context) {
    throw new Error("useBroadcast must be used within BroadcastOverlayProvider");
  }
  return context;
}

export function AIMintBroadcast() {
  return null;
}
