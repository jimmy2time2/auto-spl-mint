import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wallet, DollarSign, Users, Award, AlertCircle, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  walletAddress: string | null;
  earnings: number;
  tradesCount: number;
  luckyWins: number;
  isDAOEligible: boolean;
  whaleStatus: boolean;
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData>({
    walletAddress: null,
    earnings: 0,
    tradesCount: 0,
    luckyWins: 0,
    isDAOEligible: false,
    whaleStatus: false
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = () => {
    // Check if wallet is connected (mock for now)
    const connectedWallet = localStorage.getItem('connected_wallet');
    
    if (!connectedWallet) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to view your profile.",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    fetchProfileData(connectedWallet);
  };

  const fetchProfileData = async (walletAddress: string) => {
    try {
      // Get wallet activity
      const { data: activity } = await supabase
        .from('wallet_activity_log')
        .select('*')
        .eq('wallet_address', walletAddress);

      // Get lucky wins
      const { data: luckyWins } = await supabase
        .from('lucky_wallet_selections')
        .select('distribution_amount')
        .eq('wallet_address', walletAddress);

      // Get DAO eligibility
      const { data: daoStatus } = await supabase
        .from('dao_eligibility')
        .select('is_eligible, whale_status')
        .eq('wallet_address', walletAddress)
        .single();

      const earnings = activity?.reduce((sum, a) => sum + Number(a.amount || 0), 0) || 0;
      const luckyEarnings = luckyWins?.reduce((sum, w) => sum + Number(w.distribution_amount || 0), 0) || 0;

      setProfile({
        walletAddress,
        earnings: earnings + luckyEarnings,
        tradesCount: activity?.length || 0,
        luckyWins: luckyWins?.length || 0,
        isDAOEligible: daoStatus?.is_eligible || false,
        whaleStatus: daoStatus?.whale_status || false
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary font-mono text-xl animate-pulse">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="container mx-auto px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-5xl font-orbitron text-primary text-glow mb-4">
            YOUR PROFILE
          </h1>
          <div className="flex items-center gap-3 text-muted-foreground font-mono">
            <Wallet className="w-5 h-5" />
            <span>{profile.walletAddress}</span>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<DollarSign className="w-8 h-8" />}
            label="Total Earnings"
            value={`$${profile.earnings.toFixed(2)}`}
            color="primary"
          />
          
          <StatCard
            icon={<Users className="w-8 h-8" />}
            label="Total Trades"
            value={profile.tradesCount.toString()}
            color="secondary"
          />
          
          <StatCard
            icon={<Trophy className="w-8 h-8" />}
            label="Lucky Wins"
            value={profile.luckyWins.toString()}
            color="accent"
          />
          
          <StatCard
            icon={<Award className="w-8 h-8" />}
            label="DAO Status"
            value={profile.isDAOEligible ? "ELIGIBLE" : "INELIGIBLE"}
            color={profile.isDAOEligible ? "primary" : "muted"}
          />
        </div>

        {/* Whale Warning */}
        {profile.whaleStatus && (
          <Card className="p-6 bg-destructive/10 border-2 border-destructive mb-8">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <div>
                <h3 className="font-orbitron text-xl text-destructive mb-1">
                  WHALE STATUS DETECTED
                </h3>
                <p className="text-sm text-destructive/80 font-mono">
                  You've been flagged for large position activity. DAO voting is temporarily disabled.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* DAO Section */}
        <Card className="p-8 bg-card border-2 border-primary">
          <h2 className="text-3xl font-orbitron text-primary mb-6">
            DAO MEMBERSHIP
          </h2>

          {profile.isDAOEligible ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-secondary">
                <Award className="w-6 h-6" />
                <span className="font-orbitron text-xl">ACTIVE MEMBER</span>
              </div>
              
              <p className="text-muted-foreground font-mono">
                You can vote on platform decisions, upcoming token boosts, and airdrop events.
              </p>

              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-orbitron">
                VIEW DAO PROPOSALS
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground font-mono">
                Become eligible for DAO voting by:
              </p>
              
              <ul className="space-y-2 text-muted-foreground font-mono text-sm">
                <li>• Hold a token for 30+ days</li>
                <li>• Invite 10 friends to the platform</li>
                <li>• Reach custom eligibility via usage</li>
              </ul>

              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 font-orbitron">
                LEARN MORE
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

const StatCard = ({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) => {
  return (
    <Card className={`p-6 bg-card border-2 border-${color}`}>
      <div className={`text-${color} mb-3`}>{icon}</div>
      <div className="text-sm text-muted-foreground mb-1 font-mono">{label}</div>
      <div className={`text-3xl font-orbitron text-${color} text-glow`}>
        {value}
      </div>
    </Card>
  );
};
