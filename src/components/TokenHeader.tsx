import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TokenQRCode from "./TokenQRCode";

interface TokenHeaderProps {
  name: string;
  symbol: string;
  mintAddress?: string | null;
  creatorAddress?: string;
  launchTimestamp: string;
}

export const TokenHeader = ({ 
  name, 
  symbol, 
  mintAddress, 
  creatorAddress,
  launchTimestamp 
}: TokenHeaderProps) => {
  const { toast } = useToast();
  const { id: tokenId } = useParams<{ id: string }>();

  const copyAddress = () => {
    if (mintAddress) {
      navigator.clipboard.writeText(mintAddress);
      toast({ title: "Address copied", description: "Token address copied to clipboard" });
    }
  };

  const shareToken = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied", description: "Share link copied to clipboard" });
  };

  const formatAddress = (addr: string) => {
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 30) return `${Math.floor(diffDays / 30)}mo ago`;
    if (diffDays > 0) return `${diffDays}d ago`;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours > 0) return `${diffHours}h ago`;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins}m ago`;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-border">
      <div className="flex items-start gap-4">
        <Link 
          to="/explorer" 
          className="p-2 hover:bg-muted transition-colors border border-border"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        
        {/* QR Code as profile picture */}
        {tokenId && <TokenQRCode tokenId={tokenId} size={56} />}
        
        <div>
          <h1 className="text-lg sm:text-xl font-bold">{name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">${symbol}</span>
            {creatorAddress && (
              <>
                <span className="opacity-50">by</span>
                <span className="font-mono text-xs">{formatAddress(creatorAddress)}</span>
              </>
            )}
            <span className="opacity-50">·</span>
            <span className="text-xs">{getTimeAgo(launchTimestamp)}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-auto sm:ml-0">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={shareToken}
          className="h-8 px-3 text-xs font-bold uppercase"
        >
          <Share2 className="h-3.5 w-3.5 mr-1.5" />
          Share
        </Button>
        {mintAddress && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyAddress}
            className="h-8 px-3 text-xs font-mono"
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            {formatAddress(mintAddress)}
          </Button>
        )}
      </div>
    </div>
  );
};
