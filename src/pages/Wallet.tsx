import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Navigation from "@/components/Navigation";
import TerminalCard from "@/components/TerminalCard";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Wallet as WalletIcon, Activity, TrendingUp } from "lucide-react";

interface WalletActivity {
  id: string;
  activity_type: string;
  amount: number;
  timestamp: string;
  token_id: string;
  percentage_of_supply: number;
}

const Wallet = () => {
  const { publicKey, connected } = useWallet();
  const [activities, setActivities] = useState<WalletActivity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      fetchWalletActivity();
    }
  }, [connected, publicKey]);

  const fetchWalletActivity = async () => {
    if (!publicKey) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wallet_activity_log')
        .select('*')
        .eq('wallet_address', publicKey.toString())
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data) setActivities(data);
    } catch (error) {
      console.error('Error fetching wallet activity:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold uppercase tracking-tight mb-2">Wallet</h1>
          <p className="text-xs uppercase tracking-widest opacity-70">Your trading activity & holdings</p>
        </div>

        {!connected ? (
          <TerminalCard>
            <div className="text-center py-12">
              <WalletIcon className="w-16 h-16 mx-auto mb-6 opacity-50" />
              <h3 className="text-xl font-bold uppercase mb-4">Connect Wallet</h3>
              <p className="text-sm mb-6 opacity-70">Connect your Solana wallet to view your activity</p>
              <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !border-2 !border-border !font-bold !uppercase !tracking-widest" />
            </div>
          </TerminalCard>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <TerminalCard title="WALLET ADDRESS">
                <div className="font-mono text-sm break-all">
                  {publicKey?.toString()}
                </div>
              </TerminalCard>

              <TerminalCard title="TOTAL TRADES">
                <div className="text-4xl font-bold font-mono">
                  {activities.length}
                </div>
              </TerminalCard>

              <TerminalCard title="STATUS">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                  <span className="text-xl font-bold font-mono">ACTIVE</span>
                </div>
              </TerminalCard>
            </div>

            <TerminalCard title="ACTIVITY HISTORY">
              {loading ? (
                <div className="text-center py-8 font-mono">LOADING...</div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 opacity-70">
                  <Activity className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-sm uppercase">No activity yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full font-mono text-xs">
                    <thead>
                      <tr className="border-b-2 border-border">
                        <th className="text-left py-3 px-2">TYPE</th>
                        <th className="text-left py-3 px-2">TOKEN</th>
                        <th className="text-right py-3 px-2">AMOUNT</th>
                        <th className="text-right py-3 px-2">% OF SUPPLY</th>
                        <th className="text-right py-3 px-2">TIME</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((activity, index) => (
                        <tr 
                          key={activity.id}
                          className={`border-b border-dashed border-border hover:bg-secondary/50 transition-colors ${
                            index % 2 === 0 ? 'bg-card' : ''
                          }`}
                        >
                          <td className="py-3 px-2">
                            <span className={`uppercase font-bold ${
                              activity.activity_type === 'buy' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {activity.activity_type}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <Link 
                              to={`/token/${activity.token_id}`}
                              className="hover:opacity-70 flex items-center gap-1"
                            >
                              <TrendingUp className="w-3 h-3" />
                              View Token
                            </Link>
                          </td>
                          <td className="py-3 px-2 text-right">
                            {Number(activity.amount).toLocaleString()}
                          </td>
                          <td className="py-3 px-2 text-right">
                            {Number(activity.percentage_of_supply).toFixed(2)}%
                          </td>
                          <td className="py-3 px-2 text-right opacity-70">
                            {new Date(activity.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TerminalCard>
          </>
        )}
      </main>
    </div>
  );
};

export default Wallet;
