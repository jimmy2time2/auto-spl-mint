import Navigation from "@/components/Navigation";
import TerminalCard from "@/components/TerminalCard";
import { Button } from "@/components/ui/button";

const mockLeaderboard = [
  { rank: 1, address: '8x5kJpL2...ng3jLq4', rewards: 12.45, share: 8.7, movement: 'up' },
  { rank: 2, address: 'Bw9pLk8...Qm5tRn7', rewards: 10.23, share: 7.2, movement: 'up' },
  { rank: 3, address: 'Nx7tMj4...Rv2sKp9', rewards: 8.91, share: 6.3, movement: 'down' },
  { rank: 4, address: 'Fy3nWq6...Lm8vBc1', rewards: 7.56, share: 5.3, movement: 'same' },
  { rank: 5, address: 'Dk2hPs9...Xw4yZt3', rewards: 6.78, share: 4.8, movement: 'up' },
  { rank: 6, address: 'Gm5rTb7...Jn2kVf6', rewards: 5.92, share: 4.2, movement: 'down' },
  { rank: 7, address: 'Ht8wKc4...Mp9xQg8', rewards: 5.34, share: 3.7, movement: 'up' },
  { rank: 8, address: 'Js6vNd2...Yr1zHl5', rewards: 4.89, share: 3.4, movement: 'same' },
];

const Leaderboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-screen-xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold terminal-text mb-2">{'>'} LUCKY_WALLET_LEADERBOARD</h1>
          <p className="terminal-text opacity-70">// RANKED_BY_REWARDS_RECEIVED</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <TerminalCard>
            <div className="text-sm opacity-70 terminal-text mb-1">TOTAL_DISTRIBUTED_7D</div>
            <div className="text-3xl font-bold terminal-text">142.50 SOL</div>
          </TerminalCard>
          <TerminalCard>
            <div className="text-sm opacity-70 terminal-text mb-1">LUCKY_WALLETS_COUNT</div>
            <div className="text-3xl font-bold terminal-text">89</div>
          </TerminalCard>
          <TerminalCard>
            <div className="text-sm opacity-70 terminal-text mb-1">AVG_REWARD</div>
            <div className="text-3xl font-bold terminal-text">1.60 SOL</div>
          </TerminalCard>
        </div>

        <TerminalCard>
          <div className="mb-4 flex gap-2">
            <Button className="border-2 border-black font-mono">24H</Button>
            <Button variant="outline" className="border-2 border-black font-mono">7D</Button>
            <Button variant="outline" className="border-2 border-black font-mono">ALL_TIME</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full terminal-text">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-3 px-2">RANK</th>
                  <th className="text-left py-3 px-2">WALLET_ADDRESS</th>
                  <th className="text-right py-3 px-2">REWARDS (SOL)</th>
                  <th className="text-right py-3 px-2">SHARE (%)</th>
                  <th className="text-center py-3 px-2">24H_CHANGE</th>
                  <th className="text-center py-3 px-2">VIEW</th>
                </tr>
              </thead>
              <tbody>
                {mockLeaderboard.map((entry) => (
                  <tr 
                    key={entry.rank} 
                    className={`border-b border-dashed border-black hover:bg-secondary transition-colors ${entry.rank <= 3 ? 'bg-accent/10' : ''}`}
                  >
                    <td className="py-3 px-2 font-bold">
                      {entry.rank <= 3 ? (
                        <span className="text-2xl">
                          {entry.rank === 1 ? '👑' : entry.rank === 2 ? '🥈' : '🥉'}
                        </span>
                      ) : (
                        `#${entry.rank}`
                      )}
                    </td>
                    <td className="py-3 px-2 font-mono">{entry.address}</td>
                    <td className="py-3 px-2 text-right font-bold">{entry.rewards.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right">{entry.share}%</td>
                    <td className="py-3 px-2 text-center">
                      {entry.movement === 'up' && <span className="text-green-600">▲</span>}
                      {entry.movement === 'down' && <span className="text-destructive">▼</span>}
                      {entry.movement === 'same' && <span className="opacity-50">—</span>}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <a 
                        href={`https://solscan.io/account/${entry.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:opacity-70 transition-opacity"
                      >
                        [SOLSCAN]
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-center terminal-text">
            <Button variant="outline" className="border-2 border-black font-mono">
              LOAD_MORE {'>'}
            </Button>
          </div>
        </TerminalCard>
      </main>
    </div>
  );
};

export default Leaderboard;
