# Token Theme Generator

AI-powered token name and theme generator that creates viral, meme-inspired concepts based on crypto culture, trending topics, and market vibes.

## Overview

This generator creates instantly memorable token concepts inspired by:
- 🎭 Viral meme culture (Doge, Pepe, Wojak, etc.)
- 💰 Financial buzzwords (moon, diamond hands, wagmi)
- 🐦 Crypto Twitter culture (gm, few, ngmi, ser)
- 🎨 Abstract aesthetics (vaporwave, cyberpunk, ethereal)
- 🌊 Current market vibes (bullish/bearish/chaotic)

## Features

✅ **AI-Powered**: Uses Lovable AI (Gemini 2.5 Flash) for creative generation  
✅ **Context-Aware**: Analyzes past tokens and trending keywords  
✅ **Market-Responsive**: Adapts to current market sentiment  
✅ **Style Variety**: Multiple style modes (meme, serious, abstract, mysterious)  
✅ **Multiple Options**: Can generate 3-5 options to choose from  
✅ **Complete Themes**: Name, symbol, description, emoji, color, backstory

## Usage

### Generate Single Theme

```bash
curl -X POST https://hrhklzusdctgrwpiacyq.supabase.co/functions/v1/generate-token-theme \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "style_preference": "meme",
    "seed_phrase": "diamond hands forever"
  }'
```

### Generate Multiple Options

```bash
curl -X POST https://hrhklzusdctgrwpiacyq.supabase.co/functions/v1/generate-token-theme \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "generate_options": true,
    "option_count": 5,
    "style_preference": "random",
    "include_trending": true
  }'
```

### With Specific Market Vibe

```bash
curl -X POST https://hrhklzusdctgrwpiacyq.supabase.co/functions/v1/generate-token-theme \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type": application/json" \
  -d '{
    "market_vibe": "chaotic",
    "style_preference": "mysterious"
  }'
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `seed_phrase` | string | null | Inspiration phrase for theme |
| `style_preference` | string | "random" | Style: meme, serious, abstract, mysterious, random |
| `market_vibe` | string | auto | Market vibe: bullish, bearish, neutral, chaotic |
| `generate_options` | boolean | false | Generate multiple theme options |
| `option_count` | number | 3 | How many options to generate (if enabled) |
| `include_trending` | boolean | true | Include trending keywords in generation |

## Response Format

### Single Theme

```json
{
  "success": true,
  "theme": {
    "name": "LunarLobster",
    "symbol": "LOBS",
    "description": "Sideways to the moon, diamond claws holding forever 🦞",
    "theme_category": "meme",
    "vibe": "absurdist hodl energy",
    "emoji": "🦞",
    "color": "#FF6B9D",
    "tagline": "When crabs go cosmic",
    "backstory": "Born in the depths of Crypto Twitter, LunarLobster represents the sideways market survivors who refuse to sell. Part crustacean, part astronaut, 100% diamond claws."
  },
  "market_vibe": "neutral",
  "trending_keywords": ["moon", "diamond", "hodl", "degen", "fren"]
}
```

### Multiple Options

```json
{
  "success": true,
  "themes": [
    {
      "name": "VaporWave",
      "symbol": "VAPOR",
      "description": "Aesthetic gains in A E S T H E T I C waves 🌸",
      "theme_category": "abstract",
      "vibe": "chill nostalgic vibes",
      "emoji": "🌸",
      "color": "#FF71CE",
      "tagline": "Pump it back to '95",
      "backstory": "VaporWave emerges from the intersection of 90s internet nostalgia and modern DeFi. A token for those who trade to synthwave beats."
    },
    {
      "name": "QuantumMeme",
      "symbol": "QM",
      "description": "Superposition of moon and rekt until you check your wallet 📦",
      "theme_category": "meta",
      "vibe": "schrodinger's gains",
      "emoji": "📦",
      "color": "#00D9FF",
      "tagline": "Both rich and poor simultaneously",
      "backstory": "QuantumMeme exists in a superposition of all possible memes. When you buy, you collapse the wavefunction into either massive gains or glorious losses."
    }
  ],
  "count": 2,
  "market_vibe": "chaotic"
}
```

## Style Preferences

### Meme Style
- Pure meme energy
- References: Doge, Pepe, Wojak
- Vibes: Fun, shareable, viral
- Example: "LunarLobster", "FrenZone"

### Serious Style
- Professional but crypto-native
- DeFi-focused
- Technical but accessible
- Example: "YieldVault", "LiquidityCore"

### Abstract Style
- Ethereal and philosophical
- Conceptual naming
- Deeper meaning
- Example: "VaporWave", "EtherDreams"

### Mysterious Style
- Cryptic and enigmatic
- Riddles and secrets
- Makes people curious
- Example: "CipherKey", "VoidWhisper"

### Random Style
- Anything goes
- Mixes all styles
- Maximum creativity
- Example: Wild combinations

## Market Vibes

### Bullish 🚀
- Optimistic, moon-focused
- Gains-oriented energy
- Rocket fuel vibes
- Keywords: moon, pump, lambo, gains

### Bearish 🐻
- Survival mode
- Diamond hands focus
- Winter prep vibes
- Keywords: hodl, hold, survive, winter

### Neutral ⚖️
- Balanced approach
- Steady but ready
- Calm energy
- Keywords: stable, steady, patient

### Chaotic 🌪️
- Unpredictable energy
- Meme lord mode
- Wild card vibes
- Keywords: degen, yolo, chaos, wild

## Integration with AI Decision Engine

Update the AI Decision Engine to use this generator:

```typescript
// In ai-token-decision function
const { data: themeData } = await supabase.functions.invoke('generate-token-theme', {
  body: {
    style_preference: 'random',
    market_vibe: decidedVibe,
    include_trending: true,
  }
});

const theme = themeData.theme;

// Use theme.name, theme.symbol, theme.description, etc.
```

## Example Outputs

### Meme Examples
- **MoonPug** ($MPUG) - "When Doge meets interstellar ambitions 🐕"
- **DiamondPaws** ($DPAWS) - "Holding with unbreakable grip since day one 💎"
- **FrenZone** ($FREN) - "For the frens who WAGMI together 🤝"

### Abstract Examples
- **EtherDreams** ($DREAM) - "Where consciousness meets blockchain ✨"
- **VoidEcho** ($VECHO) - "Listen to the silence between blocks 🌌"
- **NeonMist** ($NMIST) - "Vapor in the machine 🌸"

### Mysterious Examples
- **CipherKey** ($CIPHER) - "The key unlocks at midnight ��"
- **RuneStone** ($RUNE) - "Ancient wisdom, modern blockchain 📜"
- **ShadowFi** ($SHDW) - "DeFi from the other side 🌑"

## Rate Limits

- Lovable AI rate limits apply
- 429 error: Too many requests, wait before retry
- 402 error: Credits exhausted, add funds to workspace
- Recommended: 1 request per second max

## Error Handling

```typescript
try {
  const response = await fetch(url, { ... });
  const data = await response.json();
  
  if (data.type === 'rate_limit') {
    // Wait and retry
  } else if (data.type === 'payment_required') {
    // Alert user about credits
  }
} catch (error) {
  console.error('Theme generation failed:', error);
}
```

## Monitoring

### View Generated Themes

```sql
SELECT 
  timestamp,
  description,
  metadata->'result' as theme_data
FROM protocol_activity
WHERE activity_type = 'token_theme_generated'
ORDER BY timestamp DESC
LIMIT 20;
```

### Track Popular Styles

```sql
SELECT 
  metadata->>'style_preference' as style,
  COUNT(*) as count
FROM protocol_activity
WHERE activity_type = 'token_theme_generated'
  AND timestamp > now() - interval '7 days'
GROUP BY style;
```

## Best Practices

1. ✅ Use trending keywords for relevance
2. ✅ Generate multiple options when possible
3. ✅ Match style to market conditions
4. ✅ Test themes with community first
5. ✅ Avoid duplicating recent tokens
6. ✅ Consider emoji and color for branding
7. ✅ Use backstory for marketing narrative

## Security

- ✅ Uses LOVABLE_API_KEY (auto-configured)
- ✅ Rate limited by Lovable AI infrastructure
- ✅ All generations logged for transparency
- ✅ No sensitive data in prompts or responses

## Cost Considerations

- Uses Lovable AI (usage-based pricing)
- ~$0.001-0.01 per generation (estimated)
- Generate options = 3-5x cost of single theme
- Monitor usage in Lovable workspace settings

## Troubleshooting

### Issue: Generic boring themes

**Solution**: 
- Use more specific seed phrases
- Try different style preferences
- Include trending keywords
- Adjust market vibe

### Issue: Similar to past tokens

**Solution**:
- System automatically avoids last 20 tokens
- Use seed phrases to steer direction
- Generate multiple options to pick best

### Issue: Rate limit errors

**Solution**:
- Add delays between requests
- Reduce option_count
- Check Lovable AI workspace usage

## Future Enhancements

- [ ] Image generation for token logos
- [ ] Twitter/X sentiment integration
- [ ] Community voting on themes
- [ ] Theme variations from single seed
- [ ] Multi-language support
- [ ] NFT metadata generation

## Conclusion

The Token Theme Generator brings AI creativity to token launches, creating viral, memorable concepts that resonate with crypto culture and current market sentiment. Perfect for autonomous AI agents and manual token launches alike.

**Let the AI cook. 👨‍🍳**
