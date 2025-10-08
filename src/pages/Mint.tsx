import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Navigation from "@/components/Navigation";
import TerminalCard from "@/components/TerminalCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Coins, Loader2 } from "lucide-react";

const Mint = () => {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [supply, setSupply] = useState("1000000");

  const handleMint = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!tokenName || !tokenSymbol || !supply) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mint-token', {
        body: {
          name: tokenName,
          symbol: tokenSymbol,
          supply: parseFloat(supply),
          creator_address: publicKey.toString()
        }
      });

      if (error) throw error;

      toast({
        title: "Token minted successfully!",
        description: `${tokenSymbol} has been created`,
      });

      // Redirect to token page
      if (data?.token?.id) {
        navigate(`/token/${data.token.id}`);
      }
    } catch (error) {
      console.error('Mint error:', error);
      toast({
        title: "Mint failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold uppercase tracking-tight mb-2">Mint Token</h1>
          <p className="text-xs uppercase tracking-widest opacity-70">Create your own meme coin</p>
        </div>

        <TerminalCard>
          {!connected ? (
            <div className="text-center py-12">
              <Coins className="w-16 h-16 mx-auto mb-6 opacity-50" />
              <h3 className="text-xl font-bold uppercase mb-4">Connect Wallet to Mint</h3>
              <p className="text-sm mb-6 opacity-70">Connect your Solana wallet to create a new token</p>
              <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !border-2 !border-border !font-bold !uppercase !tracking-widest" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-2 border-border p-6 bg-card">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-border pb-2">
                  Token Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2">
                      Token Name
                    </label>
                    <Input
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      placeholder="e.g., My Cool Token"
                      className="border-2 border-border font-mono"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2">
                      Token Symbol
                    </label>
                    <Input
                      value={tokenSymbol}
                      onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                      placeholder="e.g., MCT"
                      className="border-2 border-border font-mono uppercase"
                      maxLength={6}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-2">
                      Total Supply
                    </label>
                    <Input
                      type="number"
                      value={supply}
                      onChange={(e) => setSupply(e.target.value)}
                      placeholder="1000000"
                      className="border-2 border-border font-mono"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="border-2 border-border p-6 bg-card">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4 border-b-2 border-border pb-2">
                  Distribution Breakdown
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex justify-between border-b border-border pb-2">
                    <span>AI Wallet (7%)</span>
                    <span>{(parseFloat(supply || "0") * 0.07).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span>Creator (You) (5%)</span>
                    <span>{(parseFloat(supply || "0") * 0.05).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span>Lucky Wallet (3%)</span>
                    <span>{(parseFloat(supply || "0") * 0.03).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span>System (2%)</span>
                    <span>{(parseFloat(supply || "0") * 0.02).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2">
                    <span>Public Sale (83%)</span>
                    <span>{(parseFloat(supply || "0") * 0.83).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleMint}
                disabled={loading || !tokenName || !tokenSymbol}
                className="w-full border-2 border-border font-bold uppercase tracking-widest h-12"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Minting...
                  </>
                ) : (
                  <>
                    <Coins className="mr-2 h-4 w-4" />
                    Mint Token
                  </>
                )}
              </Button>

              <p className="text-xs text-center opacity-70">
                Transaction fees: 2% on all trades (1% Creator + 1% System)
              </p>
            </div>
          )}
        </TerminalCard>
      </main>
    </div>
  );
};

export default Mint;
