import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface TradePanelProps {
  tokenId: string;
  tokenSymbol: string;
  currentPrice: number;
  onTradeComplete?: () => void;
}

export const TradePanel = ({ tokenId, tokenSymbol, currentPrice, onTradeComplete }: TradePanelProps) => {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrade = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('execute-trade', {
        body: {
          token_id: tokenId,
          trade_type: tradeType,
          trader_address: publicKey.toString(),
          amount: parseFloat(amount),
        }
      });

      if (error) throw error;

      toast({
        title: "Trade executed!",
        description: `Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${amount} SOL worth of ${tokenSymbol}`,
      });

      setAmount("");
      if (onTradeComplete) onTradeComplete();
    } catch (error) {
      console.error('Trade error:', error);
      toast({
        title: "Trade failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const presetAmounts = ['0.1 SOL', '0.5 SOL', '1 SOL', 'Max'];

  return (
    <div className="border border-border">
      {/* Buy/Sell Toggle */}
      <div className="grid grid-cols-2 border-b border-border">
        <button
          onClick={() => setTradeType('buy')}
          className={`p-3 text-sm font-bold uppercase transition-colors ${
            tradeType === 'buy' 
              ? 'bg-green-500/20 text-green-500 border-b-2 border-green-500' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setTradeType('sell')}
          className={`p-3 text-sm font-bold uppercase transition-colors ${
            tradeType === 'sell' 
              ? 'bg-red-500/20 text-red-500 border-b-2 border-red-500' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Sell
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Slippage setting */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Switch to {tokenSymbol}</span>
          <button className="text-primary hover:underline">Set max slippage</button>
        </div>

        {/* Amount input */}
        <div className="relative">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="pr-16 h-12 text-lg font-mono"
            disabled={loading}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="text-xs font-bold">SOL</span>
          </div>
        </div>

        {/* Preset amounts */}
        <div className="grid grid-cols-4 gap-1 sm:gap-2">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              onClick={() => {
                const val = preset === 'Max' ? '10' : preset.replace(' SOL', '');
                setAmount(val);
              }}
              className="px-1 sm:px-2 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase border border-border hover:bg-muted transition-colors truncate"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Trade button */}
        {connected ? (
          <Button
            onClick={handleTrade}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className={`w-full h-12 font-bold uppercase text-sm ${
              tradeType === 'buy' 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${tokenSymbol}`
            )}
          </Button>
        ) : (
          <WalletMultiButton className="!w-full !h-12 !bg-primary !text-primary-foreground hover:!bg-primary/90 !font-bold !uppercase !text-sm !justify-center" />
        )}

        {/* Position info */}
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Your position</span>
            <span className="font-bold">0 {tokenSymbol}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Value</span>
            <span className="font-bold">$0.00</span>
          </div>
        </div>
      </div>
    </div>
  );
};
