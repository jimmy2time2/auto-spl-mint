import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Smile, Paperclip, Send, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  wallet_address: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
}

// ─── Emoji set ────────────────────────────────────────────────────────────────
const EMOJIS = [
  "🚀","💎","🌙","🔥","⚡","💀","🤖","🦑","👾","🎰",
  "📈","📉","💸","🪙","🏆","🎯","👀","🤯","😤","🫡",
  "😂","😭","😈","👻","🙏","💪","🤝","🫂","❤️","💚",
  "✅","❌","⚠️","🔑","🔒","🌐","🎲","🃏","🎮","🕹️",
  "🧠","👁️","🫀","⚙️","🔧","🛸","🌌","🌊","🌪️","🦈",
  "🐉","🦊","🐙","🦋","🐺","🤑","💰","💣","🧨","🎉",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const shortWallet = (addr: string) =>
  addr.length > 10 ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : addr;

const timeAgo = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const WALLET_KEY = "m9_chat_wallet";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ─── Message Bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ msg, expandedImg, setExpandedImg }: {
  msg: Message;
  expandedImg: string | null;
  setExpandedImg: (url: string | null) => void;
}) => (
  <div className="flex flex-col gap-1 py-2 px-3 border-b border-primary/10 hover:bg-primary/5 transition-colors">
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-primary font-bold">
        {shortWallet(msg.wallet_address)}
      </span>
      <span className="text-[10px] text-muted-foreground">
        {timeAgo(msg.created_at)}
      </span>
    </div>
    {msg.content && (
      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-foreground">
        {msg.content}
      </p>
    )}
    {msg.media_url && (
      <div className="mt-1">
        <img
          src={msg.media_url}
          alt="media"
          className={cn(
            "max-h-48 rounded cursor-pointer object-contain border border-primary/20",
            "hover:opacity-90 transition-opacity"
          )}
          onClick={() => setExpandedImg(expandedImg === msg.media_url ? null : msg.media_url)}
          loading="lazy"
        />
      </div>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const CommunityPanel = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [wallet, setWallet] = useState(() => localStorage.getItem(WALLET_KEY) || "");
  const [walletDraft, setWalletDraft] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [expandedImg, setExpandedImg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Load initial messages ──────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("community_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) setMessages(data as Message[]);
      });
  }, []);

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("community-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userScrolledUp) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, userScrolledUp]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setUserScrolledUp(!atBottom);
  }, []);

  // ── Wallet save ────────────────────────────────────────────────────────────
  const saveWallet = () => {
    const trimmed = walletDraft.trim();
    if (trimmed.length < 32 || trimmed.length > 44) {
      setError("Invalid wallet address (must be 32–44 chars)");
      return;
    }
    localStorage.setItem(WALLET_KEY, trimmed);
    setWallet(trimmed);
    setError(null);
  };

  // ── File pick ─────────────────────────────────────────────────────────────
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError("File too large (max 5 MB)");
      return;
    }
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
    setError(null);
    e.target.value = "";
  };

  const clearFile = () => {
    setPendingFile(null);
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingPreview(null);
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (sending || (!input.trim() && !pendingFile)) return;
    setSending(true);
    setError(null);

    try {
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;

      if (pendingFile) {
        setUploading(true);
        const ext = pendingFile.name.split(".").pop() ?? "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("chat-media")
          .upload(path, pendingFile, { upsert: false });

        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(path);
        mediaUrl = urlData.publicUrl;
        mediaType = pendingFile.type === "image/gif" ? "gif" : "image";
        setUploading(false);
      }

      const { error: insErr } = await supabase.from("community_messages").insert({
        wallet_address: wallet,
        content: input.trim() || null,
        media_url: mediaUrl,
        media_type: mediaType,
      });

      if (insErr) throw insErr;

      setInput("");
      clearFile();
      setUserScrolledUp(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send message";
      setError(msg);
      setUploading(false);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const insertEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // ── Wallet setup screen ────────────────────────────────────────────────────
  if (!wallet) {
    return (
      <div className="p-6 sm:p-8 flex flex-col items-center gap-4 text-center">
        <p className="data-sm text-muted-foreground">
          ENTER YOUR SOLANA WALLET ADDRESS TO JOIN THE CHAT
        </p>
        <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
          <Input
            value={walletDraft}
            onChange={(e) => setWalletDraft(e.target.value)}
            placeholder="Your Solana wallet address…"
            className="flex-1 font-mono text-xs"
            onKeyDown={(e) => e.key === "Enter" && saveWallet()}
          />
          <Button onClick={saveWallet} variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
            JOIN CHAT
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  // ── Main chat ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[600px] relative">
      {/* Image lightbox */}
      {expandedImg && (
        <div
          className="fixed inset-0 z-50 bg-background/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setExpandedImg(null)}
        >
          <button
            className="absolute top-4 right-4 text-foreground hover:text-primary"
            onClick={() => setExpandedImg(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={expandedImg}
            alt="expanded"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded border border-primary/30"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <span className="text-3xl">💬</span>
            <p className="data-sm">NO MESSAGES YET — BE THE FIRST</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              expandedImg={expandedImg}
              setExpandedImg={setExpandedImg}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Jump to bottom pill */}
      {userScrolledUp && (
        <button
          onClick={() => {
            setUserScrolledUp(false);
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full border border-primary/50 hover:bg-primary/80 transition-colors z-10"
        >
          ↓ Jump to latest
        </button>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-[72px] left-2 right-2 z-20 bg-background border-2 border-primary/50 rounded p-2 grid grid-cols-10 gap-1 max-h-48 overflow-y-auto shadow-lg">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => insertEmoji(e)}
              className="text-xl hover:bg-primary/20 rounded p-0.5 transition-colors leading-none"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Pending file preview */}
      {pendingPreview && (
        <div className="px-3 py-2 border-t border-primary/20 flex items-center gap-2">
          <img
            src={pendingPreview}
            alt="preview"
            className="h-12 w-12 object-cover rounded border border-primary/30"
          />
          <span className="text-xs text-muted-foreground truncate flex-1">
            {pendingFile?.name}
          </span>
          <button onClick={clearFile} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="border-t-2 border-primary/30 p-2 flex flex-col gap-2">
        {/* Wallet indicator */}
        <div className="flex items-center gap-1 px-1">
          <span className="text-[10px] text-muted-foreground font-mono">
            CHATTING AS:
          </span>
          <span className="text-[10px] text-primary font-mono font-bold">
            {shortWallet(wallet)}
          </span>
          <button
            onClick={() => { setWallet(""); localStorage.removeItem(WALLET_KEY); }}
            className="ml-auto text-[10px] text-muted-foreground hover:text-foreground underline"
          >
            change
          </button>
        </div>

        {error && (
          <p className="text-xs text-destructive px-1">{error}</p>
        )}

        <div className="flex items-center gap-1">
          {/* Emoji toggle */}
          <button
            onClick={() => setShowEmojiPicker((v) => !v)}
            className={cn(
              "p-2 rounded border border-primary/30 hover:bg-primary/10 transition-colors",
              showEmojiPicker && "bg-primary/20 text-primary"
            )}
            title="Emoji"
          >
            <Smile className="h-4 w-4" />
          </button>

          {/* File upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded border border-primary/30 hover:bg-primary/10 transition-colors"
            title="Upload image/GIF"
            disabled={uploading}
          >
            {pendingFile ? (
              <ImageIcon className="h-4 w-4 text-primary" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleFilePick}
          />

          {/* Text input */}
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Say something to the community…"
            className="flex-1 text-xs font-mono"
            maxLength={1000}
            disabled={sending}
          />

          {/* Send */}
          <Button
            onClick={sendMessage}
            disabled={sending || uploading || (!input.trim() && !pendingFile)}
            variant="outline"
            size="sm"
            className="border-primary text-primary hover:bg-primary/10 px-3"
          >
            {sending || uploading ? (
              <span className="text-xs">{uploading ? "UP…" : "…"}</span>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommunityPanel;
