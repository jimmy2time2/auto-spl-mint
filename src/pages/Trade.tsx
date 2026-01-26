import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { TradeForm } from "@/components/TradeForm";
import { TradingChart } from "@/components/TradingChart";
import { Input } from "@/components/ui/input";
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

  useEffect(() => {
    if (!selectedToken) return;

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
    if (connected && publicKey) {
      setTimeout(() => {}, 1000);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="data-lg mb-2">LOADING<span className="cursor-blink">_</span></div>
            <div className="data-sm text-muted-foreground">FETCHING MARKETS</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="border-b border-border px-4 py-3 bg-muted">
            <div className="flex items-center justify-between">
              <div>
                <div className="data-sm">TRADING TERMINAL</div>
                <div className="text-xs text-muted-foreground">Buy & sell Mind9 tokens</div>
              </div>
              <div className="data-sm text-muted-foreground">
                {filteredTokens.length} MARKETS
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4">
            {/* Token List */}
            <div className="lg:col-span-1 border-r border-border">
              {/* Search */}
              <div className="border-b border-border p-2">
                <Input
                  type="text"
                  placeholder="SEARCH..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs border-border"
                />
              </div>

              {/* Token List */}
              <div className="max-h-[500px] overflow-y-auto divide-y divide-border">
                {filteredTokens.length === 0 ? (
                  <div className="p-4 text-center">
                    <div className="data-sm text-muted-foreground">NO TOKENS</div>
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
                        className={`w-full p-3 text-left transition-colors ${
                          isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <div className="data-sm font-bold">{token.symbol}</div>
                            <div className="text-xs opacity-70 truncate max-w-[100px]">{token.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="data-sm tabular-nums">${token.price.toFixed(6)}</div>
                            {balance > 0 && (
                              <div className="text-xs opacity-70">{balance.toFixed(2)}</div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Holdings */}
              {connected && walletBalances.filter(b => b.balance > 0).length > 0 && (
                <>
                  <div className="border-t border-b border-border px-3 py-2 bg-muted">
                    <span className="data-sm">YOUR HOLDINGS</span>
                  </div>
                  <div className="divide-y divide-border">
                    {walletBalances.map((balance) => {
                      const token = tokens.find(t => t.id === balance.token_id);
                      if (!token || balance.balance <= 0) return null;
                      
                      return (
                        <div key={balance.token_id} className="flex justify-between items-center p-2">
                          <div>
                            <div className="data-sm font-bold">{token.symbol}</div>
                            <div className="text-xs text-muted-foreground">{balance.balance.toFixed(2)}</div>
                          </div>
                          <div className="data-sm tabular-nums">
                            ${(balance.balance * token.price).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Chart & Trade */}
            <div className="lg:col-span-3">
              {selectedToken ? (
                <>
                  {/* Token Header */}
                  <div className="border-b border-border p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-xl font-bold">{selectedToken.name}</div>
                        <div className="data-sm text-muted-foreground">${selectedToken.symbol}</div>
                      </div>
                      <div className="text-right">
                        <div className="data-lg tabular-nums">${selectedToken.price.toFixed(6)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="border border-border p-2">
                        <div className="data-sm text-muted-foreground mb-1">VOL 24H</div>
                        <div className="data-md tabular-nums">${selectedToken.volume_24h.toFixed(2)}</div>
                      </div>
                      <div className="border border-border p-2">
                        <div className="data-sm text-muted-foreground mb-1">HOLDERS</div>
                        <div className="data-md tabular-nums">{selectedToken.holders}</div>
                      </div>
                      <div className="border border-border p-2">
                        <div className="data-sm text-muted-foreground mb-1">LIQUIDITY</div>
                        <div className="data-md tabular-nums">${selectedToken.liquidity.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="border-b border-border">
                    <TradingChart 
                      data={chartData}
                      tokenSymbol={selectedToken.symbol}
                    />
                  </div>

                  {/* Trade Form */}
                  <TradeForm
                    tokenId={selectedToken.id}
                    tokenSymbol={selectedToken.symbol}
                    currentPrice={selectedToken.price}
                    onTradeComplete={handleTradeComplete}
                  />
                </>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-2xl mb-2">→</div>
                  <div className="data-sm text-muted-foreground">SELECT A TOKEN</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Trade;
