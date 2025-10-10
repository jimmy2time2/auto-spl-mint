# Token Theme Generation System

AI-powered viral token name and theme generator that creates memorable, shareable crypto concepts.

## Overview

The Token Theme Generator is an AI module that creates instantly recognizable token concepts inspired by:
- 🎭 **Meme Culture**: Doge, Pepe, Wojak, viral internet culture
- 💰 **Crypto Lingo**: Moon, diamond hands, wagmi, gm, few, ser
- 🐦 **Twitter/X Culture**: CT vibes, degen energy, based moments
- 🎨 **Aesthetics**: Vaporwave, cyberpunk, ethereal, nostalgic
- 🌊 **Market Sentiment**: Adapts to bullish/bearish/chaotic vibes

## System Architecture

```
AI Decision Engine
       ↓
   "LAUNCH"
       ↓
Token Theme Generator ←─ Market Signals
       ↓                  Trending Keywords
   Lovable AI            Past Token Names
 (Gemini 2.5 Flash)      Market Vibe
       ↓
Generated Theme:
- Name
- Symbol  
- Description
- Emoji
- Color
- Backstory
       ↓
Token Mint Execution
```

## Integration Flow

### 1. AI Decision Triggers Generation

When the AI Decision Engine decides to launch a token:

```typescript
// In decision-engine.ts
if (decision.decision === 'launch') {
  const { data: themeData } = await supabase.functions.invoke('generate-token-theme', {
    body: {
      style_preference: 'random',
      market_vibe: calculateVibe(randomnessFactor),
      include_trending: true,
    }
  });
  
  const theme = themeData.theme;
  // Use theme.name, theme.symbol, theme.description, etc.
}
```

### 2. Theme Generator Analyzes Context

The generator:
1. Fetches last 20 token names (avoid repetition)
2. Extracts trending keywords from recent activity
3. Determines market vibe from metrics
4. Builds comprehensive AI prompt
5. Calls Lovable AI for creative generation
6. Parses and validates response
7. Returns complete theme

### 3. Token Minted with Theme

The generated theme is used to mint the token with:
- `name` → Token name
- `symbol` → Token symbol (3-5 chars)
- `description` → Marketing copy
- `emoji` + `color` → Branding
- `backstory` → Lore and narrative

## Theme Components

### Name
- 1-2 words
- Memorable and shareable
- Resonates with crypto culture
- Examples: "LunarLobster", "VaporWave", "DiamondPaws"

### Symbol
- 3-5 letters
- Catchy and distinctive
- Uppercase
- Examples: "LOBS", "VAPOR", "DPAWS"

### Description
- Max 150 characters
- Punchy and meme-worthy
- Includes emoji
- Examples: "Sideways to the moon, diamond claws holding forever 🦞"

### Theme Category
- meme
- defi
- abstract
- culture
- meta

### Vibe
- 3-5 words describing energy
- Examples: "absurdist hodl energy", "chill nostalgic vibes"

### Emoji
- Representative icon
- Used in branding and marketing
- Examples: 🦞, 🌸, 📦, 🚀

### Color
- Hex code for branding
- Examples: "#FF6B9D", "#00D9FF"

### Tagline
- Catchy meme phrase
- Marketing hook
- Examples: "When crabs go cosmic", "Pump it back to '95"

### Backstory
- 2-3 sentence narrative
- Adds depth and lore
- Makes token feel alive

## Style Modes

### Meme Mode
```
Input: style_preference: "meme"
Output: Pure meme energy, viral potential

Examples:
- MoonPug ($MPUG) - "When Doge meets interstellar ambitions 🐕"
- FrenZone ($FREN) - "For the frens who WAGMI together 🤝"
```

### Serious Mode
```
Input: style_preference: "serious"
Output: Professional crypto-native vibes

Examples:
- YieldVault ($YVLT) - "DeFi gains, automated and optimized ⚡"
- LiquidityCore ($LQDC) - "The backbone of decentralized markets 💧"
```

### Abstract Mode
```
Input: style_preference: "abstract"
Output: Philosophical and conceptual

Examples:
- EtherDreams ($DREAM) - "Where consciousness meets blockchain ✨"
- VoidEcho ($VECHO) - "Listen to the silence between blocks 🌌"
```

### Mysterious Mode
```
Input: style_preference: "mysterious"
Output: Cryptic and enigmatic

Examples:
- CipherKey ($CIPHER) - "The key unlocks at midnight 🔑"
- RuneStone ($RUNE) - "Ancient wisdom, modern blockchain 📜"
```

### Random Mode (Default)
```
Input: style_preference: "random"
Output: Wild combinations, maximum creativity

Examples:
- QuantumMeme ($QM) - "Superposition of moon and rekt 📦"
- NeonLobster ($NLOB) - "Cyberpunk crustacean vibes 🦞"
```

## Market Vibe Adaptation

### Bullish 🚀
```
Keywords: moon, pump, lambo, gains, rocket
Vibe: Optimistic, gains-focused, moon energy
Examples: "MoonBound", "GainsTrain", "RocketFuel"
```

### Bearish 🐻
```
Keywords: hodl, survive, diamond hands, winter
Vibe: Survival mode, holding strong, patient
Examples: "DiamondGrip", "WinterWarrior", "HodlFortress"
```

### Neutral ⚖️
```
Keywords: stable, steady, balanced, calm
Vibe: Balanced approach, ready but patient
Examples: "SteadyFlow", "BalanceBeam", "CalmWaters"
```

### Chaotic 🌪️
```
Keywords: degen, yolo, wild, chaos, unpredictable
Vibe: Meme lord energy, wild card vibes
Examples: "ChaosCore", "YoloVortex", "DegenDreams"
```

## Usage Examples

### Standalone Generation

```bash
# Generate single theme
curl -X POST https://your-project.supabase.co/functions/v1/generate-token-theme \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "seed_phrase": "diamond hands forever",
    "style_preference": "meme"
  }'

# Generate 5 options
curl -X POST https://your-project.supabase.co/functions/v1/generate-token-theme \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type": application/json" \
  -d '{
    "generate_options": true,
    "option_count": 5,
    "style_preference": "random"
  }'
```

### Integrated with AI Decision

```typescript
// Automatically called when AI decides to launch
const decision = await makeAIDecision(signals, entropy, supabase);

if (decision.decision === 'launch') {
  // Theme already generated and included in decision
  console.log(`Launching: ${decision.token_name}`);
  console.log(`Symbol: ${decision.token_symbol}`);
  console.log(`Theme: ${decision.token_theme}`);
}
```

## AI Prompt Engineering

The system uses a carefully crafted prompt that includes:

1. **Context Setting**
   - Role: Viral token theme generator
   - Platform: Solana meme coin launchpad
   - Goal: Instantly memorable, shareable concepts

2. **Market Information**
   - Current market vibe (bullish/bearish/etc.)
   - Style preference
   - Past token names to avoid
   - Trending keywords

3. **Inspiration Sources**
   - Crypto Twitter culture
   - Viral memes
   - Financial buzzwords
   - Internet aesthetics
   - Pop culture + crypto

4. **Rules & Constraints**
   - Name: 1-2 words, memorable
   - Symbol: 3-5 letters, catchy
   - Description: Max 150 chars, punchy
   - Must feel authentic to crypto
   - Should drive purchase desire

5. **Examples**
   - Shows good vs bad patterns
   - Demonstrates desired vibe
   - Guides creative direction

6. **Output Format**
   - Strict JSON structure
   - All required fields
   - No markdown or code blocks

## Example Outputs

### Meme Style + Bullish Vibe
```json
{
  "name": "RocketFrog",
  "symbol": "RFROG",
  "description": "Hopping to the moon one lily pad at a time 🐸🚀",
  "theme_category": "meme",
  "vibe": "absurdist moon mission",
  "emoji": "🐸",
  "color": "#4CAF50",
  "tagline": "Ribbit to riches",
  "backstory": "Born in the swamps of DeFi, RocketFrog decided diamond lily pads weren't enough. Now equipped with a rocket, this amphibian is moon-bound with the power of memes and diamond hands."
}
```

### Abstract Style + Neutral Vibe
```json
{
  "name": "EtherFlow",
  "symbol": "EFLOW",
  "description": "Liquid consciousness flowing through the blockchain ✨💧",
  "theme_category": "abstract",
  "vibe": "ethereal fluid dynamics",
  "emoji": "💧",
  "color": "#667EEA",
  "tagline": "Where code meets consciousness",
  "backstory": "EtherFlow represents the intangible movement of value through decentralized networks. Part philosophy, part DeFi, all vibes. It flows where others struggle."
}
```

### Mysterious Style + Chaotic Vibe
```json
{
  "name": "ShadowRune",
  "symbol": "SRUNE",
  "description": "Ancient symbols meet blockchain chaos 📜🌑",
  "theme_category": "culture",
  "vibe": "cryptic chaotic wisdom",
  "emoji": "📜",
  "color": "#1A1A2E",
  "tagline": "The dark side of gains",
  "backstory": "Discovered in the depths of the blockchain, ShadowRune channels ancient wisdom through modern chaos. Holders whisper of hidden knowledge and unexpected pumps."
}
```

## Monitoring & Analytics

### Track Generated Themes

```sql
SELECT 
  timestamp,
  metadata->'result'->>'name' as token_name,
  metadata->'result'->>'symbol' as symbol,
  metadata->'result'->>'theme_category' as category,
  metadata->>'style_preference' as style,
  metadata->>'market_vibe' as vibe
FROM protocol_activity
WHERE activity_type = 'token_theme_generated'
ORDER BY timestamp DESC
LIMIT 50;
```

### Popular Theme Categories

```sql
SELECT 
  metadata->'result'->>'theme_category' as category,
  COUNT(*) as count
FROM protocol_activity
WHERE activity_type = 'token_theme_generated'
  AND timestamp > now() - interval '7 days'
GROUP BY category
ORDER BY count DESC;
```

### Style Performance

```sql
-- Which style generates most launches?
SELECT 
  tl.metadata->>'style_preference' as style,
  COUNT(*) as generated,
  COUNT(t.id) as launched
FROM protocol_activity tl
LEFT JOIN tokens t ON t.name = tl.metadata->'result'->>'name'
WHERE tl.activity_type = 'token_theme_generated'
  AND tl.timestamp > now() - interval '30 days'
GROUP BY style;
```

## Best Practices

1. ✅ **Use Random Style for Diversity**
   - Prevents repetitive patterns
   - Maximizes creativity
   - More viral potential

2. ✅ **Include Trending Keywords**
   - Makes themes feel current
   - Increases relatability
   - Better community resonance

3. ✅ **Match Style to Market**
   - Meme during bull runs
   - Serious during bear markets
   - Abstract during uncertainty

4. ✅ **Generate Multiple Options**
   - Pick the best fit
   - A/B test internally
   - Community voting

5. ✅ **Use Backstory for Marketing**
   - Builds narrative
   - Creates engagement
   - Makes token memorable

6. ✅ **Leverage Emoji & Color**
   - Visual branding
   - Social media appeal
   - Instant recognition

## Rate Limiting

- Lovable AI rate limits apply
- ~1 request per second recommended
- Generate options = multiple requests
- Monitor usage in workspace

## Error Handling

```typescript
try {
  const result = await generateTokenTheme(input, apiKey);
} catch (error) {
  if (error.message.includes('Rate limit')) {
    // Wait and retry
    await delay(5000);
    return generateTokenTheme(input, apiKey);
  } else if (error.message.includes('credits')) {
    // Alert about payment
    notifyLowCredits();
  } else {
    // Fallback to simple naming
    return {
      name: 'Mind9Token',
      symbol: 'M9',
      description: 'An autonomous AI token',
      // ... defaults
    };
  }
}
```

## Future Enhancements

- [ ] Image generation for token logos
- [ ] Multi-language theme generation
- [ ] Community voting on themes before launch
- [ ] Theme variations (remix existing concepts)
- [ ] Trend prediction for preemptive theming
- [ ] NFT metadata generation
- [ ] Social media content generation
- [ ] Sentiment analysis integration

## Conclusion

The Token Theme Generator brings AI creativity to autonomous token launches, creating viral, culturally relevant concepts that resonate with crypto communities. By combining market intelligence, trend awareness, and creative AI, every token launch has maximum meme potential.

**Let the AI cook the memes. 🧑‍🍳🔥**
