import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { Trophy, Sparkles, HelpCircle } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface LuckySelection {
  wallet_address: string;
  distribution_amount: number;
  selection_timestamp: string;
  token_id: string;
}

export const LuckyWallet = () => {
  const [selections, setSelections] = useState<LuckySelection[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    fetchSelections();

    // Real-time subscription for new winners
    const channel = supabase
      .channel('lucky-selections')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'lucky_wallet_selections'
      }, () => {
        setShowConfetti(true);
        fetchSelections();
        setTimeout(() => setShowConfetti(false), 5000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSelections = async () => {
    const { data } = await supabase
      .from('lucky_wallet_selections')
      .select('*')
      .order('selection_timestamp', { ascending: false })
      .limit(5);

    if (data) {
      setSelections(data as LuckySelection[]);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K`;
    return amount.toFixed(0);
  };

  const getMostRecentTime = (timestamp: string) => {
    const ms = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          colors={['#FFF200', '#FF77B7', '#FFFFFF']}
        />
      )}

      <Card className="p-6 bg-card border-2 border-secondary">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-secondary" />
            <h2 className="text-3xl font-orbitron text-secondary text-glow">
              LUCKY WALLET
            </h2>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <HelpCircle className="w-4 h-4" />
                How it works
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-2 border-secondary">
              <DialogHeader>
                <DialogTitle className="text-2xl font-orbitron text-secondary">
                  Lucky Wallet System
                </DialogTitle>
                <DialogDescription className="text-base space-y-3 mt-4">
                  <p className="text-foreground">
                    3% of all new token supply is randomly awarded to a recent minter.
                  </p>
                  <p className="text-foreground">
                    The more you participate, the higher your chances.
                  </p>
                  <p className="text-secondary font-bold">
                    You could be next. 🎰
                  </p>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {selections.map((selection, idx) => (
            <motion.div
              key={selection.wallet_address + selection.selection_timestamp}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex items-center justify-between p-4 border ${
                idx === 0
                  ? 'border-secondary bg-secondary/10'
                  : 'border-border bg-card/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {idx === 0 && (
                  <Sparkles className="w-5 h-5 text-secondary animate-pulse" />
                )}
                <div>
                  <div className="font-mono text-lg text-foreground">
                    {shortenAddress(selection.wallet_address)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getMostRecentTime(selection.selection_timestamp)}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-orbitron text-xl text-secondary">
                  +{formatAmount(selection.distribution_amount)}
                </div>
                <div className="text-xs text-muted-foreground">
                  tokens
                </div>
              </div>
            </motion.div>
          ))}

          {selections.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="font-mono">No lucky winners yet...</p>
              <p className="text-sm mt-2">Be the first to mint and win!</p>
            </div>
          )}
        </div>
      </Card>
    </>
  );
};
