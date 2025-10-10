import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { TradeForm } from "@/components/TradeForm";
import { TradingChart } from "@/components/TradingChart";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, TrendingUp, TrendingDown, Users, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEngagementTracking } from "@/hooks/useEngagementTracking";

interface Token {
  id: string;
  name: string;
  symbol: string;
  price: number;
  volume_24h: number;
  holders: number;
  liquidity: number;
  created_at: string;
}

interface WalletBalance {
  token_id: string;
  balance: number;
}

const Trade = () => {
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();
  const { trackEvent } = useEngagementTracking();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  // Fetch tokens
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const { data, error } = await supabase
          .from('tokens')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setTokens(data || []);
        if (data && data.length > 0 && !selectedToken) {
          setSelectedToken(data[0]);
        }
      } catch (error) {
        console.error('Error fetching tokens:', error);
        toast({
          title: "Error loading tokens",
          description: "Failed to fetch token list",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
    trackEvent('page_view');
  }, []);

  // Fetch wallet balances
  useEffect(() => {
    if (!connected || !publicKey) return;

    const fetchBalances = async () => {
      try {
        const { data, error } = await supabase
          .from('wallet_activity_log')
          .select('token_id, amount, activity_type')
          .eq('wallet_address', publicKey.toString())
          .order('timestamp', { ascending: false });

        if (error) throw error;

        // Calculate balances from activity log
        const balanceMap = new Map<string, number>();
        data?.forEach((activity) => {
          const current = balanceMap.get(activity.token_id) || 0;
          if (activity.activity_type === 'buy' || activity.activity_type === 'mint') {
            balanceMap.set(activity.token_id, current + activity.amount);
          } else if (activity.activity_type === 'sell') {
            balanceMap.set(activity.token_id, current - activity.amount);
          }
        });

        const balances = Array.from(balanceMap.entries()).map(([token_id, balance]) => ({
          token_id,
          balance,
        }));

        setWalletBalances(balances);
      } catch (error) {
        console.error('Error fetching wallet balances:', error);
      }
    };

    fetchBalances();
  }, [connected, publicKey]);

  // Fetch chart data for selected token
  useEffect(() => {
    if (!selectedToken) return;

    const fetchChartData = async () => {
      // Generate mock chart data based on current price
      const now = Date.now();
      const data = Array.from({ length: 24 }, (_, i) => {
        const variance = (Math.random() - 0.5) * selectedToken.price * 0.2;
        return {
          time: new Date(now - (23 - i) * 60 * 60 * 1000).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          value: Math.max(0, selectedToken.price + variance),
        };
      });
      setChartData(data);
    };

    fetchChartData();
  }, [selectedToken]);

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTokenBalance = (tokenId: string) => {
    const balance = walletBalances.find(b => b.token_id === tokenId);
    return balance ? balance.balance : 0;
  };

  const handleTradeComplete = () => {
    // Refresh balances after trade
    if (connected && publicKey) {
      setTimeout(() => {
        // Re-fetch balances logic here
      }, 1000);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-sm uppercase tracking-widest opacity-70">Loading Markets...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight mb-2 border-b-4 border-primary pb-4">
              Trading Terminal
            </h1>
            <p className="text-sm opacity-70 uppercase tracking-wider">
              Buy & Sell Mind9 Tokens
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Token List - Left Side */}
            <div className="lg:col-span-1">
              <Card className="border-2 border-border p-4">
                <div className="mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-widest mb-3 border-b-2 border-border pb-2">
                    Markets ({filteredTokens.length})
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50" />
                    <Input
                      type="text"
                      placeholder="Search tokens..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-2 border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredTokens.length === 0 ? (
                    <div className="text-center py-8 text-sm opacity-70">
                      No tokens found
                    </div>
                  ) : (
                    filteredTokens.map((token) => {
                      const isSelected = selectedToken?.id === token.id;
                      const balance = getTokenBalance(token.id);
                      
                      return (
                        <button
                          key={token.id}
                          onClick={() => {
                            setSelectedToken(token);
                            trackEvent('trade');
                          }}
                          className={`w-full p-3 border-2 transition-all text-left ${
                            isSelected
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50 bg-card'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-bold text-sm">{token.symbol}</div>
                              <div className="text-xs opacity-70">{token.name}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-sm">${token.price.toFixed(6)}</div>
                              {balance > 0 && (
                                <div className="text-xs text-primary">
                                  {balance.toFixed(2)} held
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 text-xs">
                            <span className="flex items-center gap-1 opacity-70">
                              <DollarSign className="h-3 w-3" />
                              Vol: {token.volume_24h.toFixed(2)}
                            </span>
                            <span className="flex items-center gap-1 opacity-70">
                              <Users className="h-3 w-3" />
                              {token.holders}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </Card>

              {/* Wallet Balances */}
              {connected && walletBalances.length > 0 && (
                <Card className="border-2 border-border p-4 mt-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-3 border-b-2 border-border pb-2">
                    Your Holdings
                  </h3>
                  <div className="space-y-2">
                    {walletBalances.map((balance) => {
                      const token = tokens.find(t => t.id === balance.token_id);
                      if (!token || balance.balance <= 0) return null;
                      
                      return (
                        <div
                          key={balance.token_id}
                          className="flex justify-between items-center p-2 border border-border bg-background"
                        >
                          <div>
                            <div className="font-bold text-xs">{token.symbol}</div>
                            <div className="text-xs opacity-70">{balance.balance.toFixed(2)}</div>
                          </div>
                          <div className="text-right font-mono text-xs">
                            ${(balance.balance * token.price).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>

            {/* Chart & Trade Form - Right Side */}
            <div className="lg:col-span-2 space-y-6">
              {selectedToken ? (
                <>
                  {/* Token Header */}
                  <Card className="border-2 border-border p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold">{selectedToken.name}</h2>
                        <p className="text-sm opacity-70 uppercase tracking-wider">
                          ${selectedToken.symbol}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold font-mono">
                          ${selectedToken.price.toFixed(6)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="border-2 border-border p-3 bg-background">
                        <div className="text-xs opacity-70 uppercase mb-1">24h Volume</div>
                        <div className="text-lg font-bold font-mono">
                          ${selectedToken.volume_24h.toFixed(2)}
                        </div>
                      </div>
                      <div className="border-2 border-border p-3 bg-background">
                        <div className="text-xs opacity-70 uppercase mb-1">Holders</div>
                        <div className="text-lg font-bold font-mono">
                          {selectedToken.holders}
                        </div>
                      </div>
                      <div className="border-2 border-border p-3 bg-background">
                        <div className="text-xs opacity-70 uppercase mb-1">Liquidity</div>
                        <div className="text-lg font-bold font-mono">
                          ${selectedToken.liquidity.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Chart */}
                  <TradingChart 
                    data={chartData}
                    tokenSymbol={selectedToken.symbol}
                  />

                  {/* Trade Form */}
                  <TradeForm
                    tokenId={selectedToken.id}
                    tokenSymbol={selectedToken.symbol}
                    currentPrice={selectedToken.price}
                    onTradeComplete={handleTradeComplete}
                  />
                </>
              ) : (
                <Card className="border-2 border-border p-12 text-center">
                  <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm uppercase tracking-widest opacity-70">
                    Select a token to start trading
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Trade;

