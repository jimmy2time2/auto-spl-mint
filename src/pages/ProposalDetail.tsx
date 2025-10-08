/**
 * Proposal Detail Page
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ThumbsUp, ThumbsDown, Minus, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Proposal {
  id: string;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
  closes_at: string;
  status: string;
  tags: string[];
  votes_yes: number;
  votes_no: number;
  votes_abstain: number;
  quorum_required: number;
  is_ai_generated: boolean;
  ai_vote: string | null;
  payout_address: string | null;
  payout_amount: number | null;
}

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [walletAddress] = useState('0x1234...abcd'); // Replace with actual wallet

  useEffect(() => {
    loadProposal();
    checkIfVoted();
  }, [id]);

  async function loadProposal() {
    try {
      const { data, error } = await supabase
        .from('dao_proposals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProposal(data as Proposal);
    } catch (error) {
      console.error('Failed to load proposal:', error);
      toast({
        title: 'Error',
        description: 'Failed to load proposal',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  async function checkIfVoted() {
    try {
      const { data } = await supabase
        .from('dao_votes')
        .select('vote')
        .eq('proposal_id', id)
        .eq('wallet_address', walletAddress)
        .single();

      if (data) {
        setHasVoted(true);
        setUserVote(data.vote);
      }
    } catch (error) {
      // Not voted yet
    }
  }

  async function handleVote(vote: 'yes' | 'no' | 'abstain') {
    if (!proposal || hasVoted) return;

    setVoting(true);
    try {
      const { data, error } = await supabase.functions.invoke('dao-vote', {
        body: {
          proposal_id: proposal.id,
          wallet_address: walletAddress,
          vote
        }
      });

      if (error) throw error;

      toast({
        title: 'Vote Cast',
        description: `You voted ${vote.toUpperCase()} on this proposal`
      });

      setHasVoted(true);
      setUserVote(vote);
      loadProposal();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cast vote',
        variant: 'destructive'
      });
    } finally {
      setVoting(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Proposal not found</p>
            <Link to="/dao">
              <Button className="mt-4">Back to DAO</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalVotes = proposal.votes_yes + proposal.votes_no + proposal.votes_abstain;
  const yesPercentage = totalVotes > 0 ? (proposal.votes_yes / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (proposal.votes_no / totalVotes) * 100 : 0;
  const abstainPercentage = totalVotes > 0 ? (proposal.votes_abstain / totalVotes) * 100 : 0;
  const quorumProgress = (totalVotes / proposal.quorum_required) * 100;

  const isOpen = proposal.status === 'open' && new Date(proposal.closes_at) > new Date();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Back Button */}
      <Link to="/dao">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to DAO
        </Button>
      </Link>

      {/* Proposal Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Badge className={
                  proposal.status === 'open' ? 'bg-green-500' :
                  proposal.status === 'passed' ? 'bg-blue-500' :
                  proposal.status === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
                }>
                  {proposal.status.toUpperCase()}
                </Badge>
                {proposal.is_ai_generated && (
                  <Badge variant="outline" className="border-purple-500">
                    🧠 AI GENERATED
                  </Badge>
                )}
                {proposal.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
              <CardTitle className="text-3xl mb-2">{proposal.title}</CardTitle>
              <CardDescription>
                Proposed by {proposal.created_by.slice(0, 12)}... on{' '}
                {new Date(proposal.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
            {isOpen && (
              <div className="text-right ml-4">
                <Clock className="h-5 w-5 inline mr-1" />
                <p className="text-sm font-semibold">
                  {calculateTimeRemaining(proposal.closes_at)}
                </p>
                <p className="text-xs text-muted-foreground">remaining</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{proposal.description}</p>
          </div>

          {proposal.payout_address && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm font-semibold mb-2">💰 Treasury Payout</p>
              <p className="text-xs text-muted-foreground">
                If passed, {proposal.payout_amount} SOL will be sent to{' '}
                {proposal.payout_address.slice(0, 12)}...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voting Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cast Your Vote</CardTitle>
          <CardDescription>
            {hasVoted ? `You voted ${userVote?.toUpperCase()}` : 'Choose your position'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isOpen && !hasVoted ? (
            <div className="grid grid-cols-3 gap-4">
              <Button
                onClick={() => handleVote('yes')}
                disabled={voting}
                className="h-20 flex flex-col items-center justify-center"
                variant="outline"
              >
                <ThumbsUp className="h-6 w-6 mb-2 text-green-500" />
                <span>Yes</span>
              </Button>
              <Button
                onClick={() => handleVote('no')}
                disabled={voting}
                className="h-20 flex flex-col items-center justify-center"
                variant="outline"
              >
                <ThumbsDown className="h-6 w-6 mb-2 text-red-500" />
                <span>No</span>
              </Button>
              <Button
                onClick={() => handleVote('abstain')}
                disabled={voting}
                className="h-20 flex flex-col items-center justify-center"
                variant="outline"
              >
                <Minus className="h-6 w-6 mb-2 text-gray-500" />
                <span>Abstain</span>
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {hasVoted ? 'Vote already cast' : 'Voting is closed'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Voting Results</CardTitle>
          <CardDescription>{totalVotes} votes cast</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vote Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-green-500 font-semibold">Yes</span>
              <span className="font-bold">{proposal.votes_yes} ({yesPercentage.toFixed(1)}%)</span>
            </div>
            <Progress value={yesPercentage} className="h-3" />

            <div className="flex items-center justify-between">
              <span className="text-red-500 font-semibold">No</span>
              <span className="font-bold">{proposal.votes_no} ({noPercentage.toFixed(1)}%)</span>
            </div>
            <Progress value={noPercentage} className="h-3" />

            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-semibold">Abstain</span>
              <span className="font-bold">{proposal.votes_abstain} ({abstainPercentage.toFixed(1)}%)</span>
            </div>
            <Progress value={abstainPercentage} className="h-3" />
          </div>

          {/* Quorum */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Quorum Progress</span>
              <span className="font-semibold">
                {totalVotes} / {proposal.quorum_required} ({Math.min(quorumProgress, 100).toFixed(1)}%)
              </span>
            </div>
            <Progress value={Math.min(quorumProgress, 100)} className="h-2" />
            {quorumProgress < 100 && (
              <p className="text-xs text-muted-foreground">
                {proposal.quorum_required - totalVotes} more votes needed to reach quorum
              </p>
            )}
          </div>

          {/* AI Vote */}
          {proposal.ai_vote && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <p className="text-sm font-semibold mb-1">🧠 AI Mind's Vote</p>
              <p className="text-lg font-bold text-purple-500">{proposal.ai_vote.toUpperCase()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                (Non-binding, for entertainment purposes)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function calculateTimeRemaining(closesAt: string) {
  const remaining = new Date(closesAt).getTime() - Date.now();
  if (remaining <= 0) return 'Closed';
  
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return `${hours}h ${minutes}m`;
}
