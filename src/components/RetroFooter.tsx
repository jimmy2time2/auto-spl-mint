import { Phone, Mail, MapPin } from "lucide-react";

const RetroFooter = () => {
  return (
    <footer className="mt-20 border-t-4 border-terminal-green pt-12 pb-8"
      style={{
        background: 'linear-gradient(180deg, hsl(220 80% 6%) 0%, hsl(220 70% 4%) 100%)'
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Terminal Interface */}
        <div className="border-4 border-terminal-green rounded-2xl p-6 bg-card"
          style={{
            boxShadow: '0 0 25px hsl(var(--terminal-green) / 0.3)'
          }}
        >
          <div className="module-header mb-4">HOTLINE_TERMINAL.EXE</div>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-terminal-green" />
              <span className="text-terminal-green">+1 (555) 0123-4567</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-analog-yellow" />
              <span className="text-analog-yellow">hello@future.io</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-pixel-red" />
              <span className="text-pixel-red">Tokyo, JP</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="border-4 border-digital-blue rounded-2xl p-6 bg-card"
          style={{
            boxShadow: '0 0 25px hsl(var(--digital-blue) / 0.3)'
          }}
        >
          <div className="module-header mb-4">NAVIGATION_</div>
          <nav className="space-y-2 font-mono text-sm">
            <a href="#" className="block text-foreground hover:text-terminal-green transition-colors">
              → HOME
            </a>
            <a href="#" className="block text-foreground hover:text-terminal-green transition-colors">
              → SERVICES
            </a>
            <a href="#" className="block text-foreground hover:text-terminal-green transition-colors">
              → PROJECTS
            </a>
            <a href="#" className="block text-foreground hover:text-terminal-green transition-colors">
              → CONTACT
            </a>
          </nav>
        </div>

        {/* Status Display */}
        <div className="border-4 border-analog-yellow rounded-2xl p-6 bg-card"
          style={{
            boxShadow: '0 0 25px hsl(var(--analog-yellow) / 0.3)'
          }}
        >
          <div className="module-header mb-4 text-analog-yellow">STATUS_MONITOR</div>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span>SERVER:</span>
              <span className="text-terminal-green">ONLINE</span>
            </div>
            <div className="flex justify-between">
              <span>UPTIME:</span>
              <span className="text-terminal-green">99.9%</span>
            </div>
            <div className="flex justify-between">
              <span>LOAD:</span>
              <span className="text-analog-yellow">OPTIMAL</span>
            </div>
            <div className="mt-4 pt-4 border-t border-terminal-green/30">
              <span className="text-terminal-green animate-pulse">● SYSTEM READY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t-2 border-terminal-green/30 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="font-mono text-xs text-muted-foreground">
          © 2025 FUTURE_SYSTEMS_INC. ALL_RIGHTS_RESERVED
        </div>
        <div className="flex gap-4 font-mono text-xs">
          <a href="#" className="text-terminal-green hover:underline">PRIVACY_POLICY</a>
          <a href="#" className="text-terminal-green hover:underline">TERMS_OF_SERVICE</a>
        </div>
      </div>
    </footer>
  );
};

export default RetroFooter;
