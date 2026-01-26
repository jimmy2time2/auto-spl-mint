import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import AsciiDivider from "@/components/AsciiDivider";
import { TradeForm } from "@/components/TradeForm";
import { TradingChart } from "@/components/TradingChart";
import OrderBook from "@/components/OrderBook";
import BondingCurveChart from "@/components/BondingCurveChart";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEngagementTracking } from "@/hooks/useEngagementTracking";
import { Link } from "react-router-dom";

interface Token {
  id: string;
  name: string;
  symbol: string;
  price: number;
  volume_24h: number;
  holders: number;
  liquidity: number;
  supply: number;
  created_at: string;
}

interface WalletBalance {
  token_id: string;
  balance: number;
}

interface RecentTrade {
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  time: Date;
  wallet: string;
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
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [viewMode, setViewMode] = useState<'chart' | 'depth'>('chart');

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

    // Generate mock recent trades
    const trades: RecentTrade[] = Array.from({ length: 8 }, (_, i) => ({
      type: Math.random() > 0.5 ? 'buy' : 'sell',
      amount: Math.random() * 5000 + 100,
      price: selectedToken.price * (1 + (Math.random() - 0.5) * 0.02),
      time: new Date(now - i * 60000 * Math.random() * 10),
      wallet: `${Math.random().toString(36).substring(2, 6)}...${Math.random().toString(36).substring(2, 6)}`,
    }));
    setRecentTrades(trades.sort((a, b) => b.time.getTime() - a.time.getTime()));
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
        <div className="max-w-7xl mx-auto px-2 sm:px-0">
          {/* Header */}
          <div className="border-b-2 border-primary px-3 sm:px-4 py-3 bg-muted">
            <div className="flex items-center justify-between">
              <div>
                <div className="data-sm flex items-center gap-2">
                  <span className="power-pulse">⏻</span>
                  TRADING TERMINAL
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">Buy & sell M9 tokens</div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <span className="power-pulse text-xs">●</span>
                  <span className="data-sm">LIVE</span>
                </div>
                <div className="data-sm text-muted-foreground">
                  {filteredTokens.length} MKT
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Token Selector */}
          <div className="lg:hidden border-b-2 border-primary p-2">
            <Input
              type="text"
              placeholder="SEARCH TOKEN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 text-xs border-primary"
            />
            <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
              {filteredTokens.slice(0, 5).map((token) => {
                const isSelected = selectedToken?.id === token.id;
                return (
                  <button
                    key={token.id}
                    onClick={() => setSelectedToken(token)}
                    className={`flex-shrink-0 px-3 py-2 border-2 ${
                      isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-primary/30'
                    }`}
                  >
                    <div className="data-sm font-bold">{token.symbol}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Token List - Hidden on mobile */}
            <div className="hidden lg:block lg:col-span-2 border-r-2 border-primary">
              {/* Search */}
              <div className="border-b-2 border-primary p-2">
                <Input
                  type="text"
                  placeholder="SEARCH..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs border-primary"
                />
              </div>

              {/* Token List */}
              <div className="max-h-[600px] overflow-y-auto divide-y divide-primary/30">
                {filteredTokens.length === 0 ? (
                  <div className="p-4 text-center">
                    <div className="data-sm text-muted-foreground">NO TOKENS</div>
                  </div>
                ) : (
                  filteredTokens.map((token) => {
                    const isSelected = selectedToken?.id === token.id;
                    const change = (Math.random() - 0.3) * 20;
                    
                    return (
                      <button
                        key={token.id}
                        onClick={() => {
                          setSelectedToken(token);
                          trackEvent('trade');
                        }}
                        className={`w-full p-3 text-left transition-colors ${
                          isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <div className="data-sm font-bold">{token.symbol}</div>
                            <div className="text-xs opacity-70 truncate max-w-[80px]">{token.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="data-sm tabular-nums">${token.price.toFixed(6)}</div>
                            <div className={`text-[10px] tabular-nums ${change >= 0 ? 'text-primary' : 'text-destructive'}`}>
                              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Main Trading Area */}
            <div className="lg:col-span-7 lg:border-r-2 border-primary">
              {selectedToken ? (
                <>
                  {/* Token Header */}
                  <div className="border-b-2 border-primary p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg sm:text-xl font-bold glow-text">{selectedToken.name}</span>
                          <Link 
                            to={`/token/${selectedToken.id}`} 
                            className="data-sm text-muted-foreground hover:text-primary"
                          >
                            VIEW →
                          </Link>
                        </div>
                        <div className="data-sm text-muted-foreground">${selectedToken.symbol}</div>
                      </div>
                      <div className="text-right">
                        <div className="display-lg tabular-nums glow-text">${selectedToken.price.toFixed(6)}</div>
                        <div className="text-xs text-primary">+{(Math.random() * 10).toFixed(1)}% 24h</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="border-2 border-primary p-2">
                        <div className="data-sm text-muted-foreground mb-1">VOL 24H</div>
                        <div className="data-md tabular-nums">${selectedToken.volume_24h.toFixed(0)}</div>
                      </div>
                      <div className="border-2 border-primary p-2">
                        <div className="data-sm text-muted-foreground mb-1">HOLDERS</div>
                        <div className="data-md tabular-nums">{selectedToken.holders}</div>
                      </div>
                      <div className="border-2 border-primary p-2">
                        <div className="data-sm text-muted-foreground mb-1">LIQUIDITY</div>
                        <div className="data-md tabular-nums">${selectedToken.liquidity.toFixed(0)}</div>
                      </div>
                      <div className="border-2 border-primary p-2">
                        <div className="data-sm text-muted-foreground mb-1">MCAP</div>
                        <div className="data-md tabular-nums">${(selectedToken.price * selectedToken.supply).toFixed(0)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Chart Toggle */}
                  <div className="border-b border-primary/30 p-2 flex gap-2">
                    <Button
                      variant={viewMode === 'chart' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('chart')}
                      className="h-8 px-3 data-sm"
                    >
                      📈 CHART
                    </Button>
                    <Button
                      variant={viewMode === 'depth' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('depth')}
                      className="h-8 px-3 data-sm"
                    >
                      📊 DEPTH
                    </Button>
                  </div>

                  {/* Chart */}
                  <div className="border-b-2 border-primary">
                    {viewMode === 'chart' ? (
                      <TradingChart 
                        data={chartData}
                        tokenSymbol={selectedToken.symbol}
                      />
                    ) : (
                      <div className="p-4">
                        <OrderBook currentPrice={selectedToken.price} />
                      </div>
                    )}
                  </div>

                  {/* Recent Trades - Hidden on small screens */}
                  <div className="border-b-2 border-primary hidden sm:block">
                    <div className="border-b border-primary/30 px-3 py-2 bg-muted">
                      <span className="data-sm">RECENT TRADES</span>
                    </div>
                    <div className="max-h-32 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-background">
                          <tr className="border-b border-primary/30">
                            <td className="p-2 text-muted-foreground">TYPE</td>
                            <td className="p-2 text-muted-foreground text-right">PRICE</td>
                            <td className="p-2 text-muted-foreground text-right">AMOUNT</td>
                            <td className="p-2 text-muted-foreground text-right">TIME</td>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/20">
                          {recentTrades.map((trade, i) => (
                            <tr key={i}>
                              <td className={`p-2 font-bold ${trade.type === 'buy' ? 'text-primary' : 'text-destructive'}`}>
                                {trade.type.toUpperCase()}
                              </td>
                              <td className="p-2 text-right tabular-nums">${trade.price.toFixed(6)}</td>
                              <td className="p-2 text-right tabular-nums">{trade.amount.toFixed(0)}</td>
                              <td className="p-2 text-right text-muted-foreground">
                                {trade.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                  <div className="text-2xl mb-2 power-pulse">⏻</div>
                  <div className="data-sm text-muted-foreground">SELECT A TOKEN</div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-3">
              {selectedToken && (
                <>
                  {/* Bonding Curve */}
                  <div className="p-3 border-b border-border">
                    <BondingCurveChart
                      currentSupply={selectedToken.supply * 0.35}
                      totalSupply={selectedToken.supply}
                      currentPrice={selectedToken.price}
                    />
                  </div>

                  {/* Order Book */}
                  <div className="p-3">
                    <OrderBook currentPrice={selectedToken.price} depth={5} />
                  </div>
                </>
              )}

              {/* Holdings */}
              {connected && walletBalances.filter(b => b.balance > 0).length > 0 && (
                <>
                  <AsciiDivider pattern="wave" />
                  
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
          </div>

          {/* Footer ASCII */}
          <div className="p-3 text-center">
            <div className="data-sm text-muted-foreground opacity-50">
              ════════════════════════════════════════════════════════════════════
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Trade;
