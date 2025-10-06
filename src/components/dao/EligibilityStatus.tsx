import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EligibilityStatusProps {
  walletAddress: string;
}

interface Eligibility {
  is_eligible: boolean;
  eligibility_type: string;
  eligibility_date: string;
  active: boolean;
  invite_count: number;
  ai_score: number;
}

export function EligibilityStatus({ walletAddress }: EligibilityStatusProps) {
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadEligibility();
  }, [walletAddress]);

  async function loadEligibility() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('dao_eligibility')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (data) {
        setEligibility(data as Eligibility);
      }
    } catch (error) {
      console.error('Failed to load eligibility:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkEligibility() {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('dao-check-eligibility', {
        body: { wallet_address: walletAddress }
      });

      if (error) throw error;

      loadEligibility();
    } catch (error) {
      console.error('Failed to check eligibility:', error);
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Eligibility</CardTitle>
        <CardDescription>DAO voting rights status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          {eligibility?.is_eligible ? (
            <Badge className="bg-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              ELIGIBLE
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              NOT ELIGIBLE
            </Badge>
          )}
        </div>

        {eligibility && (
          <>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Qualification Type</span>
                <span className="font-semibold capitalize">{eligibility.eligibility_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invites Sent</span>
                <span className="font-semibold">{eligibility.invite_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">AI Score</span>
                <span className="font-semibold">{eligibility.ai_score.toFixed(1)}</span>
              </div>
            </div>

            {eligibility.is_eligible && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm">
                <p className="font-semibold text-green-500 mb-1">✓ You're Eligible!</p>
                <p className="text-muted-foreground text-xs">
                  You can create proposals and vote on DAO decisions
                </p>
              </div>
            )}

            {!eligibility.is_eligible && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-semibold mb-2">How to Qualify:</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• Hold a token for 30+ days</li>
                  <li>• Invite 10+ new wallets (currently: {eligibility.invite_count})</li>
                  <li>• Achieve high AI participation score</li>
                </ul>
              </div>
            )}
          </>
        )}

        <Button
          onClick={checkEligibility}
          disabled={checking}
          variant="outline"
          className="w-full"
        >
          {checking ? 'Checking...' : 'Refresh Status'}
        </Button>
      </CardContent>
    </Card>
  );
}
