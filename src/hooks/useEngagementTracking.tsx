import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to track user engagement for AI decision-making
 */
export const useEngagementTracking = () => {
  const trackEvent = async (eventType: 'wallet_connect' | 'trade' | 'page_view' | 'token_launch') => {
    try {
      await supabase.functions.invoke('track-engagement', {
        body: { eventType }
      });
    } catch (error) {
      console.error('[ENGAGEMENT] Tracking error:', error);
    }
  };

  // Track page views
  useEffect(() => {
    trackEvent('page_view');
  }, []);

  return { trackEvent };
};
