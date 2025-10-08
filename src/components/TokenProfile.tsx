import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Share2, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface TokenProfileProps {
  tokenId: string;
}

const moodEmojis: Record<string, string> = {
  troll: "🐸",
  hype: "📈",
  philosopher: "🧠",
  casino: "🎰",
  doomcore: "💀",
  discofi: "🪩",
  cosmic: "🌌",
  glitch: "⚡",
  chaos: "🌀",
  zen: "🧘",
};

const moodColors: Record<string, string> = {
  troll: "bg-green-500/20 border-green-500",
  hype: "bg-yellow-500/20 border-yellow-500",
  philosopher: "bg-purple-500/20 border-purple-500",
  casino: "bg-red-500/20 border-red-500",
  doomcore: "bg-gray-900/20 border-gray-500",
  discofi: "bg-pink-500/20 border-pink-500",
  cosmic: "bg-blue-500/20 border-blue-500",
  glitch: "bg-cyan-500/20 border-cyan-500",
  chaos: "bg-orange-500/20 border-orange-500",
  zen: "bg-indigo-500/20 border-indigo-500",
};

const TokenProfile = ({ tokenId }: TokenProfileProps) => {
  const [audioEnabled, setAudioEnabled] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["token-profile", tokenId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("token_profiles")
        .select("*")
        .eq("token_id", tokenId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const handleShare = async () => {
    if (!profile) return;

    const shareText = profile.social_text;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share canceled or failed");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      alert("Copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="border-2 border-border bg-card p-6 terminal-text">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="border-2 border-border bg-card p-6 terminal-text">
        <div className="text-center py-12 opacity-70">
          <div className="text-4xl mb-4">🤖</div>
          <div className="text-sm">NO_PROFILE_GENERATED_YET</div>
          <div className="text-xs mt-2">The AI Mind is still thinking...</div>
        </div>
      </div>
    );
  }

  const moodColor = moodColors[profile.mood] || "bg-muted border-border";
  const moodEmoji = moodEmojis[profile.mood] || "🎭";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-2 border-border bg-card overflow-hidden"
    >
      {/* Token Visual */}
      <div className="relative aspect-square bg-black overflow-hidden">
        {profile.image_url ? (
          <img
            src={profile.image_url}
            alt={`${profile.mood} token artwork`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center terminal-text text-6xl">
            {moodEmoji}
          </div>
        )}
        
        {/* Mood Badge */}
        <div className={`absolute top-4 left-4 px-3 py-1 border-2 ${moodColor} backdrop-blur-sm`}>
          <div className="terminal-text text-xs uppercase font-bold flex items-center gap-2">
            {moodEmoji} {profile.mood}
          </div>
        </div>

        {/* Audio Toggle */}
        {profile.audio_url && (
          <Button
            size="icon"
            variant="outline"
            className="absolute top-4 right-4 border-2"
            onClick={() => setAudioEnabled(!audioEnabled)}
          >
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Profile Content */}
      <div className="p-6 space-y-4">
        {/* Bio */}
        <div>
          <div className="text-xs terminal-text opacity-70 mb-2 uppercase tracking-wider">
            ORIGIN_STORY
          </div>
          <div className="terminal-text text-sm leading-relaxed">
            {profile.bio}
          </div>
        </div>

        {/* Mint Reason */}
        <div className="border-t-2 border-dashed border-border pt-4">
          <div className="text-xs terminal-text opacity-70 mb-2 uppercase tracking-wider">
            AI_MINT_TRIGGER
          </div>
          <div className="terminal-text text-xs italic opacity-80">
            "{profile.mint_reason}"
          </div>
        </div>

        {/* Social Text */}
        <div className="border-t-2 border-dashed border-border pt-4">
          <div className="text-xs terminal-text opacity-70 mb-2 uppercase tracking-wider">
            VIRAL_CAPTION
          </div>
          <div className="terminal-text text-sm bg-muted p-3 border-2 border-border relative">
            {profile.social_text}
          </div>
        </div>

        {/* Share Button */}
        <Button
          onClick={handleShare}
          className="w-full border-2 border-black font-bold uppercase tracking-widest hover:scale-105 transition-transform"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share to X
        </Button>

        {/* Style Tag */}
        <div className="text-center pt-2">
          <div className="inline-block text-xs terminal-text opacity-50">
            STYLE: {profile.style.toUpperCase()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TokenProfile;
