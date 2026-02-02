import { Link, useLocation } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState, useEffect } from "react";
import { useEngagementTracking } from "@/hooks/useEngagementTracking";
import ThemeSwitch from "@/components/ThemeSwitch";

const Navigation = () => {
  const location = useLocation();
  const { connected } = useWallet();
  const { trackEvent } = useEngagementTracking();
  
  useEffect(() => {
    if (connected) {
      trackEvent('wallet_connect');
    }
  }, [connected]);

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

        {/* Status */}
        <div className="hidden sm:flex items-center px-4 border-r border-primary/30 gap-2 flex-1">
          <span className="status-live" />
          <span className="data-sm">LIVE</span>
        </div>

        {/* Theme Switch */}
        <div className="hidden sm:flex items-center border-r border-primary/30">
          <ThemeSwitch />
        </div>

        {/* Wallet */}
        <div className="flex items-center">
          <WalletMultiButton className="!bg-transparent !text-foreground hover:!bg-primary hover:!text-primary-foreground !border-0 !border-l-2 !border-primary !font-mono !text-[9px] !font-bold !h-full !px-4 !rounded-none !uppercase !tracking-wider" />
        </div>
      </div>
    </header>
  );
};

export default Navigation;
