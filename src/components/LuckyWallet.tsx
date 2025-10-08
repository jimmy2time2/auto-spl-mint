import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Confetti from "react-confetti";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";

interface LuckySelection {
  id: string;
  wallet_address: string;
  distribution_amount: number;
  selection_timestamp: string;
}

export function LuckyWallet() {
  const [selection, setSelection] = useState<LuckySelection | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    fetchLatest();

    const channel = supabase
      .channel("lucky-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "lucky_wallet_selections",
        },
        () => {
          fetchLatest();
          triggerConfetti();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLatest = async () => {
    const { data } = await supabase
      .from("lucky_wallet_selections")
      .select("*")
      .order("selection_timestamp", { ascending: false })
      .limit(1)
      .single();

    if (data) setSelection(data);
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!selection) return null;

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
        />
      )}
      <div className="bg-dark-bg text-dark-text border-2 border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest">🎰 LUCKY WALLET</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                ℹ️ HOW?
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>How Lucky Wallet Works</DialogTitle>
                <DialogDescription className="space-y-2 text-left">
                  <p>Every time the AI mints a new token, 3% of the total supply is distributed to one lucky wallet.</p>
                  <p className="font-bold">Selection Criteria:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Must have minted a token in the last 30 days</li>
                    <li>Active trading history</li>
                    <li>Good standing (no flags)</li>
                  </ul>
                  <p>The selection is randomized but weighted by activity score.</p>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-4">
          <div className="text-center py-6 border-2 border-border animate-pulse">
            <p className="text-xs text-muted-foreground mb-2">LATEST WINNER</p>
            <p className="text-2xl font-bold font-mono">{shortenAddress(selection.wallet_address)}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="border-2 border-border p-3">
              <p className="text-xs text-muted-foreground">REWARD</p>
              <p className="text-xl font-bold font-mono">{selection.distribution_amount.toFixed(2)} SOL</p>
            </div>
            <div className="border-2 border-border p-3">
              <p className="text-xs text-muted-foreground">CHANCE</p>
              <p className="text-xl font-bold font-mono">1/1000</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
