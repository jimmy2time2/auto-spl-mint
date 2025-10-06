/**
 * DAO Page - Community Governance Hub
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { Vote, Users, Trophy, Coins, Plus, Clock } from 'lucide-react';
import { CreateProposalDialog } from '@/components/dao/CreateProposalDialog';
import { EligibilityStatus } from '@/components/dao/EligibilityStatus';
import { InviteLeaderboard } from '@/components/dao/InviteLeaderboard';

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
}

interface Treasury {
  balance: number;
  total_received: number;
  total_distributed: number;
}

export default function DAO() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [treasury, setTreasury] = useState<Treasury | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [walletAddress] = useState('0x1234...abcd'); // Replace with actual wallet connection

  useEffect(() => {
    loadData();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('dao-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dao_proposals'
        },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadData() {
    try {
      const [proposalsRes, treasuryRes] = await Promise.all([
        supabase
          .from('dao_proposals')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('dao_treasury')
          .select('*')
          .single()
      ]);

      if (proposalsRes.data) setProposals(proposalsRes.data as Proposal[]);
      if (treasuryRes.data) setTreasury(treasuryRes.data as Treasury);
    } catch (error) {
      console.error('Failed to load DAO data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      open: 'bg-green-500',
      passed: 'bg-blue-500',
      rejected: 'bg-red-500',
      closed: 'bg-gray-500'
    };
    return <Badge className={variants[status] || 'bg-gray-500'}>{status.toUpperCase()}</Badge>;
  };

  const calculateTimeRemaining = (closesAt: string) => {
    const remaining = new Date(closesAt).getTime() - Date.now();
    if (remaining <= 0) return 'Closed';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${minutes}m`;
  };

  const calculateVotePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return (votes / total) * 100;
  };

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

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">DAO Governance</h1>
            <p className="text-muted-foreground text-lg">
              Shape the future of Mind9 through community proposals and voting
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Create Proposal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Proposals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Vote className="h-5 w-5 text-primary" />
                  <span className="text-3xl font-bold">{proposals.length}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Votes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  <span className="text-3xl font-bold">
                    {proposals.filter(p => p.status === 'open').length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Treasury</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  <span className="text-3xl font-bold">
                    {treasury?.balance.toFixed(2) || '0'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Proposals */}
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="passed">Passed</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4 mt-4">
              {proposals.filter(p => p.status === 'open').map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
              {proposals.filter(p => p.status === 'open').length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No active proposals</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="passed" className="space-y-4 mt-4">
              {proposals.filter(p => p.status === 'passed').map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4 mt-4">
              {proposals.filter(p => p.status === 'rejected').map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </TabsContent>

            <TabsContent value="all" className="space-y-4 mt-4">
              {proposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <EligibilityStatus walletAddress={walletAddress} />
          <InviteLeaderboard />
          
          {/* Treasury Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                <CardTitle>Treasury</CardTitle>
              </div>
              <CardDescription>DAO-controlled funds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-2xl font-bold">{treasury?.balance.toFixed(2) || '0'} SOL</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Received</p>
                  <p className="font-semibold">{treasury?.total_received.toFixed(2) || '0'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Distributed</p>
                  <p className="font-semibold">{treasury?.total_distributed.toFixed(2) || '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateProposalDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        walletAddress={walletAddress}
        onProposalCreated={loadData}
      />
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const totalVotes = proposal.votes_yes + proposal.votes_no + proposal.votes_abstain;
  const yesPercentage = totalVotes > 0 ? (proposal.votes_yes / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (proposal.votes_no / totalVotes) * 100 : 0;
  
  const quorumProgress = (totalVotes / proposal.quorum_required) * 100;

  return (
    <Link to={`/dao/${proposal.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getStatusBadge(proposal.status)}
                {proposal.is_ai_generated && (
                  <Badge variant="outline" className="border-purple-500">
                    🧠 AI GENERATED
                  </Badge>
                )}
                {proposal.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
              <CardTitle className="mb-2">{proposal.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {proposal.description}
              </CardDescription>
            </div>
            {proposal.status === 'open' && (
              <div className="text-right ml-4">
                <p className="text-sm font-semibold">
                  {calculateTimeRemaining(proposal.closes_at)}
                </p>
                <p className="text-xs text-muted-foreground">remaining</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Vote Results */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-500 font-semibold">Yes: {proposal.votes_yes}</span>
              <span className="text-red-500 font-semibold">No: {proposal.votes_no}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
              <div 
                className="bg-green-500 transition-all"
                style={{ width: `${yesPercentage}%` }}
              />
              <div 
                className="bg-red-500 transition-all"
                style={{ width: `${noPercentage}%` }}
              />
            </div>
          </div>

          {/* Quorum Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Quorum Progress</span>
              <span className="font-semibold">
                {totalVotes} / {proposal.quorum_required}
              </span>
            </div>
            <Progress value={Math.min(quorumProgress, 100)} className="h-1" />
          </div>

          {/* AI Vote */}
          {proposal.ai_vote && (
            <div className="text-xs text-muted-foreground italic border-l-2 border-purple-500 pl-2">
              The AI voted 🧠: {proposal.ai_vote.toUpperCase()}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );

  function getStatusBadge(status: string) {
    const variants: Record<string, string> = {
      open: 'bg-green-500',
      passed: 'bg-blue-500',
      rejected: 'bg-red-500',
      closed: 'bg-gray-500'
    };
    return <Badge className={variants[status] || 'bg-gray-500'}>{status.toUpperCase()}</Badge>;
  }

  function calculateTimeRemaining(closesAt: string) {
    const remaining = new Date(closesAt).getTime() - Date.now();
    if (remaining <= 0) return 'Closed';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h ${minutes}m`;
  }
}
