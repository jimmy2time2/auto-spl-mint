import { useState } from "react";
import Navigation from "@/components/Navigation";
import { AIGovernorStatus } from "@/components/AIGovernorStatus";
import { MintedTokenFeed } from "@/components/MintedTokenFeed";
import { LuckyWallet } from "@/components/LuckyWallet";
import { CreatorRevenue } from "@/components/CreatorRevenue";
import { TopWallets } from "@/components/TopWallets";
import { RugAlert } from "@/components/RugAlert";

const Index = () => {
  const [connectedWallet, setConnectedWallet] = useState<string>();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <RugAlert />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <AIGovernorStatus />
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Token Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="border-2 border-border p-6">
              <MintedTokenFeed />
            </div>
          </div>

          {/* Right Column - Stats & Widgets */}
          <div className="space-y-6">
            <LuckyWallet />
            <CreatorRevenue walletAddress={connectedWallet} />
            <TopWallets />
          </div>
        </div>

        {/* Stats Footer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="border-2 border-border p-6 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
              TOTAL MINTS
            </p>
            <p className="text-3xl font-bold font-mono">247</p>
          </div>
          <div className="border-2 border-border p-6 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
              TOTAL VOLUME
            </p>
            <p className="text-3xl font-bold font-mono">1.2M</p>
          </div>
          <div className="border-2 border-border p-6 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
              ACTIVE WALLETS
            </p>
            <p className="text-3xl font-bold font-mono">3,421</p>
          </div>
          <div className="border-2 border-border p-6 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
              AVG HOLD TIME
            </p>
            <p className="text-3xl font-bold font-mono">12h</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
