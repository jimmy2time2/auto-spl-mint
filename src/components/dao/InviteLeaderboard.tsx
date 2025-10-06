import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InviteStats {
  wallet: string;
  count: number;
}

export function InviteLeaderboard() {
  const { toast } = useToast();
  const [leaderboard, setLeaderboard] = useState<InviteStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [walletAddress] = useState('0x1234...abcd'); // Replace with actual wallet

  useEffect(() => {
    loadLeaderboard();
    generateInviteCode();
  }, []);

  async function loadLeaderboard() {
    try {
      const { data, error } = await supabase
        .from('invite_log')
        .select('inviter_wallet')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Count invites per wallet
      const counts = new Map<string, number>();
      data?.forEach((invite: any) => {
        const current = counts.get(invite.inviter_wallet) || 0;
        counts.set(invite.inviter_wallet, current + 1);
      });

      // Convert to array and sort
      const stats: InviteStats[] = Array.from(counts.entries())
        .map(([wallet, count]) => ({ wallet, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setLeaderboard(stats);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateInviteCode() {
    try {
      const { data, error } = await supabase.functions.invoke('dao-generate-invite', {
        body: { wallet_address: walletAddress }
      });

      if (error) throw error;
      setInviteCode(data.invite_code);
    } catch (error) {
      console.error('Failed to generate invite code:', error);
    }
  }

  async function copyInviteLink() {
    if (!inviteCode) return;

    const inviteUrl = `${window.location.origin}?invite=${inviteCode}`;
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Invite link copied to clipboard'
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <CardTitle>Invite Leaders</CardTitle>
        </div>
        <CardDescription>Top inviters this season</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Your Invite Code */}
        {inviteCode && (
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">YOUR INVITE CODE</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-background px-2 py-1 rounded">
                {inviteCode}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={copyInviteLink}
                className="h-8"
              >
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No invites yet</p>
          ) : (
            leaderboard.map((stat, index) => (
              <div
                key={stat.wallet}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`
                    text-sm font-bold w-6 text-center
                    ${index === 0 ? 'text-yellow-500' : ''}
                    ${index === 1 ? 'text-gray-400' : ''}
                    ${index === 2 ? 'text-orange-600' : ''}
                  `}>
                    #{index + 1}
                  </span>
                  <code className="text-xs">{stat.wallet.slice(0, 12)}...</code>
                </div>
                <span className="text-sm font-semibold">{stat.count}</span>
              </div>
            ))
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2">
          Invite 10+ wallets to unlock DAO eligibility
        </div>
      </CardContent>
    </Card>
  );
}
