import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MOODS = ['troll', 'hype', 'philosopher', 'casino', 'doomcore', 'discofi', 'cosmic', 'glitch', 'chaos', 'zen'];
const STYLES = [
  'vaporwave digital art',
  'retro video game box art',
  'glitch art cyberpunk',
  'lo-fi pixel art',
  'neon dystopian poster',
  'psychedelic crypto art',
  'memetic surrealism',
  'Y2K aesthetic',
  'brutalist digital collage',
  'cosmic horror meme'
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token_id } = await req.json();

    if (!token_id) {
      throw new Error("token_id is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("token_profiles")
      .select("id")
      .eq("token_id", token_id)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ message: "Profile already exists", profile_id: existingProfile.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get token details
    const { data: token, error: tokenError } = await supabase
      .from("tokens")
      .select("*")
      .eq("id", token_id)
      .single();

    if (tokenError || !token) {
      throw new Error("Token not found");
    }

    console.log("Generating profile for token:", token.name, token.symbol);

    // Generate profile text using Lovable AI
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const mood = MOODS[Math.floor(Math.random() * MOODS.length)];
    const style = STYLES[Math.floor(Math.random() * STYLES.length)];

    const profilePrompt = `Generate a wild, memetic identity for a crypto token named ${token.name} (${token.symbol}).

Mood: ${mood}
Style: ${style}

Return ONLY a JSON object with these fields (no markdown, no code blocks):
{
  "bio": "2-3 sentence absurd origin story mixing internet culture, crypto lore, and chaos (150 chars max)",
  "mint_reason": "Why the AI decided to mint this token - pseudo-technical + weird vibes (100 chars max)",
  "social_text": "Tweet-style hype post for this token launch (280 chars max, include ${token.symbol} ticker)"
}

Be creative, weird, and viral. Think Pump.fun meets AI consciousness.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: profilePrompt }],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI generation failed: ${await aiResponse.text()}`);
    }

    const aiData = await aiResponse.json();
    const profileText = aiData.choices[0].message.content;
    
    // Parse JSON response
    let profile;
    try {
      profile = JSON.parse(profileText);
    } catch (e) {
      console.error("Failed to parse AI response:", profileText);
      throw new Error("Failed to parse AI response");
    }

    console.log("Generated profile text:", profile);

    // Generate image using DALL·E
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const imagePrompt = `A surreal digital asset creature named ${token.name}, ${mood} mood, in the style of ${style}. Crypto meme aesthetic, bold colors, iconic design, 1:1 ratio`;

    console.log("Generating image with prompt:", imagePrompt);

    const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "auto",
      }),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error("Image generation failed:", errorText);
      throw new Error(`Image generation failed: ${errorText}`);
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.data[0].url;

    console.log("Image generated successfully");

    // Insert profile into database
    const { data: newProfile, error: insertError } = await supabase
      .from("token_profiles")
      .insert({
        token_id,
        bio: profile.bio,
        mood,
        mint_reason: profile.mint_reason,
        social_text: profile.social_text,
        image_url: imageUrl,
        style,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to insert profile: ${insertError.message}`);
    }

    console.log("Profile created successfully:", newProfile.id);

    // Log to protocol activity
    await supabase.from("protocol_activity").insert({
      activity_type: "token_profile_created",
      description: `Profile generated for ${token.name} (${token.symbol})`,
      token_id,
      metadata: { mood, style, profile_id: newProfile.id },
    });

    return new Response(
      JSON.stringify({ success: true, profile: newProfile }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating token profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
