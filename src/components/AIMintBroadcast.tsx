import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface MintEvent {
  tokenId: string;
  name: string;
  symbol: string;
  emoji?: string;
}

export const AIMintBroadcast = () => {
  const [show, setShow] = useState(false);
  const [mintEvent, setMintEvent] = useState<MintEvent | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Subscribe to new token mints
    const channel = supabase
      .channel('token-mints')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tokens'
      }, (payload) => {
        const newToken = payload.new as any;
        setMintEvent({
          tokenId: newToken.id,
          name: newToken.name,
          symbol: newToken.symbol,
          emoji: '🧠'
        });
        setShow(true);

        // Auto-hide after 10 seconds
        setTimeout(() => setShow(false), 10000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleMintNow = () => {
    if (mintEvent) {
      navigate(`/token/${mintEvent.tokenId}`);
      setShow(false);
    }
  };

  return (
    <AnimatePresence>
      {show && mintEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
          onClick={() => setShow(false)}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ 
              scale: 1, 
              y: 0,
              rotate: [0, -1, 1, -1, 0],
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ 
              duration: 0.5,
              rotate: {
                duration: 0.3,
                repeat: 3
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full mx-4"
          >
            {/* Glowing border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary blur-xl opacity-50" />
            
            <div className="relative bg-card border-4 border-primary p-12 text-center">
              {/* Sparkles animation */}
              <motion.div
                animate={{
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity }
                }}
                className="absolute -top-6 -right-6"
              >
                <Sparkles className="w-12 h-12 text-secondary" />
              </motion.div>

              <motion.div
                animate={{
                  rotate: -360,
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity }
                }}
                className="absolute -bottom-6 -left-6"
              >
                <Sparkles className="w-12 h-12 text-primary" />
              </motion.div>

              {/* Content */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="mb-4"
              >
                <Zap className="w-20 h-20 mx-auto text-primary" />
              </motion.div>

              <motion.h2
                className="text-5xl font-orbitron text-primary text-glow mb-6 glitch"
                animate={{ opacity: [1, 0.8, 1] }}
                transition={{ duration: 0.3, repeat: Infinity }}
              >
                🚨 THE AI HAS SPOKEN
              </motion.h2>

              <div className="space-y-4 mb-8">
                <div className="text-xl text-muted-foreground font-mono">
                  NEW TOKEN DETECTED
                </div>
                
                <div className="text-6xl font-orbitron text-foreground">
                  {mintEvent.emoji} {mintEvent.name}
                </div>
                
                <div className="text-3xl font-mono text-secondary">
                  ${mintEvent.symbol}
                </div>
              </div>

              <Button
                size="lg"
                className="text-xl px-12 py-6 font-orbitron bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleMintNow}
              >
                VIEW TOKEN NOW
              </Button>

              <button
                onClick={() => setShow(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const X = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);
