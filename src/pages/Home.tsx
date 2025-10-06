import { DateHeader } from "@/components/DateHeader";
import { WeatherWidget } from "@/components/WeatherWidget";
import { MintedTokenFeed } from "@/components/MintedTokenCard";
import { LuckyWallet } from "@/components/LuckyWallet";
import { CreatorRevenue } from "@/components/CreatorRevenue";
import { TopWallets } from "@/components/TopWallets";
import { Brain, TrendingUp, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <DateHeader />
      
      {/* Weather Bar */}
      <div className="border-b-2 border-foreground">
        <div className="container mx-auto px-4 py-4 grid grid-cols-4 gap-4">
          <WeatherWidget city="NEW YORK" temp="15°C" condition="sunny" />
          <WeatherWidget city="LONDON" temp="12°C" condition="cloudy" />
          <WeatherWidget city="TOKYO" temp="18°C" condition="rainy" />
          <WeatherWidget city="PARIS" temp="14°C" condition="cloudy" />
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-0">
          {/* Left Sidebar */}
          <aside className="col-span-3 border-r-2 border-foreground pr-4 space-y-0">
            <div className="border-2 border-foreground p-4 mb-4">
              <h3 className="text-[10px] font-bold tracking-widest mb-4 border-b-2 border-foreground pb-2">
                NAVIGATION
              </h3>
              <nav className="space-y-2 text-[10px] font-bold">
                <div className="py-2 border-b border-foreground">DASHBOARD</div>
                <div className="py-2 border-b border-foreground">TOKENS</div>
                <div className="py-2 border-b border-foreground">DAO</div>
                <div className="py-2 border-b border-foreground">LEADERBOARD</div>
              </nav>
            </div>

            <div className="border-2 border-foreground p-4">
              <h3 className="text-[10px] font-bold tracking-widest mb-4 border-b-2 border-foreground pb-2">
                AI STATUS
              </h3>
              <div className="space-y-2 text-[10px]">
                <div className="flex justify-between py-1 border-b border-muted">
                  <span>ÉTAT</span>
                  <span className="font-bold">ACTIF</span>
                </div>
                <div className="flex justify-between py-1 border-b border-muted">
                  <span>TOKENS</span>
                  <span className="font-bold">42</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>PROFIT</span>
                  <span className="font-bold">$12,450</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="col-span-6 px-4">
            {/* Hero */}
            <div className="border-4 border-foreground p-8 mb-4 bg-background">
              <h1 className="text-5xl font-bold mb-4 tracking-tight">
                MIND9 N°001
              </h1>
              <p className="text-sm leading-relaxed mb-6">
                Le système autonome de gouvernance par IA. L'intelligence artificielle décide. 
                Vous participez. Quelqu'un devient chanceux.
              </p>
              <div className="flex gap-2">
                <button className="border-2 border-foreground bg-foreground text-background px-4 py-2 text-[10px] font-bold tracking-widest hover:bg-background hover:text-foreground">
                  CONNECTER WALLET
                </button>
                <button className="border-2 border-foreground bg-background text-foreground px-4 py-2 text-[10px] font-bold tracking-widest hover:bg-foreground hover:text-background">
                  EN SAVOIR PLUS
                </button>
              </div>
            </div>

            {/* Token Feed */}
            <div className="border-2 border-foreground p-4 mb-4">
              <h2 className="text-[10px] font-bold tracking-widest mb-4 border-b-2 border-foreground pb-2">
                TOKENS RÉCENTS
              </h2>
              <MintedTokenFeed />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <StatBox
                icon={<Brain className="w-6 h-6" />}
                label="AI GOUVERNANCE"
                value="ACTIF"
              />
              <StatBox
                icon={<TrendingUp className="w-6 h-6" />}
                label="VOLUME 24H"
                value="$45.2K"
              />
              <StatBox
                icon={<Users className="w-6 h-6" />}
                label="WALLETS"
                value="1,234"
              />
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="col-span-3 border-l-2 border-foreground pl-4 space-y-4">
            <div className="border-2 border-foreground p-4">
              <h3 className="text-[10px] font-bold tracking-widest mb-4 border-b-2 border-foreground pb-2">
                WALLET CHANCEUX
              </h3>
              <LuckyWallet />
            </div>

            <div className="border-2 border-foreground p-4">
              <h3 className="text-[10px] font-bold tracking-widest mb-4 border-b-2 border-foreground pb-2">
                TOP WALLETS
              </h3>
              <TopWallets />
            </div>

            <div className="border-2 border-foreground p-4">
              <h3 className="text-[10px] font-bold tracking-widest mb-4 border-b-2 border-foreground pb-2">
                REVENUE CRÉATEUR
              </h3>
              <CreatorRevenue />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

const StatBox = ({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => {
  return (
    <div className="border-2 border-foreground p-4 bg-background">
      <div className="mb-2">{icon}</div>
      <div className="text-[8px] font-bold tracking-widest text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
};
