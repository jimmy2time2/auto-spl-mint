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

      {/* Masthead - Compact */}
      <section className="border-b border-foreground py-3">
        <div className="container mx-auto px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-4">
              <h1 className="text-3xl font-serif font-bold tracking-tighter">
                MIND9
              </h1>
              <span className="text-[8px] uppercase tracking-widest font-mono">
                Vol. 1 • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="brutalist"
                size="sm"
                onClick={() => {
                  localStorage.setItem('connected_wallet', 'DEMO_WALLET_' + Date.now());
                  window.location.href = '/profile';
                }}
                className="text-[10px] px-2 py-1 h-auto"
              >
                Connect
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Dense Info Bar */}
      <section className="border-b border-foreground py-1 bg-background">
        <div className="container mx-auto px-3">
          <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider">
            <div>AI Status: Active</div>
            <div>Market: Open</div>
            <div>Last Mint: 2m ago</div>
            <div className="hidden md:block">TVL: $1.2M</div>
          </div>
        </div>
      </section>

      {/* AI Governor - Compact Banner */}
      <section className="border-b border-foreground py-2 bg-background">
        <div className="container mx-auto px-3">
          <AIGovernorStatus />
        </div>
      </section>

      {/* Main Grid - 4 Columns */}
      <div className="container mx-auto px-3 py-4">
        <div className="grid grid-cols-12 gap-3">
          {/* Column 1 - Left Sidebar */}
          <div className="col-span-12 lg:col-span-3 space-y-3">
            {/* Lucky Wallet Box */}
            <div className="border-2 border-foreground p-3">
              <h3 className="text-[10px] uppercase tracking-widest font-mono font-bold border-b border-foreground pb-1 mb-2">
                Lucky Selection
              </h3>
              <LuckyWallet />
            </div>

            {/* Quick Stats Box */}
            <div className="border-2 border-foreground p-3">
              <h3 className="text-[10px] uppercase tracking-widest font-mono font-bold border-b border-foreground pb-1 mb-2">
                Quick Stats
              </h3>
              <div className="space-y-1 text-[11px] font-mono">
                <div className="flex justify-between border-b border-foreground py-1">
                  <span>Total Mints</span>
                  <span className="font-bold">1,247</span>
                </div>
                <div className="flex justify-between border-b border-foreground py-1">
                  <span>24h Volume</span>
                  <span className="font-bold">$847K</span>
                </div>
                <div className="flex justify-between border-b border-foreground py-1">
                  <span>Active Users</span>
                  <span className="font-bold">3,891</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>AI Decisions</span>
                  <span className="font-bold">42</span>
                </div>
              </div>
            </div>

            {/* Creator Revenue Box */}
            <div className="border-2 border-foreground p-3">
              <h3 className="text-[10px] uppercase tracking-widest font-mono font-bold border-b border-foreground pb-1 mb-2">
                Creator Rev
              </h3>
              <CreatorRevenue />
            </div>
          </div>

          {/* Column 2 & 3 - Main Content */}
          <div className="col-span-12 lg:col-span-6 space-y-3">
            {/* Main Story */}
            <div className="border-2 border-foreground p-4">
              <h2 className="text-2xl font-serif font-bold leading-tight mb-2">
                AI Governor Mints Record Token in 24 Hours
              </h2>
              <p className="text-[11px] font-mono leading-relaxed mb-3">
                The autonomous AI decided when and what to mint based on market analysis and cryptic logic. An unprecedented move that surprised traders worldwide.
              </p>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                <div className="border border-foreground p-2">
                  <div className="uppercase tracking-wider text-[9px] mb-1">AI Governed</div>
                  <div className="text-[11px] font-bold">Autonomous</div>
                </div>
                <div className="border border-foreground p-2">
                  <div className="uppercase tracking-wider text-[9px] mb-1">Instant Profit</div>
                  <div className="text-[11px] font-bold">Trading Fees</div>
                </div>
                <div className="border border-foreground p-2">
                  <div className="uppercase tracking-wider text-[9px] mb-1">Lucky Pool</div>
                  <div className="text-[11px] font-bold">3% Each Mint</div>
                </div>
              </div>
            </div>

            {/* Token Feed */}
            <div className="border-2 border-foreground">
              <div className="border-b-2 border-foreground p-2 bg-background">
                <h3 className="text-[10px] uppercase tracking-widest font-mono font-bold">
                  Recent Tokens
                </h3>
              </div>
              <div className="p-3">
                <MintedTokenFeed />
              </div>
            </div>

            {/* Data Table */}
            <div className="border-2 border-foreground">
              <div className="border-b-2 border-foreground p-2 bg-background">
                <h3 className="text-[10px] uppercase tracking-widest font-mono font-bold">
                  Trading Activity
                </h3>
              </div>
              <div className="p-0">
                <table className="w-full text-[10px] font-mono">
                  <thead>
                    <tr className="border-b border-foreground">
                      <th className="text-left p-2 font-bold">Time</th>
                      <th className="text-left p-2 font-bold">Type</th>
                      <th className="text-right p-2 font-bold">Amount</th>
                      <th className="text-right p-2 font-bold">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { time: '14:32', type: 'BUY', amount: '1,000', price: '$12.40' },
                      { time: '14:31', type: 'SELL', amount: '500', price: '$12.38' },
                      { time: '14:29', type: 'BUY', amount: '2,500', price: '$12.35' },
                      { time: '14:28', type: 'BUY', amount: '750', price: '$12.33' },
                      { time: '14:25', type: 'SELL', amount: '1,200', price: '$12.30' },
                    ].map((trade, i) => (
                      <tr key={i} className="border-b border-foreground">
                        <td className="p-2">{trade.time}</td>
                        <td className="p-2 font-bold">{trade.type}</td>
                        <td className="p-2 text-right">{trade.amount}</td>
                        <td className="p-2 text-right font-bold">{trade.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Column 4 - Right Sidebar */}
          <div className="col-span-12 lg:col-span-3 space-y-3">
            {/* Top Wallets */}
            <div className="border-2 border-foreground">
              <div className="border-b-2 border-foreground p-2 bg-background">
                <h3 className="text-[10px] uppercase tracking-widest font-mono font-bold">
                  Top Wallets
                </h3>
              </div>
              <div className="p-3">
                <TopWallets />
              </div>
            </div>

            {/* Market Bulletin */}
            <div className="border-2 border-foreground p-3">
              <h3 className="text-[10px] uppercase tracking-widest font-mono font-bold border-b border-foreground pb-1 mb-2">
                Market Bulletin
              </h3>
              <div className="space-y-2 text-[10px] font-mono">
                <div className="pb-2 border-b border-foreground">
                  <div className="font-bold mb-1">15:45</div>
                  <div>AI increased minting frequency by 12%</div>
                </div>
                <div className="pb-2 border-b border-foreground">
                  <div className="font-bold mb-1">14:20</div>
                  <div>New token reached $1M market cap</div>
                </div>
                <div className="pb-2">
                  <div className="font-bold mb-1">13:05</div>
                  <div>Lucky wallet selected: 7x9K...mN2p</div>
                </div>
              </div>
            </div>

            {/* Price Table */}
            <div className="border-2 border-foreground">
              <div className="border-b-2 border-foreground p-2 bg-background">
                <h3 className="text-[10px] uppercase tracking-widest font-mono font-bold">
                  Prices
                </h3>
              </div>
              <div className="p-0">
                <table className="w-full text-[9px] font-mono">
                  <tbody>
                    {[
                      { name: 'MIND', price: '15.4', change: '+2.1%' },
                      { name: 'MEME', price: '10.2', change: '-0.8%' },
                      { name: 'DOGE', price: '8.7', change: '+5.3%' },
                      { name: 'PEPE', price: '12.1', change: '+1.2%' },
                      { name: 'SHIB', price: '6.9', change: '-1.5%' },
                    ].map((item, i) => (
                      <tr key={i} className="border-b border-foreground">
                        <td className="p-2 font-bold">{item.name}</td>
                        <td className="p-2 text-right">{item.price}</td>
                        <td className="p-2 text-right">{item.change}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* About Box */}
            <div className="border-2 border-foreground p-3">
              <h3 className="text-[10px] uppercase tracking-widest font-mono font-bold border-b border-foreground pb-1 mb-2">
                About
              </h3>
              <p className="text-[9px] font-mono leading-relaxed">
                MIND9 is an autonomous platform where AI governs token creation. Participate in the economy. 3% of each mint goes to random active users.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info Strip */}
      <section className="border-t-2 border-foreground py-2 mt-6">
        <div className="container mx-auto px-3">
          <div className="grid grid-cols-3 gap-4 text-[9px] font-mono uppercase tracking-wider text-center">
            <div>© 2025 MIND9</div>
            <div>All Rights Reserved</div>
            <div>Blockchain Verified</div>
          </div>
        </div>
      </section>
    </div>
  );
}
