import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@solana/wallet-adapter-react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEngagementTracking } from "@/hooks/useEngagementTracking";
import { Vote, Users, Wallet, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type DaoProposal = Tables<"dao_proposals">;
type DaoTreasury = Tables<"dao_treasury">;
type DaoEligibility = Tables<"dao_eligibility">;

const DAO = () => {
  useEngagementTracking();
  const { publicKey, connected } = useWallet();
  const [proposals, setProposals] = useState<DaoProposal[]>([]);
  const [treasury, setTreasury] = useState<DaoTreasury | null>(null);
  const [eligibility, setEligibility] = useState<DaoEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "passed" | "rejected">("active");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const [proposalsRes, treasuryRes] = await Promise.all([
        supabase.from("dao_proposals").select("*").order("created_at", { ascending: false }),
        supabase.from("dao_treasury").select("*").order("last_update", { ascending: false }).limit(1).single(),
      ]);

      if (proposalsRes.data) setProposals(proposalsRes.data);
      if (treasuryRes.data) setTreasury(treasuryRes.data);

      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const checkEligibility = async () => {
      if (!connected || !publicKey) {
        setEligibility(null);
        return;
      }

      const { data } = await supabase
        .from("dao_eligibility")
        .select("*")
        .eq("wallet_address", publicKey.toBase58())
        .eq("is_eligible", true)
        .limit(1)
        .single();

      setEligibility(data);
    };

    checkEligibility();
  }, [connected, publicKey]);

  const formatWallet = (address: string) => {
    if (address.length <= 8) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getTimeRemaining = (closesAt: string) => {
    const now = new Date();
    const closes = new Date(closesAt);
    const diff = closes.getTime() - now.getTime();
    
    if (diff <= 0) return "Closed";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h left`;
    return `${hours}h left`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline" className="border-primary text-primary">OPEN</Badge>;
      case "passed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">PASSED</Badge>;
      case "rejected":
        return <Badge variant="destructive">REJECTED</Badge>;
      default:
        return <Badge variant="secondary">{status.toUpperCase()}</Badge>;
    }
  };

  const filteredProposals = proposals.filter((p) => {
    if (activeTab === "active") return p.status === "open";
    if (activeTab === "passed") return p.status === "passed";
    return p.status === "rejected";
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="data-lg mb-2">LOADING<span className="cursor-blink">_</span></div>
          <div className="data-sm text-muted-foreground">FETCHING DAO DATA</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="w-full">
        {/* Header */}
        <section className="border-b-2 border-primary">
          <div className="p-6 sm:p-8 lg:p-12">
            <p className="data-sm text-muted-foreground mb-4">GOVERNANCE</p>
            <h1 className="display-xl mb-4 glow-text">DAO</h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              Participate in M9 governance. Vote on proposals, shape the protocol's future, and earn rewards for active participation.
            </p>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 border-b-2 border-primary">
          <div className="border-r border-b md:border-b-0 border-primary/30 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-primary" />
              <p className="data-sm text-muted-foreground">TREASURY</p>
            </div>
            <p className="display-lg glow-text tabular-nums">
              {treasury?.balance?.toLocaleString() || "0"} SOL
            </p>
          </div>
          <div className="border-r-0 md:border-r border-b md:border-b-0 border-primary/30 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Vote className="h-4 w-4 text-primary" />
              <p className="data-sm text-muted-foreground">PROPOSALS</p>
            </div>
            <p className="display-lg tabular-nums">{proposals.length}</p>
          </div>
          <div className="border-r border-primary/30 p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <p className="data-sm text-muted-foreground">PASSED</p>
            </div>
            <p className="display-lg tabular-nums text-green-400">
              {proposals.filter(p => p.status === "passed").length}
            </p>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <p className="data-sm text-muted-foreground">YOUR STATUS</p>
            </div>
            <p className="display-lg">
              {!connected ? "—" : eligibility?.is_eligible ? "ELIGIBLE" : "PENDING"}
            </p>
          </div>
        </section>

        {/* Eligibility Info */}
        {connected && !eligibility?.is_eligible && (
          <section className="border-b-2 border-primary bg-primary/5 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="data-sm text-primary mb-1">ELIGIBILITY REQUIREMENTS</p>
                <p className="text-xs text-muted-foreground">
                  To participate in DAO voting, you need either 10+ successful invites OR hold tokens for 30+ days.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Proposals Section */}
        <section className="border-b-2 border-primary">
          {/* Tab Navigation */}
          <div className="flex border-b border-primary/30">
            {(["active", "passed", "rejected"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 data-sm transition-colors ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-primary/10"
                }`}
              >
                {tab.toUpperCase()} ({proposals.filter(p => {
                  if (tab === "active") return p.status === "open";
                  return p.status === tab;
                }).length})
              </button>
            ))}
          </div>

          {/* Proposals List */}
          <ScrollArea className="h-[500px]">
            {filteredProposals.length === 0 ? (
              <div className="p-12 text-center">
                <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="data-sm text-muted-foreground">NO {activeTab.toUpperCase()} PROPOSALS</p>
              </div>
            ) : (
              <div className="divide-y divide-primary/20">
                {filteredProposals.map((proposal) => {
                  const totalVotes = proposal.votes_yes + proposal.votes_no + proposal.votes_abstain;
                  const quorumProgress = (totalVotes / proposal.quorum_required) * 100;
                  const yesPercent = totalVotes > 0 ? (proposal.votes_yes / totalVotes) * 100 : 0;

                  return (
                    <div key={proposal.id} className="p-6 hover:bg-primary/5 transition-colors">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusBadge(proposal.status)}
                            {proposal.is_ai_generated && (
                              <Badge variant="secondary" className="text-xs">AI GENERATED</Badge>
                            )}
                            {proposal.tags?.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <h3 className="display-lg mb-1">{proposal.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {proposal.description}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="data-sm text-muted-foreground mb-1">PROPOSER</p>
                          <p className="data-sm">{formatWallet(proposal.created_by)}</p>
                        </div>
                        <div>
                          <p className="data-sm text-muted-foreground mb-1">TIME</p>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <p className="data-sm">{getTimeRemaining(proposal.closes_at)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="data-sm text-muted-foreground mb-1">VOTES</p>
                          <div className="flex items-center gap-2">
                            <span className="data-sm text-green-400">{proposal.votes_yes}Y</span>
                            <span className="data-sm text-red-400">{proposal.votes_no}N</span>
                            <span className="data-sm text-muted-foreground">{proposal.votes_abstain}A</span>
                          </div>
                        </div>
                        <div>
                          <p className="data-sm text-muted-foreground mb-1">QUORUM</p>
                          <div className="flex items-center gap-2">
                            <Progress value={Math.min(quorumProgress, 100)} className="h-2 flex-1" />
                            <span className="data-sm">{Math.round(quorumProgress)}%</span>
                          </div>
                        </div>
                      </div>

                      {proposal.status === "open" && totalVotes > 0 && (
                        <div className="mt-4">
                          <div className="h-2 w-full bg-red-500/30 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 transition-all"
                              style={{ width: `${yesPercent}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="data-sm text-green-400">{Math.round(yesPercent)}% YES</span>
                            <span className="data-sm text-red-400">{Math.round(100 - yesPercent)}% NO</span>
                          </div>
                        </div>
                      )}

                      {proposal.ai_vote && (
                        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded">
                          <p className="data-sm text-primary mb-1">AI VOTE: {proposal.ai_vote.toUpperCase()}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </section>

        {/* Treasury History */}
        {treasury && (
          <section className="border-b-2 border-primary">
            <div className="border-b border-primary/30 px-6 py-4">
              <h2 className="data-sm">TREASURY INFO</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="border-r border-b md:border-b-0 border-primary/30 p-6">
                <p className="data-sm text-muted-foreground mb-2">TOTAL RECEIVED</p>
                <p className="display-lg glow-text">{treasury.total_received?.toLocaleString()} SOL</p>
              </div>
              <div className="border-r border-b md:border-b-0 border-primary/30 p-6">
                <p className="data-sm text-muted-foreground mb-2">TOTAL DISTRIBUTED</p>
                <p className="display-lg">{treasury.total_distributed?.toLocaleString()} SOL</p>
              </div>
              <div className="p-6">
                <p className="data-sm text-muted-foreground mb-2">LAST UPDATE</p>
                <p className="display-lg">{new Date(treasury.last_update).toLocaleDateString()}</p>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="p-6 sm:p-8 text-center">
          <p className="display-lg mb-2 glow-text">M9 DAO</p>
          <p className="data-sm text-muted-foreground">
            DECENTRALIZED GOVERNANCE · COMMUNITY FIRST
          </p>
        </footer>
      </main>
    </div>
  );
};

export default DAO;
