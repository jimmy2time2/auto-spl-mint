import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

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
      
      <main className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b border-border px-4 py-3 bg-muted">
          <div className="data-sm">WALLET</div>
          <div className="text-xs text-muted-foreground">Activity & holdings</div>
        </div>

        {!connected ? (
          <div className="p-8 text-center border-b border-border">
            <div className="text-3xl mb-4">○</div>
            <div className="data-md font-bold mb-2">CONNECT WALLET</div>
            <div className="text-sm text-muted-foreground mb-6">Connect your Solana wallet to view activity</div>
            <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !border !border-border !font-mono !text-xs !font-bold !uppercase" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 border-b border-border">
              <div className="border-r border-border p-4">
                <div className="data-sm text-muted-foreground mb-1">ADDRESS</div>
                <div className="text-xs font-mono truncate">{publicKey?.toString()}</div>
              </div>
              <div className="border-r border-border p-4 text-center">
                <div className="data-sm text-muted-foreground mb-1">TRADES</div>
                <div className="data-lg">{activities.length}</div>
              </div>
              <div className="p-4 text-center">
                <div className="data-sm text-muted-foreground mb-1">STATUS</div>
                <div className="flex items-center justify-center gap-2">
                  <span className="status-dot status-active"></span>
                  <span className="data-md">ACTIVE</span>
                </div>
              </div>
            </div>

            {/* Activity Header */}
            <div className="border-b border-border px-4 py-2 bg-muted">
              <span className="data-sm">ACTIVITY HISTORY</span>
            </div>

            {/* Activity List */}
            {loading ? (
              <div className="p-8 text-center">
                <div className="data-sm text-muted-foreground">LOADING<span className="cursor-blink">_</span></div>
              </div>
            ) : activities.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-2xl mb-2">○</div>
                <div className="data-sm text-muted-foreground">NO ACTIVITY YET</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table w-full min-w-[500px]">
                  <thead>
                    <tr>
                      <th>TYPE</th>
                      <th>TOKEN</th>
                      <th className="text-right">AMOUNT</th>
                      <th className="text-right hidden sm:table-cell">% SUPPLY</th>
                      <th className="text-right hidden md:table-cell">TIME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity) => (
                      <tr key={activity.id}>
                        <td>
                          <span className={`font-bold ${
                            activity.activity_type === 'buy' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {activity.activity_type.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <Link 
                            to={`/token/${activity.token_id}`}
                            className="hover:underline"
                          >
                            VIEW →
                          </Link>
                        </td>
                        <td className="text-right tabular-nums">
                          {Number(activity.amount).toLocaleString()}
                        </td>
                        <td className="text-right tabular-nums hidden sm:table-cell">
                          {Number(activity.percentage_of_supply).toFixed(2)}%
                        </td>
                        <td className="text-right text-muted-foreground hidden md:table-cell">
                          {new Date(activity.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Wallet;
