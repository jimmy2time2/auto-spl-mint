import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  wallet_address: string;
  content: string;
  created_at: string;
  token_id: string;
}

const GLOBAL_CHAT_TOKEN_ID = "00000000-0000-0000-0000-000000000000";

const CommunityChat = () => {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatWallet = (address: string) => {
    if (address.length <= 8) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("token_comments")
        .select("*")
        .eq("token_id", GLOBAL_CHAT_TOKEN_ID)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages(data || []);
      }
      setIsLoading(false);
    };

    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel("global-community-chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "token_comments",
          filter: `token_id=eq.${GLOBAL_CHAT_TOKEN_ID}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected || !publicKey) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to chat.",
        variant: "destructive",
      });
      return;
    }

    if (!newMessage.trim()) return;

    setIsSending(true);
    const { error } = await supabase.from("token_comments").insert({
      token_id: GLOBAL_CHAT_TOKEN_ID,
      wallet_address: publicKey.toBase58(),
      content: newMessage.trim(),
    });

    if (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Try again.",
        variant: "destructive",
      });
    } else {
      setNewMessage("");
    }
    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-primary/30 px-6 py-4 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h2 className="data-sm">COMMUNITY CHAT</h2>
        <span className="ml-auto data-sm text-muted-foreground">{messages.length} MESSAGES</span>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="data-sm text-muted-foreground">LOADING MESSAGES<span className="cursor-blink">_</span></p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="data-sm text-muted-foreground">NO MESSAGES YET</p>
            <p className="text-xs text-muted-foreground mt-2">Be the first to say something!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 border border-primary/20 rounded ${
                  publicKey && msg.wallet_address === publicKey.toBase58()
                    ? "bg-primary/10 border-primary/40"
                    : "bg-background"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="data-sm text-primary font-bold">
                    {formatWallet(msg.wallet_address)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <p className="text-sm text-foreground break-words">{msg.content}</p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="border-t border-primary/30 p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={connected ? "Type a message..." : "Connect wallet to chat"}
            disabled={!connected || isSending}
            maxLength={280}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!connected || isSending || !newMessage.trim()}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CommunityChat;
