import { useState } from "react";
import { Button } from "./ui/button";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GenerateProfileButtonProps {
  tokenId: string;
  onGenerated?: () => void;
}

const GenerateProfileButton = ({ tokenId, onGenerated }: GenerateProfileButtonProps) => {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    toast.info("🤖 AI Mind is creating token identity...");

    try {
      const { error } = await supabase.functions.invoke("generate-token-profile", {
        body: { token_id: tokenId },
      });

      if (error) throw error;

      toast.success("✨ Token profile generated!", {
        description: "The AI has spoken. Refresh to see the new identity.",
      });
      
      if (onGenerated) {
        setTimeout(() => onGenerated(), 1000);
      }
    } catch (error) {
      console.error("Profile generation error:", error);
      toast.error("Failed to generate profile", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={generating}
      className="border-2 border-black font-bold uppercase tracking-widest hover:scale-105 transition-transform"
    >
      <Sparkles className={`w-4 h-4 mr-2 ${generating ? "animate-spin" : ""}`} />
      {generating ? "Generating..." : "Generate AI Identity"}
    </Button>
  );
};

export default GenerateProfileButton;
