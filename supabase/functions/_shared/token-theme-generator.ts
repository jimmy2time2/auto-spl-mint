/**
 * Token Theme Generator
 * 
 * AI-powered generator for viral token names and themes inspired by:
 * - Meme culture and viral trends
 * - Financial buzzwords and crypto lingo
 * - Twitter/X crypto community
 * - Abstract aesthetics and vibes
 */

export interface TokenThemeInput {
  seed_phrase?: string;
  past_token_names?: string[];
  trending_keywords?: string[];
  market_vibe?: 'bullish' | 'bearish' | 'neutral' | 'chaotic';
  style_preference?: 'meme' | 'serious' | 'abstract' | 'mysterious' | 'random';
}

export interface TokenTheme {
  name: string;
  symbol: string;
  description: string;
  theme_category: string;
  vibe: string;
  emoji?: string;
  color?: string;
  tagline?: string;
  backstory?: string;
}

/**
 * Build AI prompt for token theme generation
 */
export function buildTokenThemePrompt(input: TokenThemeInput): string {
  const {
    seed_phrase,
    past_token_names = [],
    trending_keywords = [],
    market_vibe = 'neutral',
    style_preference = 'random',
  } = input;

  const vibeDescriptions = {
    bullish: 'optimistic, moon-focused, gains-oriented, rocket-fueled energy',
    bearish: 'survival mode, diamond hands, hold strong, winter vibes',
    neutral: 'balanced, steady, calm but ready to pump',
    chaotic: 'unpredictable, chaotic good, meme lord energy, wild card',
  };

  const styleGuides = {
    meme: 'Pure meme energy. Think Doge, Pepe, Wojak, viral internet culture.',
    serious: 'Professional but crypto-native. DeFi vibes, technical but accessible.',
    abstract: 'Ethereal, philosophical, conceptual. Think "Ether" meets "Cosmos".',
    mysterious: 'Cryptic, enigmatic, riddles and secrets. Makes people curious.',
    random: 'Anything goes. Mix memes, finance, abstract concepts freely.',
  };

  const recentNames = past_token_names.length > 0
    ? `\n\nPrevious tokens launched (avoid similar concepts):\n${past_token_names.slice(-10).join(', ')}`
    : '';

  const trends = trending_keywords.length > 0
    ? `\n\nCurrent trending keywords/topics:\n${trending_keywords.join(', ')}`
    : '';

  const seedContext = seed_phrase
    ? `\n\nSeed phrase for inspiration: "${seed_phrase}"`
    : '';

  return `You are a viral token theme generator for a Solana meme coin launchpad. Your job is to create instantly memorable, shareable token concepts.

CURRENT MARKET VIBE: ${market_vibe}
- Vibe description: ${vibeDescriptions[market_vibe]}

STYLE PREFERENCE: ${style_preference}
- Style guide: ${styleGuides[style_preference]}${recentNames}${trends}${seedContext}

INSPIRATION SOURCES:
- Crypto Twitter culture (CT vibes, wagmi, gm, few, ngmi, etc.)
- Viral memes (Doge, Pepe, Wojak, Chad, etc.)
- Financial buzzwords (pump, moon, diamond hands, paper hands, etc.)
- Internet aesthetics (vaporwave, cyberpunk, cottagecore, etc.)
- Pop culture references (but crypto-pilled)
- Abstract concepts (time, space, consciousness, etc.)

RULES:
1. Name must be 1-2 words, memorable, shareable
2. Symbol should be 3-5 letters, catchy
3. Description should be punchy (max 150 chars)
4. Theme must feel authentic to crypto culture
5. Should make people want to buy for the vibes
6. Avoid copying existing major tokens
7. Mix humor with hints of deeper meaning

EXAMPLES OF GOOD VIBES:
- "LunarLobster" - crypto meets absurdist humor
- "VaporWave" - aesthetic + crypto culture
- "DiamondPaws" - meme + diamond hands culture
- "QuantumMeme" - abstract + internet culture
- "FrenZone" - CT lingo + community vibes

Generate ONE token concept that will make people say "I need this in my life" and hit that buy button.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "name": "TokenName",
  "symbol": "SYMB",
  "description": "One-line punchy description under 150 chars",
  "theme_category": "meme/defi/abstract/culture/meta",
  "vibe": "describe the vibe in 3-5 words",
  "emoji": "🚀",
  "color": "#FF6B9D",
  "tagline": "catchy tagline or meme phrase",
  "backstory": "2-3 sentence backstory that adds depth and lore"
}`;
}

/**
 * Generate token theme using Lovable AI
 */
export async function generateTokenTheme(
  input: TokenThemeInput,
  lovableApiKey: string
): Promise<TokenTheme> {
  const prompt = buildTokenThemePrompt(input);

  console.log('🎨 Generating token theme...');
  console.log(`Style: ${input.style_preference || 'random'}`);
  console.log(`Market vibe: ${input.market_vibe || 'neutral'}`);

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash', // Default, fast and good
      messages: [
        {
          role: 'system',
          content: 'You are a viral token theme generator. You create memorable, shareable crypto token concepts. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.9, // High creativity
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (response.status === 402) {
      throw new Error('Lovable AI credits exhausted. Please add funds to workspace.');
    }
    throw new Error(`Lovable AI error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content in AI response');
  }

  console.log('Raw AI response:', content);

  // Parse JSON from response (handle markdown code blocks if present)
  let jsonStr = content.trim();
  
  // Remove markdown code blocks if present
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  let theme: TokenTheme;
  try {
    theme = JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse AI response:', jsonStr);
    throw new Error('Failed to parse token theme from AI response');
  }

  // Validate required fields
  if (!theme.name || !theme.symbol || !theme.description) {
    throw new Error('Invalid token theme: missing required fields');
  }

  // Ensure symbol is uppercase and reasonable length
  theme.symbol = theme.symbol.toUpperCase().substring(0, 5);

  console.log(`✅ Generated: ${theme.name} ($${theme.symbol})`);
  console.log(`Theme: ${theme.theme_category} | Vibe: ${theme.vibe}`);

  return theme;
}

/**
 * Generate multiple theme options
 */
export async function generateThemeOptions(
  input: TokenThemeInput,
  lovableApiKey: string,
  count: number = 3
): Promise<TokenTheme[]> {
  const themes: TokenTheme[] = [];
  
  // Generate themes with slight variations
  for (let i = 0; i < count; i++) {
    try {
      // Vary the style for diversity
      const styles = ['meme', 'abstract', 'mysterious', 'random'] as const;
      const variedInput = {
        ...input,
        style_preference: input.style_preference || styles[i % styles.length],
      };

      const theme = await generateTokenTheme(variedInput, lovableApiKey);
      themes.push(theme);

      // Small delay to avoid rate limiting
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Failed to generate theme ${i + 1}:`, error);
      // Continue with other generations
    }
  }

  return themes;
}

/**
 * Get trending crypto keywords from recent activity
 */
export async function getTrendingKeywords(supabase: any): Promise<string[]> {
  // Fetch recent token names
  const { data: recentTokens } = await supabase
    .from('tokens')
    .select('name')
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch recent protocol activity descriptions
  const { data: recentActivity } = await supabase
    .from('protocol_activity')
    .select('description')
    .order('timestamp', { ascending: false })
    .limit(20);

  const keywords: Set<string> = new Set();

  // Extract keywords from tokens
  recentTokens?.forEach((token: any) => {
    const words = token.name.split(/\s+/);
    words.forEach((word: string) => {
      if (word.length > 3) keywords.add(word.toLowerCase());
    });
  });

  // Extract keywords from activity
  recentActivity?.forEach((activity: any) => {
    const words = activity.description.split(/\s+/);
    words.slice(0, 3).forEach((word: string) => {
      if (word.length > 4) keywords.add(word.toLowerCase());
    });
  });

  return Array.from(keywords).slice(0, 10);
}

/**
 * Determine market vibe from recent metrics
 */
export async function determineMarketVibe(
  supabase: any
): Promise<'bullish' | 'bearish' | 'neutral' | 'chaotic'> {
  // Get recent engagement
  const { data: engagement } = await supabase
    .from('engagement_metrics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Get recent tokens
  const { data: recentTokens, count: tokenCount } = await supabase
    .from('tokens')
    .select('*', { count: 'exact' })
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  // Get recent trades
  const { data: recentTrades, count: tradeCount } = await supabase
    .from('wallet_activity_log')
    .select('*', { count: 'exact' })
    .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .in('activity_type', ['buy', 'sell', 'trade']);

  const engagementScore = engagement?.engagement_score || 0;
  const tokenLaunchRate = tokenCount || 0;
  const tradeActivity = tradeCount || 0;

  // Determine vibe
  if (engagementScore > 70 && tokenLaunchRate > 3 && tradeActivity > 50) {
    return 'bullish';
  } else if (engagementScore < 30 && tokenLaunchRate === 0 && tradeActivity < 10) {
    return 'bearish';
  } else if (tokenLaunchRate > 5 || tradeActivity > 100) {
    return 'chaotic';
  } else {
    return 'neutral';
  }
}
