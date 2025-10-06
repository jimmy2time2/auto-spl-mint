import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface MintTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const MintTokenDialog = ({ open, onOpenChange, onSuccess }: MintTokenDialogProps) => {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("");
  const [creatorAddress, setCreatorAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleMint = async () => {
    if (!name || !symbol || !supply || !creatorAddress) {
      toast({
        title: "ERROR: INCOMPLETE_DATA",
        description: "All fields are required to mint a token",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mint-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({
            name,
            symbol: symbol.toUpperCase(),
            supply: parseFloat(supply),
            creator_address: creatorAddress
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mint token');
      }

      toast({
        title: "✓ TOKEN_MINTED",
        description: `${symbol} successfully created with ${supply} supply`
      });

      // Reset form
      setName("");
      setSymbol("");
      setSupply("");
      setCreatorAddress("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Mint error:', error);
      toast({
        title: "ERROR: MINT_FAILED",
        description: error instanceof Error ? error.message : "Failed to mint token",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-2 border-black bg-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold uppercase tracking-tight">
            MINT_NEW_TOKEN
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-widest font-mono">
            Distribution: AI:7% Creator:5% Lucky:3% System:2% Public:83%
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest">
              Token Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vision Token"
              className="border-2 border-black font-mono"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="symbol" className="text-xs font-bold uppercase tracking-widest">
              Symbol
            </Label>
            <Input
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="VIS"
              maxLength={6}
              className="border-2 border-black font-mono uppercase"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supply" className="text-xs font-bold uppercase tracking-widest">
              Total Supply
            </Label>
            <Input
              id="supply"
              type="number"
              value={supply}
              onChange={(e) => setSupply(e.target.value)}
              placeholder="1000000"
              className="border-2 border-black font-mono"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="creator" className="text-xs font-bold uppercase tracking-widest">
              Creator Wallet Address
            </Label>
            <Input
              id="creator"
              value={creatorAddress}
              onChange={(e) => setCreatorAddress(e.target.value)}
              placeholder="0x..."
              className="border-2 border-black font-mono"
              disabled={loading}
            />
          </div>

          <div className="border-2 border-dashed border-black p-4 bg-secondary">
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2">Fee Structure:</div>
            <div className="text-xs font-mono space-y-1">
              <div>• 2% TRADING FEE (1% Creator, 1% System)</div>
              <div>• AI Profit Split: 80/15/2/3</div>
              <div>• Whale Protection: &gt;5% buy / &gt;50% sell</div>
            </div>
          </div>

          <Button
            onClick={handleMint}
            disabled={loading}
            className="w-full bg-black text-white border-2 border-black font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all h-12"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                MINTING_TOKEN...
              </>
            ) : (
              'MINT_TOKEN'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MintTokenDialog;
