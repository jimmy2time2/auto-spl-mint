import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Vote, Users, Wallet, Clock, CheckCircle, AlertCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type DaoProposal = Tables<"dao_proposals">;
type DaoTreasury = Tables<"dao_treasury">;
type DaoEligibility = Tables<"dao_eligibility">;

const DAOPanel = () => {
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
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline" className="border-primary text-primary text-[10px]">OPEN</Badge>;
      case "passed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">PASSED</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="text-[10px]">REJECTED</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{status.toUpperCase()}</Badge>;
    }
  };

  const filteredProposals = proposals.filter((p) => {
    if (activeTab === "active") return p.status === "open";
    if (activeTab === "passed") return p.status === "passed";
    return p.status === "rejected";
  });

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="data-sm">LOADING<span className="cursor-blink">_</span></div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-primary/30">
        <div className="border-r border-b md:border-b-0 border-primary/30 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Wallet className="h-3 w-3 text-primary" />
            <p className="text-[10px] text-muted-foreground">TREASURY</p>
          </div>
          <p className="data-sm glow-text tabular-nums">
            {treasury?.balance?.toLocaleString() || "0"} SOL
          </p>
        </div>
        <div className="border-r-0 md:border-r border-b md:border-b-0 border-primary/30 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Vote className="h-3 w-3 text-primary" />
            <p className="text-[10px] text-muted-foreground">PROPOSALS</p>
          </div>
          <p className="data-sm tabular-nums">{proposals.length}</p>
        </div>
        <div className="border-r border-primary/30 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle className="h-3 w-3 text-green-400" />
            <p className="text-[10px] text-muted-foreground">PASSED</p>
          </div>
          <p className="data-sm tabular-nums text-green-400">
            {proposals.filter(p => p.status === "passed").length}
          </p>
        </div>
        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="h-3 w-3 text-primary" />
            <p className="text-[10px] text-muted-foreground">STATUS</p>
          </div>
          <p className="data-sm">
            {!connected ? "—" : eligibility?.is_eligible ? "ELIGIBLE" : "PENDING"}
          </p>
        </div>
      </div>

      {/* Eligibility Notice */}
      {connected && !eligibility?.is_eligible && (
        <div className="bg-primary/5 p-3 border-b border-primary/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground">
              10+ invites OR 30+ day holdings required to vote.
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-primary/30">
        {(["active", "passed", "rejected"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-[10px] transition-colors ${
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
      <ScrollArea className="h-[300px]">
        {filteredProposals.length === 0 ? (
          <div className="p-8 text-center">
            <Vote className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="data-sm text-muted-foreground">NO {activeTab.toUpperCase()} PROPOSALS</p>
          </div>
        ) : (
          <div className="divide-y divide-primary/20">
            {filteredProposals.map((proposal) => {
              const totalVotes = proposal.votes_yes + proposal.votes_no + proposal.votes_abstain;
              const quorumProgress = (totalVotes / proposal.quorum_required) * 100;

              return (
                <div key={proposal.id} className="p-4 hover:bg-primary/5 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(proposal.status)}
                      {proposal.is_ai_generated && (
                        <Badge variant="secondary" className="text-[9px]">AI</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {getTimeRemaining(proposal.closes_at)}
                    </div>
                  </div>
                  <h3 className="data-sm font-bold mb-1">{proposal.title}</h3>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 mb-3">
                    {proposal.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-green-400">{proposal.votes_yes}Y</span>
                      <span className="text-red-400">{proposal.votes_no}N</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <Progress value={Math.min(quorumProgress, 100)} className="h-1.5 flex-1" />
                      <span className="text-[10px] text-muted-foreground">{Math.round(quorumProgress)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default DAOPanel;
