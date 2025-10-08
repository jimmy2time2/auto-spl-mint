import { useState } from "react";
import Navigation from "@/components/Navigation";
import { CreatorRevenue } from "@/components/CreatorRevenue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const [connectedWallet] = useState<string>();
  const [inviteCode] = useState("MIND9XYZ123");
  const { toast } = useToast();

  const copyInviteLink = () => {
    const link = `${window.location.origin}?invite=${inviteCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard",
    });
  };

  if (!connectedWallet) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="border-2 border-border p-12 text-center">
            <h1 className="text-3xl font-bold mb-4">Connect Wallet</h1>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to view your profile and earnings
            </p>
            <Button size="lg" className="border-2">
              CONNECT WALLET
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-mono mb-2">PROFILE</h1>
          <p className="text-muted-foreground font-mono">
            {connectedWallet.slice(0, 8)}...{connectedWallet.slice(-8)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <CreatorRevenue walletAddress={connectedWallet} />

            {/* Lucky History */}
            <div className="border-2 border-border p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest border-b-2 border-border pb-2 mb-4">
                🎰 LUCKY WALLET HISTORY
              </h2>
              <div className="text-center py-12 text-muted-foreground">
                <p>You haven't won any lucky draws yet</p>
                <p className="text-xs mt-2">Keep minting and trading to increase your chances!</p>
              </div>
            </div>

            {/* Trading History */}
            <div className="border-2 border-border p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest border-b-2 border-border pb-2 mb-4">
                📈 TRADING HISTORY
              </h2>
              <div className="text-center py-12 text-muted-foreground">
                <p>No trades yet</p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* DAO Eligibility */}
            <div className="border-2 border-border p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest border-b-2 border-border pb-2 mb-4">
                🏛️ DAO STATUS
              </h2>
              <div className="space-y-4">
                <div className="text-center py-6 border-2 border-border">
                  <p className="text-xs text-muted-foreground mb-2">ELIGIBILITY</p>
                  <p className="text-2xl font-bold">NOT ELIGIBLE</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invites</span>
                    <span className="font-mono">0 / 10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hold Time</span>
                    <span className="font-mono">0 / 30 days</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/dao">View DAO Proposals</a>
                </Button>
              </div>
            </div>

            {/* Invite System */}
            <div className="border-2 border-border p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest border-b-2 border-border pb-2 mb-4">
                🎁 INVITE FRIENDS
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">YOUR INVITE CODE</p>
                  <div className="flex gap-2">
                    <Input value={inviteCode} readOnly className="font-mono" />
                    <Button variant="outline" size="icon" onClick={copyInviteLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Invite 10 friends to become DAO eligible</p>
                  <p className="mt-1">Each invite earns you bonus AI score</p>
                </div>
                <Button className="w-full" onClick={copyInviteLink}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Share Link
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="border-2 border-border p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest border-b-2 border-border pb-2 mb-4">
                📊 YOUR STATS
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Trades</span>
                  <span className="font-mono font-bold">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tokens Held</span>
                  <span className="font-mono font-bold">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Invites</span>
                  <span className="font-mono font-bold">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">AI Score</span>
                  <span className="font-mono font-bold">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
