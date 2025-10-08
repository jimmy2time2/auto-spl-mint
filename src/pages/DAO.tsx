import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Trophy, Wallet, Plus, Vote } from "lucide-react";
import { Link } from "react-router-dom";
import CreateProposalDialog from "@/components/dao/CreateProposalDialog";
import EligibilityStatus from "@/components/dao/EligibilityStatus";
import InviteLeaderboard from "@/components/dao/InviteLeaderboard";
import TreasuryOverview from "@/components/dao/TreasuryOverview";

const DAO = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const connectedWallet = "YOUR_WALLET_ADDRESS"; // TODO: Get from wallet context

  const { data: proposals, isLoading } = useQuery({
    queryKey: ["dao-proposals", filterTag],
    queryFn: async () => {
      let query = (supabase as any)
        .from("dao_proposals")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterTag) {
        query = query.contains("tags", [filterTag]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: eligibility } = useQuery({
    queryKey: ["dao-eligibility", connectedWallet],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("dao_eligibility")
        .select("*")
        .eq("wallet_address", connectedWallet)
        .eq("active", true)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as any;
    },
  });

  const tags = ["token policy", "treasury", "gameplay", "AI governance", "community"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-500";
      case "passed": return "bg-blue-500";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getTimeRemaining = (closesAt: string) => {
    const now = new Date();
    const closes = new Date(closesAt);
    const diff = closes.getTime() - now.getTime();
    
    if (diff <= 0) return "Closed";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Mind9 DAO</h1>
            <p className="text-muted-foreground">Community governance powered by AI</p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            disabled={!eligibility?.is_eligible}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Proposal
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filter Tags */}
            <Card className="p-4">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={filterTag === null ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFilterTag(null)}
                >
                  All
                </Badge>
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={filterTag === tag ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setFilterTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Proposals List */}
            {isLoading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Loading proposals...</p>
              </Card>
            ) : proposals?.length === 0 ? (
              <Card className="p-8 text-center">
                <Vote className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No proposals yet. Be the first to create one!</p>
              </Card>
            ) : (
              proposals?.map((proposal) => {
                const totalVotes = proposal.votes_yes + proposal.votes_no + proposal.votes_abstain;
                const yesPercent = totalVotes > 0 ? (proposal.votes_yes / totalVotes) * 100 : 0;
                const noPercent = totalVotes > 0 ? (proposal.votes_no / totalVotes) * 100 : 0;

                return (
                  <Link key={proposal.id} to={`/dao/${proposal.id}`}>
                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(proposal.status)}>
                              {proposal.status}
                            </Badge>
                            {proposal.is_ai_generated && (
                              <Badge variant="outline" className="gap-1">
                                🧠 AI Generated
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-xl font-bold mb-2">{proposal.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {proposal.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {proposal.tags?.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>Yes: {proposal.votes_yes}</span>
                          <span>No: {proposal.votes_no}</span>
                          <span>Abstain: {proposal.votes_abstain}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                          <div
                            className="bg-green-500"
                            style={{ width: `${yesPercent}%` }}
                          />
                          <div
                            className="bg-red-500"
                            style={{ width: `${noPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Quorum: {totalVotes}/{proposal.quorum_required}</span>
                        <span>{getTimeRemaining(proposal.closes_at)}</span>
                      </div>

                      {proposal.ai_vote && (
                        <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                          🧠 The AI voted: <span className="font-bold">{proposal.ai_vote}</span>
                        </div>
                      )}
                    </Card>
                  </Link>
                );
              })
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <EligibilityStatus wallet={connectedWallet} eligibility={eligibility} />
            <TreasuryOverview />
            <InviteLeaderboard />
          </div>
        </div>
      </div>

      <CreateProposalDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        wallet={connectedWallet}
      />
    </div>
  );
};

export default DAO;
