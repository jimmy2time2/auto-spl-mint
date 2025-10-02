import { useState } from "react";
import Navigation from "@/components/Navigation";
import TerminalCard from "@/components/TerminalCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const mockTokens = [
  { id: '1', symbol: 'VX9', name: 'VisionX Nine', price: 0.001234, volume: 12500, liquidity: 45, holders: 234, launchTime: '2025-10-02 14:32' },
  { id: '2', symbol: 'NRG', name: 'NeoRetroGen', price: 0.005678, volume: 45000, liquidity: 120, holders: 567, launchTime: '2025-10-02 12:15' },
  { id: '3', symbol: 'QNT', name: 'QuantumNet', price: 0.000891, volume: 23400, liquidity: 78, holders: 189, launchTime: '2025-10-02 10:00' },
  { id: '4', symbol: 'BYT', name: 'ByteForce', price: 0.002345, volume: 34500, liquidity: 95, holders: 401, launchTime: '2025-10-02 08:45' },
  { id: '5', symbol: 'PHX', name: 'PhoenixRise', price: 0.001789, volume: 28900, liquidity: 62, holders: 312, launchTime: '2025-10-02 06:30' },
];

const Explorer = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("launchTime");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-screen-xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold terminal-text mb-2">{'>'} TOKEN_EXPLORER</h1>
          <p className="terminal-text opacity-70">// ALL_AI_GENERATED_TOKENS</p>
        </div>

        <TerminalCard>
          {/* Toolbar */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <Input
              placeholder="SEARCH_BY_SYMBOL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-2 border-black font-mono"
            />
            <div className="flex gap-2">
              <Button
                variant={sortBy === "price" ? "default" : "outline"}
                onClick={() => setSortBy("price")}
                className="border-2 border-black font-mono"
              >
                PRICE
              </Button>
              <Button
                variant={sortBy === "volume" ? "default" : "outline"}
                onClick={() => setSortBy("volume")}
                className="border-2 border-black font-mono"
              >
                VOLUME
              </Button>
              <Button
                variant={sortBy === "launchTime" ? "default" : "outline"}
                onClick={() => setSortBy("launchTime")}
                className="border-2 border-black font-mono"
              >
                LAUNCH
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full terminal-text">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-3 px-2">SYMBOL</th>
                  <th className="text-left py-3 px-2">NAME</th>
                  <th className="text-right py-3 px-2">PRICE</th>
                  <th className="text-right py-3 px-2">VOLUME_24H</th>
                  <th className="text-right py-3 px-2">LIQUIDITY</th>
                  <th className="text-right py-3 px-2">HOLDERS</th>
                  <th className="text-right py-3 px-2">LAUNCH_TIME</th>
                </tr>
              </thead>
              <tbody>
                {mockTokens
                  .filter(token => token.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((token, index) => (
                    <tr 
                      key={token.id} 
                      className={`border-b border-dashed border-black hover:bg-secondary transition-colors ${index % 2 === 0 ? 'bg-card' : ''}`}
                    >
                      <td className="py-3 px-2">
                        <Link to={`/token/${token.id}`} className="font-bold hover:opacity-70">
                          ${token.symbol}
                        </Link>
                      </td>
                      <td className="py-3 px-2">{token.name}</td>
                      <td className="py-3 px-2 text-right">${token.price.toFixed(6)}</td>
                      <td className="py-3 px-2 text-right">${token.volume.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right">{token.liquidity} SOL</td>
                      <td className="py-3 px-2 text-right">{token.holders}</td>
                      <td className="py-3 px-2 text-right text-sm opacity-70">{token.launchTime}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex justify-between items-center terminal-text">
            <div>SHOWING 1-5 OF 127 TOKENS</div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-2 border-black font-mono">{'<'} PREV</Button>
              <Button variant="outline" className="border-2 border-black font-mono">NEXT {'>'}</Button>
            </div>
          </div>
        </TerminalCard>
      </main>
    </div>
  );
};

export default Explorer;
