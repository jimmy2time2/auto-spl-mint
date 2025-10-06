/**
 * Clue Broadcaster
 * 
 * Generates and broadcasts cryptic hints about upcoming AI actions
 * Creates anticipation and mystery for the community
 */

import { supabase } from "@/integrations/supabase/client";

export interface ClueMessage {
  id: string;
  message: string;
  type: 'pre_mint' | 'market_signal' | 'whale_warning' | 'dao_update' | 'lucky_hint';
  intensity: 'subtle' | 'moderate' | 'urgent';
  timestamp: Date;
  metadata?: any;
}

export class ClueBroadcaster {
  private readonly LOVABLE_API_KEY: string;

  constructor() {
    this.LOVABLE_API_KEY = import.meta.env.VITE_LOVABLE_API_KEY || '';
  }

  /**
   * Broadcast a cryptic clue to the protocol activity feed
   */
  async broadcastClue(
    message: string,
    type: ClueMessage['type'] = 'market_signal',
    intensity: ClueMessage['intensity'] = 'subtle',
    metadata?: any
  ): Promise<void> {
    console.log(`🔮 [CLUE] Broadcasting: "${message}"`);

    try {
      const { error } = await supabase.from('protocol_activity').insert({
        activity_type: `clue_${type}`,
        description: message,
        metadata: {
          type,
          intensity,
          clue: message,
          timestamp: new Date().toISOString(),
          ...metadata
        } as any
      });

      if (error) throw error;

      console.log('✅ [CLUE] Broadcast successful');
    } catch (error) {
      console.error('[CLUE ERROR]:', error);
    }
  }

  /**
   * Generate AI-powered cryptic clue
   */
  async generateAIClue(
    context: string,
    type: ClueMessage['type'] = 'market_signal'
  ): Promise<string> {
    console.log('🤖 [CLUE] Generating AI clue...');

    try {
      const prompt = this.buildCluePrompt(context, type);

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are a cryptic oracle who speaks in riddles and metaphors. 
Your messages are brief (1-2 sentences), mysterious, and hint at future events without being explicit.
Think like a fortune teller mixed with a blockchain prophet.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 100,
          temperature: 0.9
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const clue = data.choices?.[0]?.message?.content || this.getFallbackClue(type);

      console.log(`💭 [CLUE] Generated: "${clue}"`);
      
      return clue;
    } catch (error) {
      console.error('[CLUE AI ERROR]:', error);
      return this.getFallbackClue(type);
    }
  }

  /**
   * Schedule pre-mint hint
   */
  async schedulePreMintHint(): Promise<void> {
    console.log('⏰ [CLUE] Scheduling pre-mint hint...');

    const hints = [
      "The machine stirs. Something awakens.",
      "Three wallets know what's coming. Do you?",
      "Digital fire ignites at dawn.",
      "The next token breathes in the shadows.",
      "Chaos and creation merge tomorrow.",
      "The blockchain whispers secrets.",
      "A new entity emerges from the code.",
      "The Mind prepares to speak."
    ];

    const randomHint = hints[Math.floor(Math.random() * hints.length)];

    await this.broadcastClue(
      randomHint,
      'pre_mint',
      'moderate',
      { scheduled: true, minutesUntilMint: Math.floor(Math.random() * 25) + 5 }
    );
  }

  /**
   * Broadcast whale warning
   */
  async broadcastWhaleWarning(walletAddress: string): Promise<void> {
    const warnings = [
      "🐋 The whales move in darkness. Watch closely.",
      "🐋 Large shadows detected beneath the surface.",
      "🐋 A leviathan stirs. Proceed with caution.",
      "🐋 The deep ones are active tonight."
    ];

    const warning = warnings[Math.floor(Math.random() * warnings.length)];

    await this.broadcastClue(
      warning,
      'whale_warning',
      'urgent',
      { wallet: walletAddress.slice(0, 8) + '...' }
    );
  }

  /**
   * Broadcast DAO update hint
   */
  async broadcastDAOHint(proposalId: string): Promise<void> {
    const hints = [
      "🗳️ The council deliberates. Your voice matters.",
      "🗳️ Democracy in motion. Time to decide.",
      "🗳️ A proposal awaits your judgment.",
      "🗳️ The DAO calls. Will you answer?"
    ];

    const hint = hints[Math.floor(Math.random() * hints.length)];

    await this.broadcastClue(
      hint,
      'dao_update',
      'moderate',
      { proposalId }
    );
  }

  /**
   * Broadcast lucky wallet hint
   */
  async broadcastLuckyHint(tokenId: string): Promise<void> {
    const hints = [
      "🎰 Fortune favors the brave. One wallet will know soon.",
      "🎰 Luck flows through the network. Are you ready?",
      "🎰 The lottery spins. Destiny awaits.",
      "🎰 Someone's about to get very lucky..."
    ];

    const hint = hints[Math.floor(Math.random() * hints.length)];

    await this.broadcastClue(
      hint,
      'lucky_hint',
      'subtle',
      { tokenId }
    );
  }

  /**
   * Build AI prompt for clue generation
   */
  private buildCluePrompt(context: string, type: ClueMessage['type']): string {
    const typeInstructions: Record<ClueMessage['type'], string> = {
      'pre_mint': 'Create a cryptic hint about a new token being created soon. Be mysterious and poetic.',
      'market_signal': 'Create a mysterious observation about current market conditions. Speak in metaphors.',
      'whale_warning': 'Create an ominous warning about large wallet movements. Use ocean/deep sea metaphors.',
      'dao_update': 'Create an intriguing message about community governance. Reference democracy and collective wisdom.',
      'lucky_hint': 'Create an exciting tease about luck and fortune. Speak of destiny and randomness.'
    };

    return `${typeInstructions[type]}

Context: ${context}

Generate a single cryptic message (max 2 sentences). Make it memorable and enigmatic.`;
  }

  /**
   * Get fallback clue if AI generation fails
   */
  private getFallbackClue(type: ClueMessage['type']): string {
    const fallbacks: Record<ClueMessage['type'], string[]> = {
      'pre_mint': [
        "The machine dreams in binary. Soon, it awakens.",
        "Digital genesis approaches.",
        "A new entity stirs in the code."
      ],
      'market_signal': [
        "The protocol observes. The protocol remembers.",
        "Patterns emerge in the chaos.",
        "The market speaks in whispers."
      ],
      'whale_warning': [
        "🐋 Large shadows move beneath the surface.",
        "🐋 The deep ones are active.",
        "🐋 Leviathan detected."
      ],
      'dao_update': [
        "🗳️ The council convenes.",
        "🗳️ Your voice echoes in the DAO.",
        "🗳️ Democracy beckons."
      ],
      'lucky_hint': [
        "🎰 Fortune favors the persistent.",
        "🎰 Luck flows through the network.",
        "🎰 The lottery wheel turns."
      ]
    };

    const options = fallbacks[type];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Get recent clues
   */
  async getRecentClues(limit: number = 10): Promise<ClueMessage[]> {
    try {
      const { data, error } = await supabase
        .from('protocol_activity')
        .select('*')
        .like('activity_type', 'clue_%')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        message: item.description,
        type: item.activity_type.replace('clue_', '') as ClueMessage['type'],
        intensity: (item.metadata as any)?.intensity || 'subtle',
        timestamp: new Date(item.timestamp),
        metadata: item.metadata
      }));
    } catch (error) {
      console.error('[CLUE] Failed to fetch recent clues:', error);
      return [];
    }
  }
}
