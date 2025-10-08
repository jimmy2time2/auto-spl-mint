import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ProposalDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const connectedWallet = "YOUR_WALLET_ADDRESS"; // TODO: Get from wallet context
  const [voting, setVoting] = useState(false);

  const { data: proposal, isLoading } = useQuery({
    queryKey: ["proposal", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("dao_proposals")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: userVote } = useQuery({
    queryKey: ["user-vote", id, connectedWallet],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("dao_votes")
        .select("*")
        .eq("proposal_id", id)
        .eq("wallet_address", connectedWallet)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as any;
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (vote: "yes" | "no" | "abstain") => {
      const { error } = await (supabase as any)
        .from("dao_votes")
        .insert({
          proposal_id: id!,
          wallet_address: connectedWallet,
          vote,
          vote_power: 1, // TODO: Calculate based on holdings
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      queryClient.invalidateQueries({ queryKey: ["user-vote", id, connectedWallet] });
      toast({
        title: "Vote submitted!",
        description: "Your vote has been recorded.",
      });
      setVoting(false);
    },
    onError: (error) => {
      toast({
        title: "Error voting",
        description: error.message,
        variant: "destructive",
      });
      setVoting(false);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading proposal...</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-4">Proposal not found</p>
          <Link to="/dao">
            <Button>Back to DAO</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalVotes = proposal.votes_yes + proposal.votes_no + proposal.votes_abstain;
  const yesPercent = totalVotes > 0 ? (proposal.votes_yes / totalVotes) * 100 : 0;
  const noPercent = totalVotes > 0 ? (proposal.votes_no / totalVotes) * 100 : 0;
  const abstainPercent = totalVotes > 0 ? (proposal.votes_abstain / totalVotes) * 100 : 0;
  const quorumPercent = (totalVotes / proposal.quorum_required) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-500";
      case "passed": return "bg-blue-500";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const handleVote = async (vote: "yes" | "no" | "abstain") => {
    setVoting(true);
    await voteMutation.mutateAsync(vote);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <Link to="/dao" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to DAO
        </Link>

        <Card className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Badge className={getStatusColor(proposal.status)}>
                  {proposal.status}
                </Badge>
                {proposal.is_ai_generated && (
                  <Badge variant="outline" className="gap-1">
                    🧠 AI Generated
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2">{proposal.title}</h1>
              <p className="text-sm text-muted-foreground">
                Created by {proposal.created_by} • {new Date(proposal.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {proposal.tags?.map((tag: string) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Description */}
          <div className="prose prose-sm max-w-none mb-8">
            <p className="whitespace-pre-wrap">{proposal.description}</p>
          </div>

          {/* Payout Info */}
          {proposal.payout_amount && (
            <Card className="p-4 mb-8 bg-muted">
              <h3 className="font-bold mb-2">💰 Payout Details</h3>
              <p className="text-sm">Amount: <span className="font-mono">{proposal.payout_amount} SOL</span></p>
              <p className="text-sm">To: <span className="font-mono">{proposal.payout_address}</span></p>
            </Card>
          )}

          {/* Voting Results */}
          <div className="space-y-6 mb-8">
            <div>
              <h3 className="font-bold mb-4">Voting Results</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-green-500" />
                      Yes
                    </span>
                    <span className="font-bold">{proposal.votes_yes} ({yesPercent.toFixed(1)}%)</span>
                  </div>
                  <Progress value={yesPercent} className="h-3 bg-muted [&>div]:bg-green-500" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="flex items-center gap-2">
                      <ThumbsDown className="w-4 h-4 text-red-500" />
                      No
                    </span>
                    <span className="font-bold">{proposal.votes_no} ({noPercent.toFixed(1)}%)</span>
                  </div>
                  <Progress value={noPercent} className="h-3 bg-muted [&>div]:bg-red-500" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="flex items-center gap-2">
                      <Minus className="w-4 h-4 text-gray-500" />
                      Abstain
                    </span>
                    <span className="font-bold">{proposal.votes_abstain} ({abstainPercent.toFixed(1)}%)</span>
                  </div>
                  <Progress value={abstainPercent} className="h-3 bg-muted [&>div]:bg-gray-500" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2">Quorum Progress</h3>
              <Progress value={quorumPercent} className="h-3 mb-2" />
              <p className="text-sm text-muted-foreground">
                {totalVotes} / {proposal.quorum_required} votes needed
              </p>
            </div>
          </div>

          {/* AI Vote */}
          {proposal.ai_vote && (
            <Card className="p-4 mb-8 bg-primary/10 border-primary">
              <p className="text-sm">
                🧠 <span className="font-bold">The AI Mind voted:</span> {proposal.ai_vote.toUpperCase()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                (AI votes are non-binding and shown for community insight)
              </p>
            </Card>
          )}

          {/* Voting Buttons */}
          {proposal.status === "open" && !userVote && (
            <div className="flex gap-3">
              <Button
                onClick={() => handleVote("yes")}
                disabled={voting}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Vote Yes
              </Button>
              <Button
                onClick={() => handleVote("no")}
                disabled={voting}
                variant="destructive"
                className="flex-1"
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Vote No
              </Button>
              <Button
                onClick={() => handleVote("abstain")}
                disabled={voting}
                variant="outline"
                className="flex-1"
              >
                <Minus className="w-4 h-4 mr-2" />
                Abstain
              </Button>
            </div>
          )}

          {userVote && (
            <Card className="p-4 bg-muted">
              <p className="text-sm text-center">
                ✅ You voted: <span className="font-bold uppercase">{userVote.vote}</span>
              </p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Your vote is locked until {new Date(userVote.locked_until).toLocaleString()}
              </p>
            </Card>
          )}

          {proposal.status !== "open" && !userVote && (
            <Card className="p-4 bg-muted">
              <p className="text-sm text-center text-muted-foreground">
                This proposal is closed
              </p>
            </Card>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProposalDetail;
