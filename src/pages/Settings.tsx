import { useState } from "react";
import Navigation from "@/components/Navigation";
import TerminalCard from "@/components/TerminalCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

const Settings = () => {
  const [autonomousMode, setAutonomousMode] = useState(true);
  const [launchFrequency, setLaunchFrequency] = useState("hourly");
  const [creatorFee, setCreatorFee] = useState([20]);
  const [luckyFee, setLuckyFee] = useState([30]);
  const [treasuryFee, setTreasuryFee] = useState([50]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-screen-xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold terminal-text mb-2">{'>'} SYSTEM_SETTINGS</h1>
          <p className="terminal-text opacity-70">// CONFIGURE_AI_PARAMETERS</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Wallet Connection */}
          <TerminalCard title="WALLET_CONNECTION">
            <div className="space-y-4">
              <div className="terminal-text text-sm opacity-70">STATUS: DISCONNECTED</div>
              <Button className="w-full border-2 border-black font-mono font-bold">
                {'<'} CONNECT_PHANTOM_WALLET {'>'}
              </Button>
              <div className="border-t-2 border-dashed border-black pt-4 text-xs terminal-text opacity-70">
                CONNECT YOUR WALLET TO VIEW ADMIN CONTROLS
              </div>
            </div>
          </TerminalCard>

          {/* Treasury Overview */}
          <TerminalCard title="TREASURY_OVERVIEW">
            <div className="space-y-4">
              <div>
                <div className="text-sm opacity-70 terminal-text mb-1">BALANCE</div>
                <div className="text-3xl font-bold terminal-text">1,247.83 SOL</div>
              </div>
              <div className="text-xs terminal-text opacity-70">
                WALLET: 8x5kJpL2...ng3jLq4
              </div>
              <Button variant="outline" className="w-full border-2 border-black font-mono" disabled>
                WITHDRAW (ADMIN_ONLY)
              </Button>
            </div>
          </TerminalCard>

          {/* AI Controls */}
          <TerminalCard title="AI_CONTROLS" className="md:col-span-2">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold terminal-text">AUTONOMOUS_LAUNCHING</div>
                  <div className="text-sm opacity-70 terminal-text">ENABLE_AI_AUTO_MINT</div>
                </div>
                <Switch checked={autonomousMode} onCheckedChange={setAutonomousMode} />
              </div>

              <div className="border-t-2 border-dashed border-black pt-6">
                <div className="font-bold terminal-text mb-4">LAUNCH_FREQUENCY</div>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={launchFrequency === "hourly" ? "default" : "outline"}
                    onClick={() => setLaunchFrequency("hourly")}
                    className="border-2 border-black font-mono"
                  >
                    HOURLY
                  </Button>
                  <Button
                    variant={launchFrequency === "daily" ? "default" : "outline"}
                    onClick={() => setLaunchFrequency("daily")}
                    className="border-2 border-black font-mono"
                  >
                    DAILY
                  </Button>
                  <Button
                    variant={launchFrequency === "weekly" ? "default" : "outline"}
                    onClick={() => setLaunchFrequency("weekly")}
                    className="border-2 border-black font-mono"
                  >
                    WEEKLY
                  </Button>
                </div>
              </div>

              <div className="border-t-2 border-dashed border-black pt-6">
                <div className="font-bold terminal-text mb-6">FEE_DISTRIBUTION</div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2 terminal-text">
                      <span>CREATOR_FEE:</span>
                      <span className="font-bold">{creatorFee[0]}%</span>
                    </div>
                    <Slider value={creatorFee} onValueChange={setCreatorFee} max={100} step={1} />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2 terminal-text">
                      <span>LUCKY_WALLETS_FEE:</span>
                      <span className="font-bold">{luckyFee[0]}%</span>
                    </div>
                    <Slider value={luckyFee} onValueChange={setLuckyFee} max={100} step={1} />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2 terminal-text">
                      <span>TREASURY_FEE:</span>
                      <span className="font-bold">{treasuryFee[0]}%</span>
                    </div>
                    <Slider value={treasuryFee} onValueChange={setTreasuryFee} max={100} step={1} />
                  </div>

                  <div className="border-t-2 border-dashed border-black pt-4">
                    <div className="flex justify-between terminal-text font-bold">
                      <span>TOTAL:</span>
                      <span>{creatorFee[0] + luckyFee[0] + treasuryFee[0]}%</span>
                    </div>
                    {creatorFee[0] + luckyFee[0] + treasuryFee[0] !== 100 && (
                      <div className="text-xs text-destructive mt-2 terminal-text">
                        ERROR: TOTAL_MUST_EQUAL_100%
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                className="w-full border-2 border-black font-mono font-bold" 
                disabled={creatorFee[0] + luckyFee[0] + treasuryFee[0] !== 100}
              >
                SAVE_SETTINGS
              </Button>
            </div>
          </TerminalCard>
        </div>
      </main>
    </div>
  );
};

export default Settings;
