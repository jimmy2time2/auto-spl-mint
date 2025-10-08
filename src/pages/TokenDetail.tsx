import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Token {
  id: string;
  name: string;
  symbol: string;
  price: number;
  liquidity: number;
  volume_24h: number;
  holders: number;
  supply: number;
  launch_timestamp: string;
  mint_address?: string;
}

const TokenDetail = () => {
  const { id } = useParams();
  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchToken();
    }
  }, [id]);

  const fetchToken = async () => {
    const { data } = await supabase
      .from("tokens")
      .select("*")
      .eq("id", id)
      .single();

    if (data) setToken(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted w-1/4"></div>
            <div className="h-64 bg-muted"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Token Not Found</h1>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to Feed
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="border-2 border-border p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-5xl font-bold font-mono mb-2">${token.symbol}</h1>
                  <p className="text-2xl text-muted-foreground">{token.name}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Launched {formatDistanceToNow(new Date(token.launch_timestamp), { addSuffix: true })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">CURRENT PRICE</p>
                  <p className="text-4xl font-bold font-mono">${token.price.toFixed(6)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase">Liquidity</p>
                  <p className="text-xl font-mono font-bold">{token.liquidity} SOL</p>
                </div>
                <div className="border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase">Volume 24h</p>
                  <p className="text-xl font-mono font-bold">${token.volume_24h.toLocaleString()}</p>
                </div>
                <div className="border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase">Holders</p>
                  <p className="text-xl font-mono font-bold">{token.holders}</p>
                </div>
                <div className="border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase">Supply</p>
                  <p className="text-xl font-mono font-bold">{token.supply.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Supply Minted</span>
                  <span className="font-mono font-bold">
                    {((token.supply / 1000000) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={(token.supply / 1000000) * 100} className="h-2" />
              </div>

              {token.mint_address && (
                <div className="mt-6 p-4 bg-muted border border-border">
                  <p className="text-xs text-muted-foreground mb-1">CONTRACT ADDRESS</p>
                  <p className="text-sm font-mono break-all">{token.mint_address}</p>
                </div>
              )}
            </div>

            {/* Trade Interface Placeholder */}
            <div className="border-2 border-border p-8">
              <h2 className="text-xs font-bold uppercase tracking-widest border-b-2 border-border pb-2 mb-6">
                ⚡ TRADE
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button size="lg" className="border-2 text-lg py-8">
                    BUY ${token.symbol}
                  </Button>
                  <Button size="lg" variant="outline" className="border-2 text-lg py-8">
                    SELL ${token.symbol}
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  2% fee on all trades (1% creator, 1% system)
                </p>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <div className="border-2 border-border p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest border-b-2 border-border pb-2 mb-4">
                📊 DISTRIBUTION
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Public</span>
                  <span className="font-mono font-bold">83%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AI Wallet</span>
                  <span className="font-mono font-bold">7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creator</span>
                  <span className="font-mono font-bold">5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lucky Wallet</span>
                  <span className="font-mono font-bold">3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">System</span>
                  <span className="font-mono font-bold">2%</span>
                </div>
              </div>
            </div>

            <div className="border-2 border-border p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest border-b-2 border-border pb-2 mb-4">
                🔗 LINKS
              </h2>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`https://solscan.io/token/${token.mint_address}`} target="_blank" rel="noopener noreferrer">
                    View on Solscan
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`https://birdeye.so/token/${token.mint_address}`} target="_blank" rel="noopener noreferrer">
                    View on Birdeye
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenDetail;
