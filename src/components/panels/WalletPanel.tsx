import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
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

const WalletPanel = () => {
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
        .limit(10);

      if (error) throw error;
      if (data) setActivities(data);
    } catch (error) {
      console.error('Error fetching wallet activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="p-6 text-center">
        <div className="text-2xl mb-3">○</div>
        <div className="data-sm font-bold mb-2">CONNECT WALLET</div>
        <div className="text-[10px] text-muted-foreground mb-4">Connect to view activity</div>
        <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !border !border-border !font-mono !text-[10px] !font-bold !uppercase !px-4 !py-2" />
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 border-b border-primary/30">
        <div className="border-r border-primary/30 p-3">
          <div className="text-[10px] text-muted-foreground mb-1">ADDRESS</div>
          <div className="text-[10px] font-mono truncate">{publicKey?.toString().slice(0, 8)}...</div>
        </div>
        <div className="border-r border-primary/30 p-3 text-center">
          <div className="text-[10px] text-muted-foreground mb-1">TRADES</div>
          <div className="data-sm">{activities.length}</div>
        </div>
        <div className="p-3 text-center">
          <div className="text-[10px] text-muted-foreground mb-1">STATUS</div>
          <div className="flex items-center justify-center gap-1">
            <span className="status-live"></span>
            <span className="data-sm">ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Activity List */}
      {loading ? (
        <div className="p-6 text-center">
          <div className="data-sm text-muted-foreground">LOADING<span className="cursor-blink">_</span></div>
        </div>
      ) : activities.length === 0 ? (
        <div className="p-6 text-center">
          <div className="text-xl mb-2">○</div>
          <div className="text-[10px] text-muted-foreground">NO ACTIVITY YET</div>
        </div>
      ) : (
        <div className="divide-y divide-primary/30 max-h-[200px] overflow-y-auto">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <span className={`data-sm font-bold ${
                  activity.activity_type === 'buy' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {activity.activity_type.toUpperCase()}
                </span>
                <Link 
                  to={`/token/${activity.token_id}`}
                  className="text-[10px] hover:underline text-muted-foreground"
                >
                  VIEW →
                </Link>
              </div>
              <span className="data-sm tabular-nums">
                {Number(activity.amount).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WalletPanel;
