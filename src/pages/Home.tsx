import { AIGovernorStatus } from "@/components/AIGovernorStatus";
import { MintedTokenFeed } from "@/components/MintedTokenCard";
import { LuckyWallet } from "@/components/LuckyWallet";
import { CreatorRevenue } from "@/components/CreatorRevenue";
import { TopWallets } from "@/components/TopWallets";
import { RugAlert } from "@/components/RugAlert";
import { AIMintBroadcast } from "@/components/AIMintBroadcast";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Rug Alert Ticker */}
      <RugAlert />

      {/* AI Mint Broadcast Overlay */}
      <AIMintBroadcast />

      {/* Masthead */}
      <section className="border-b-2 border-foreground py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-6xl font-serif font-bold mb-2 tracking-tight">
              MIND9
            </h1>
            <p className="text-xs uppercase tracking-widest font-mono mb-6">
              The AI decides. You participate. Someone gets lucky.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="brutalist"
                size="lg"
                onClick={() => {
                  localStorage.setItem('connected_wallet', 'DEMO_WALLET_' + Date.now());
                  window.location.href = '/profile';
                }}
              >
                Connect Wallet
              </Button>

              <Button
                variant="brutalist"
                size="lg"
              >
                How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Governor Banner */}
      <section className="border-b-2 border-foreground">
        <AIGovernorStatus />
      </section>

      {/* Main Content - Newspaper Grid */}
      <section className="container mx-auto px-4 py-8">
        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-2 border-foreground">
          {/* Left Column */}
          <div className="border-r-0 lg:border-r-2 border-foreground">
            <div className="border-b-2 border-foreground p-6">
              <h2 className="text-xs uppercase tracking-widest font-mono font-bold mb-4 pb-2 border-b border-foreground">
                Lucky Selection
              </h2>
              <LuckyWallet />
            </div>
            
            <div className="p-6">
              <h2 className="text-xs uppercase tracking-widest font-mono font-bold mb-4 pb-2 border-b border-foreground">
                Creator Revenue
              </h2>
              <CreatorRevenue />
            </div>
          </div>

          {/* Center Column - Main Feed */}
          <div className="border-r-0 lg:border-r-2 border-foreground">
            <div className="p-6">
              <h2 className="text-xs uppercase tracking-widest font-mono font-bold mb-4 pb-2 border-b border-foreground">
                Recent Tokens
              </h2>
              <MintedTokenFeed />
            </div>
          </div>

          {/* Right Column */}
          <div>
            <div className="p-6">
              <h2 className="text-xs uppercase tracking-widest font-mono font-bold mb-4 pb-2 border-b border-foreground">
                Top Wallets
              </h2>
              <TopWallets />
            </div>
          </div>
        </div>

        {/* Info Grid - Below Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-x-2 border-b-2 border-foreground mt-0">
          <div className="border-r-0 md:border-r-2 border-b-2 md:border-b-0 border-foreground p-8">
            <h3 className="text-lg font-serif font-bold mb-3">AI Governed</h3>
            <p className="text-sm font-mono leading-relaxed">
              An autonomous AI decides when and what to mint based on market analysis and cryptic logic.
            </p>
          </div>
          
          <div className="border-r-0 md:border-r-2 border-b-2 md:border-b-0 border-foreground p-8">
            <h3 className="text-lg font-serif font-bold mb-3">Instant Profits</h3>
            <p className="text-sm font-mono leading-relaxed">
              Earn from trading fees, AI profit splits, and lucky wallet selections.
            </p>
          </div>
          
          <div className="p-8">
            <h3 className="text-lg font-serif font-bold mb-3">Be Lucky</h3>
            <p className="text-sm font-mono leading-relaxed">
              3% of every new token goes to a random active minter. Could be you.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
