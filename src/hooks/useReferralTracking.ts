import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ReferralStats {
  referral_code: string;
  share_count: number;
  visit_count: number;
  bonus_entries: number;
}

export const useReferralTracking = (walletAddress: string | null) => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Get or create referral link for wallet
  const initializeReferral = useCallback(async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('track-referral', {
        body: { action: 'get_link', wallet_address: walletAddress }
      });

      if (error) throw error;
      
      if (data?.referral_link) {
        setReferralCode(data.referral_link.referral_code);
        setStats({
          referral_code: data.referral_link.referral_code,
          share_count: data.referral_link.share_count || 0,
          visit_count: data.referral_link.visit_count || 0,
          bonus_entries: data.referral_link.bonus_entries || 0
        });
      }
    } catch (err) {
      console.error('Failed to initialize referral:', err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  // Record a share
  const recordShare = useCallback(async () => {
    if (!walletAddress) return;
    
    try {
      await supabase.functions.invoke('track-referral', {
        body: { action: 'record_share', wallet_address: walletAddress }
      });
      
      // Optimistically update stats
      setStats(prev => prev ? { ...prev, share_count: prev.share_count + 1 } : null);
    } catch (err) {
      console.error('Failed to record share:', err);
    }
  }, [walletAddress]);

  // Get share URL with referral code
  const getShareUrl = useCallback(() => {
    if (!referralCode) return window.location.origin;
    return `${window.location.origin}?ref=${referralCode}`;
  }, [referralCode]);

  // Share on Twitter with tracking
  const shareOnTwitter = useCallback(async () => {
    const shareUrl = getShareUrl();
    const text = "Join M9 Protocol - an autonomous AI that creates and trades tokens on Solana. Get lucky and win rewards!";
    
    // Record the share
    await recordShare();
    
    // Open Twitter share intent
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  }, [getShareUrl, recordShare]);

  // Refresh stats
  const refreshStats = useCallback(async () => {
    if (!walletAddress) return;
    
    try {
      const { data } = await supabase.functions.invoke('track-referral', {
        body: { action: 'get_stats', wallet_address: walletAddress }
      });
      
      if (data?.stats) {
        setStats({
          referral_code: data.stats.referral_code || referralCode || '',
          share_count: data.stats.share_count || 0,
          visit_count: data.stats.visit_count || 0,
          bonus_entries: data.stats.bonus_entries || 0
        });
      }
    } catch (err) {
      console.error('Failed to refresh stats:', err);
    }
  }, [walletAddress, referralCode]);

  // Initialize on wallet connect
  useEffect(() => {
    if (walletAddress) {
      initializeReferral();
    } else {
      setStats(null);
      setReferralCode(null);
    }
  }, [walletAddress, initializeReferral]);

  return {
    stats,
    referralCode,
    loading,
    shareOnTwitter,
    getShareUrl,
    refreshStats
  };
};
