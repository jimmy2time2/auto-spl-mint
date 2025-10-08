import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

interface TradeFormProps {
  tokenId: string;
  tokenSymbol: string;
  currentPrice: number;
  onTradeComplete?: () => void;
}

export const TradeForm = ({ tokenId, tokenSymbol, currentPrice, onTradeComplete }: TradeFormProps) => {
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
        description: `Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${amount} ${tokenSymbol}`,
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

  const tokenOutput = parseFloat(amount || "0") / currentPrice;
  const creatorFee = parseFloat(amount || "0") * 0.01;
  const systemFee = parseFloat(amount || "0") * 0.01;
  const netAmount = parseFloat(amount || "0") - creatorFee - systemFee;

  if (!connected) {
    return (
      <div className="border-2 border-border p-6 bg-card text-center">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-4">
          Connect to Trade
        </h3>
        <p className="text-xs mb-4 opacity-70">Connect your wallet to buy or sell tokens</p>
        <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !border-2 !border-border !font-bold !uppercase !tracking-widest !text-xs" />
      </div>
    );
  }

  return (
    <div className="border-2 border-border p-6 bg-card">
      <h3 className="text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-border pb-2">
        Trade ${tokenSymbol}
      </h3>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={() => setTradeType('buy')}
            variant={tradeType === 'buy' ? 'default' : 'outline'}
            className="flex-1 border-2 border-border font-bold uppercase tracking-widest"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Buy
          </Button>
          <Button
            onClick={() => setTradeType('sell')}
            variant={tradeType === 'sell' ? 'default' : 'outline'}
            className="flex-1 border-2 border-border font-bold uppercase tracking-widest"
          >
            <TrendingDown className="mr-2 h-4 w-4" />
            Sell
          </Button>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest mb-2">
            Amount (SOL)
          </label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="border-2 border-border font-mono text-lg"
            disabled={loading}
          />
        </div>

        <div className="border-2 border-border p-4 bg-background space-y-2 text-xs font-mono">
          <div className="flex justify-between border-b border-border pb-2">
            <span>You {tradeType === 'buy' ? 'receive' : 'pay'}:</span>
            <span className="font-bold">{tokenOutput.toFixed(2)} {tokenSymbol}</span>
          </div>
          <div className="flex justify-between border-b border-border pb-2 opacity-70">
            <span>Creator Fee (1%):</span>
            <span>{creatorFee.toFixed(4)} SOL</span>
          </div>
          <div className="flex justify-between border-b border-border pb-2 opacity-70">
            <span>System Fee (1%):</span>
            <span>{systemFee.toFixed(4)} SOL</span>
          </div>
          <div className="flex justify-between pt-2 font-bold">
            <span>Net Amount:</span>
            <span>{netAmount.toFixed(4)} SOL</span>
          </div>
        </div>

        <Button
          onClick={handleTrade}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          className="w-full border-2 border-border font-bold uppercase tracking-widest h-12"
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

        <p className="text-xs text-center opacity-70">
          Current Price: ${currentPrice.toFixed(6)}
        </p>
      </div>
    </div>
  );
};
