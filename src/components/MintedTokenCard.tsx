import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, TrendingUp, Users, Clock } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Token {
  id: string;
  name: string;
  symbol: string;
  supply: number;
  price: number;
  volume_24h: number;
  liquidity: number;
  holders: number;
  created_at: string;
}

export const MintedTokenCard = ({ token }: { token: Token }) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  const hoursSinceLaunch = (Date.now() - new Date(token.created_at).getTime()) / (1000 * 60 * 60);
  const isHot = hoursSinceLaunch < 6;
  
  // Simulate supply progress (replace with real data)
  useEffect(() => {
    const targetProgress = Math.min(100, (token.volume_24h / token.supply) * 100);
    setProgress(targetProgress);
  }, [token]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="p-6 bg-card border-2 border-border hover:border-primary transition-all cursor-pointer relative overflow-hidden"
        onClick={() => navigate(`/token/${token.id}`)}
      >
        {/* Hot badge */}
        {isHot && (
          <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground font-orbitron gap-1">
            <Flame className="w-3 h-3" />
            HOT
          </Badge>
        )}

        {/* Token Info */}
        <div className="mb-4">
          <h3 className="text-2xl font-orbitron text-primary mb-1">
            {token.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-lg font-mono text-muted-foreground">
              ${token.symbol}
            </span>
            <span className="text-xs text-muted-foreground">
              {Math.floor(hoursSinceLaunch)}h ago
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingUp className="w-3 h-3" />
              <span>PRICE</span>
            </div>
            <div className="text-lg font-mono text-foreground">
              ${token.price.toFixed(6)}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <TrendingUp className="w-3 h-3" />
              <span>VOLUME</span>
            </div>
            <div className="text-lg font-mono text-foreground">
              ${formatNumber(token.volume_24h)}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Users className="w-3 h-3" />
              <span>HOLDERS</span>
            </div>
            <div className="text-lg font-mono text-foreground">
              {token.holders}
            </div>
          </div>
        </div>

        {/* Supply Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>SUPPLY DISTRIBUTION</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Hover effect */}
        <div className="absolute inset-0 bg-primary opacity-0 hover:opacity-5 transition-opacity pointer-events-none" />
      </Card>
    </motion.div>
  );
};

export const MintedTokenFeed = () => {
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    fetchTokens();

    // Real-time subscription
    const channel = supabase
      .channel('tokens')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tokens'
      }, () => {
        fetchTokens();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTokens = async () => {
    const { data } = await supabase
      .from('tokens')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setTokens(data as Token[]);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-orbitron text-primary text-glow">
        MINTED TOKENS
      </h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tokens.map((token) => (
          <MintedTokenCard key={token.id} token={token} />
        ))}
      </div>

      {tokens.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="font-mono">No tokens minted yet...</p>
          <p className="text-sm mt-2">The AI is still deciding.</p>
        </div>
      )}
    </div>
  );
};
