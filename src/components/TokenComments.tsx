import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  wallet_address: string;
  content: string;
  created_at: string;
}

interface TokenCommentsProps {
  tokenId: string;
}

export const TokenComments = ({ tokenId }: TokenCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`comments-${tokenId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'token_comments',
          filter: `token_id=eq.${tokenId}`,
        },
        (payload) => {
          setComments((prev) => [payload.new as Comment, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tokenId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('token_comments')
        .select('*')
        .eq('token_id', tokenId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }

    if (!walletAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter your wallet address",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('token_comments')
        .insert({
          token_id: tokenId,
          wallet_address: walletAddress.trim(),
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment("");
      toast({
        title: "Success",
        description: "Comment posted",
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      <div className="space-y-3 pb-4 border-b border-border">
        <input
          type="text"
          placeholder="Your wallet address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          className="w-full bg-background border border-border px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[60px] text-xs font-mono resize-none bg-background"
          maxLength={500}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {newComment.length}/500
          </span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !newComment.trim() || !walletAddress.trim()}
            className="text-xs font-bold uppercase"
          >
            {submitting ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-4 text-xs text-muted-foreground">
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No comments yet. Be the first!
        </div>
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="space-y-3 pr-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-3 bg-muted/30 border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-primary font-bold">
                    {truncateAddress(comment.wallet_address)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
