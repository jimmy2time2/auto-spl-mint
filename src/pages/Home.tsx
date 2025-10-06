import { AIGovernorStatus } from "@/components/AIGovernorStatus";
import { MintedTokenFeed } from "@/components/MintedTokenCard";
import { LuckyWallet } from "@/components/LuckyWallet";
import { CreatorRevenue } from "@/components/CreatorRevenue";
import { TopWallets } from "@/components/TopWallets";
import { RugAlert } from "@/components/RugAlert";
import { AIMintBroadcast } from "@/components/AIMintBroadcast";
import { motion } from "framer-motion";
import { Brain, Zap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen pb-20">
      {/* Rug Alert Ticker */}
      <RugAlert />

      {/* AI Mint Broadcast Overlay */}
      <AIMintBroadcast />

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-7xl font-orbitron text-primary text-glow mb-4 glitch">
            MIND9
          </h1>
          <p className="text-xl font-mono text-foreground mb-8">
            The AI decides. You participate. Someone gets lucky.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              className="text-lg px-8 py-6 font-orbitron bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                // Mock wallet connection
                localStorage.setItem('connected_wallet', 'DEMO_WALLET_' + Date.now());
                window.location.href = '/profile';
              }}
            >
              CONNECT WALLET
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 font-orbitron border-secondary text-secondary hover:bg-secondary/10"
            >
              HOW IT WORKS
            </Button>
          </div>
        </motion.div>

        {/* AI Governor Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <AIGovernorStatus />
        </motion.div>
      </section>

      {/* Main Content Grid */}
      <section className="container mx-auto px-4 space-y-12">
        {/* Token Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <MintedTokenFeed />
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="space-y-8"
          >
            <LuckyWallet />
            <CreatorRevenue />
          </motion.div>

          {/* Right Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <TopWallets />
          </motion.div>
        </div>

        {/* Info Sections */}
        <div className="grid md:grid-cols-3 gap-6">
          <InfoCard
            icon={<Brain className="w-12 h-12" />}
            title="AI GOVERNED"
            description="An autonomous AI decides when and what to mint based on market analysis and cryptic logic."
            color="primary"
          />
          
          <InfoCard
            icon={<Zap className="w-12 h-12" />}
            title="INSTANT PROFITS"
            description="Earn from trading fees, AI profit splits, and lucky wallet selections."
            color="secondary"
          />
          
          <InfoCard
            icon={<Trophy className="w-12 h-12" />}
            title="BE LUCKY"
            description="3% of every new token goes to a random active minter. Could be you."
            color="accent"
          />
        </div>
      </section>
    </div>
  );
}

const InfoCard = ({
  icon,
  title,
  description,
  color
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`p-6 border-2 border-${color} bg-card text-${color}`}
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-orbitron mb-2 text-glow">{title}</h3>
      <p className="text-sm text-muted-foreground font-mono">{description}</p>
    </motion.div>
  );
};
