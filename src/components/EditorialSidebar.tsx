import { Sun, Activity, Zap } from "lucide-react";

const EditorialSidebar = () => {
  return (
    <aside className="space-y-6">
      {/* Weather Widget */}
      <div className="border-4 border-terminal-green rounded-2xl p-6 bg-card"
        style={{
          boxShadow: '0 0 20px hsl(var(--terminal-green) / 0.2)'
        }}
      >
        <h3 className="module-header mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-terminal-green rounded-full animate-pulse" />
          WEATHER
        </h3>
        <div className="flex items-center justify-center py-8">
          <Sun className="w-16 h-16 text-analog-yellow" 
            style={{
              filter: 'drop-shadow(0 0 10px hsl(var(--analog-yellow) / 0.5))'
            }}
          />
        </div>
        <div className="flex gap-2 justify-center">
          <div className="w-2 h-2 bg-terminal-green rounded-full" />
          <div className="w-2 h-2 bg-terminal-green rounded-full opacity-50" />
        </div>
      </div>

      {/* System Status */}
      <div className="border-4 border-digital-blue rounded-2xl p-6 bg-card"
        style={{
          boxShadow: '0 0 20px hsl(var(--digital-blue) / 0.3)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="module-header">SYSTEM STATUS</h3>
          <div className="flex gap-2">
            <Activity className="w-4 h-4 text-terminal-green" />
            <Zap className="w-4 h-4 text-analog-yellow" />
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span>CPU</span>
              <span className="text-terminal-green">78%</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div className="h-full bg-terminal-green" style={{ width: '78%', boxShadow: '0 0 10px hsl(var(--terminal-green))' }} />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span>MEMORY</span>
              <span className="text-analog-yellow">45%</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div className="h-full bg-analog-yellow" style={{ width: '45%', boxShadow: '0 0 10px hsl(var(--analog-yellow))' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span>NETWORK</span>
              <span className="text-pixel-red">92%</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div className="h-full bg-pixel-red" style={{ width: '92%', boxShadow: '0 0 10px hsl(var(--pixel-red))' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Label */}
      <div className="border-4 border-analog-yellow rounded-2xl p-4 bg-background flex items-center justify-center min-h-[200px]"
        style={{
          boxShadow: '0 0 20px hsl(var(--analog-yellow) / 0.2)'
        }}
      >
        <h3 className="font-mono font-bold text-2xl text-analog-yellow"
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'upright',
            letterSpacing: '0.2em'
          }}
        >
          ポータル
        </h3>
      </div>
    </aside>
  );
};

export default EditorialSidebar;
