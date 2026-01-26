import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState, useEffect } from "react";
import { useEngagementTracking } from "@/hooks/useEngagementTracking";
import { Menu, X } from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  const { connected } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { trackEvent } = useEngagementTracking();
  
  const isActive = (path: string) => location.pathname === path;
  
  useEffect(() => {
    if (connected) {
      trackEvent('wallet_connect');
    }
  }, [connected]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { path: "/", label: "HOME" },
    { path: "/trade", label: "TRADE" },
    { path: "/explorer", label: "EXPLORE" },
    { path: "/logbook", label: "LOGBOOK" },
  ];
  
  return (
    <header className="border-b-2 border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-8 py-3 flex items-center justify-between max-w-7xl">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="border-2 border-primary px-3 py-1 font-bold text-lg md:text-xl tracking-tight hover:bg-primary hover:text-primary-foreground transition-colors">
            M9
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              className={`metric-label text-xs transition-all relative py-2 ${
                isActive(link.path) 
                  ? 'text-foreground font-bold' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
              {isActive(link.path) && (
                <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary" />
              )}
            </Link>
          ))}
          {connected && (
            <Link 
              to="/wallet" 
              className={`metric-label text-xs transition-all relative py-2 ${
                isActive('/wallet') 
                  ? 'text-foreground font-bold' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              WALLET
              {isActive('/wallet') && (
                <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary" />
              )}
            </Link>
          )}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/80 !border-2 !border-primary !font-bold !text-[10px] md:!text-xs !h-9 !px-4 !transition-all uppercase" />
          
          <button
            className="md:hidden border-2 border-primary p-2 hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-border bg-card">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                className={`metric-label text-sm transition-all py-3 px-3 ${
                  isActive(link.path) 
                    ? 'text-foreground font-bold bg-primary/10 border-l-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {connected && (
              <Link 
                to="/wallet"
                className={`metric-label text-sm transition-all py-3 px-3 ${
                  isActive('/wallet') 
                    ? 'text-foreground font-bold bg-primary/10 border-l-2 border-primary' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                WALLET
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navigation;
