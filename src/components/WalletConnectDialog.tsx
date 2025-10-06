import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, ExternalLink } from "lucide-react";

interface WalletConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (address: string) => void;
}

const WalletConnectDialog = ({ open, onOpenChange, onConnect }: WalletConnectDialogProps) => {
  const [connecting, setConnecting] = useState<string | null>(null);

  const wallets = [
    { name: "Phantom", icon: "👻", available: true },
    { name: "Solflare", icon: "☀️", available: true },
    { name: "Backpack", icon: "🎒", available: true },
    { name: "MetaMask", icon: "🦊", available: false },
  ];

  const handleConnect = (walletName: string) => {
    setConnecting(walletName);
    // Simulate wallet connection
    setTimeout(() => {
      const mockAddress = `${walletName.slice(0, 4)}...${Math.random().toString(36).substr(2, 4)}`;
      onConnect(mockAddress);
      setConnecting(null);
      onOpenChange(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-2 border-black bg-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            CONNECT_WALLET
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-widest font-mono">
            Select your Solana wallet to continue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {wallets.map((wallet) => (
            <Button
              key={wallet.name}
              onClick={() => wallet.available && handleConnect(wallet.name)}
              disabled={!wallet.available || connecting !== null}
              className="w-full justify-between border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all h-16 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{wallet.icon}</span>
                <div className="text-left">
                  <div className="font-bold uppercase tracking-wider">{wallet.name}</div>
                  <div className="text-[10px] font-mono">
                    {wallet.available ? 'AVAILABLE' : 'COMING_SOON'}
                  </div>
                </div>
              </div>
              {connecting === wallet.name && (
                <div className="font-mono text-xs animate-pulse">CONNECTING...</div>
              )}
              {wallet.available && connecting !== wallet.name && (
                <ExternalLink className="w-4 h-4" />
              )}
            </Button>
          ))}

          <div className="border-2 border-dashed border-black p-4 bg-secondary mt-6">
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2">
              ⚠ SECURITY_NOTICE
            </div>
            <div className="text-xs font-mono">
              Only connect wallets you trust. VisionFlow will never ask for your private keys.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletConnectDialog;
