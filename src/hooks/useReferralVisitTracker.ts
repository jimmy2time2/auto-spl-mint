import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useReferralVisitTracker = () => {
  const trackVisit = useCallback(async (referralCode: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('track-referral', {
        body: { action: 'track_visit', referral_code: referralCode }
      });

      if (error) {
        console.error('Failed to track referral visit:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error tracking referral visit:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    // Check URL for referral code
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    if (refCode) {
      // Track the visit
      trackVisit(refCode);

      // Store in localStorage to credit later if user connects wallet
      localStorage.setItem('m9_referral_code', refCode);

      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [trackVisit]);

  return { trackVisit };
};
