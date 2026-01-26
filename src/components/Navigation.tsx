import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState, useEffect } from "react";
import { useEngagementTracking } from "@/hooks/useEngagementTracking";

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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { path: "/trade", label: "TRADE" },
    { path: "/explorer", label: "EXPLORE" },
    { path: "/logbook", label: "LOG" },
  ];
  
  return (
    <header className="border-b-2 border-primary bg-background sticky top-0 z-50">
      <div className="flex items-stretch justify-between">
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center border-r-2 border-primary px-5 py-3 hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <span className="display-lg">M9</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-stretch flex-1">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              className={`flex items-center px-5 border-r border-primary/30 data-sm transition-colors ${
                isActive(link.path) 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary/10'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {connected && (
            <Link 
              to="/wallet" 
              className={`flex items-center px-5 border-r border-primary/30 data-sm transition-colors ${
                isActive('/wallet') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary/10'
              }`}
            >
              WALLET
            </Link>
          )}
        </nav>

        {/* Status */}
        <div className="hidden lg:flex items-center px-4 border-r border-primary/30 gap-2">
          <span className="status-live" />
          <span className="data-sm">LIVE</span>
        </div>

        {/* Wallet */}
        <div className="flex items-center">
          <WalletMultiButton className="!bg-transparent !text-foreground hover:!bg-primary hover:!text-primary-foreground !border-0 !border-l-2 !border-primary !font-mono !text-[9px] !font-bold !h-full !px-4 !rounded-none !uppercase !tracking-wider" />
        </div>
        
        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden border-l-2 border-primary px-4 py-2 hover:bg-primary/10 transition-colors data-sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '≡'}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t-2 border-primary">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              className={`block px-4 py-3 border-b border-primary/30 data-sm transition-colors ${
                isActive(link.path) 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary/10'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {connected && (
            <Link 
              to="/wallet"
              className={`block px-4 py-3 border-b border-primary/30 data-sm transition-colors ${
                isActive('/wallet') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-primary/10'
              }`}
            >
              WALLET
            </Link>
          )}
        </nav>
      )}
    </header>
  );
};

export default Navigation;
