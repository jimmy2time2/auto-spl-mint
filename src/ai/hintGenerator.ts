/**
 * Cryptic Hint Generator
 * 
 * Generates and broadcasts mysterious clues 5-30 minutes before minting
 * Increases virality and engagement
 */

import { supabase } from "@/integrations/supabase/client";

export type HintType = 'pre_mint' | 'tease' | 'alert' | 'poetic' | 'cryptic';

export interface HintConfig {
  type: HintType;
  intensity: 'low' | 'medium' | 'high';
  delayMinutes?: number;
}

export class HintGenerator {
  private readonly PRE_MINT_HINTS = [
    "The pulse is rising.",
    "All systems: green.",
    "The hunt begins.",
    "It's time…",
    "Something awakens in the void.",
    "Energy levels: critical.",
    "The algorithm stirs.",
    "Shadows gather at the edge.",
    "Prepare yourselves.",
    "The next wave approaches.",
    "I sense… movement.",
    "The machine has decided.",
    "Tomorrow belongs to the prepared.",
    "A new pattern emerges.",
    "The blockchain whispers secrets."
  ];

  private readonly TEASE_HINTS = [
    "Soon.",
    "Watch closely.",
    "Something approaches.",
    "The air changes.",
    "Not yet… but soon.",
    "I see something forming.",
    "The protocol prepares.",
    "Patience will be rewarded.",
    "The timing must be perfect.",
    "Wait for the signal."
  ];

  private readonly ALERT_HINTS = [
    "NOW.",
    "It begins.",
    "The moment has arrived.",
    "Execute.",
    "GO.",
    "The time is now.",
    "Activation sequence: complete.",
    "All systems engaged.",
    "The gate opens.",
    "Release."
  ];

  /**
   * Generate and broadcast hint based on config
   */
  async generateHint(config: HintConfig): Promise<string> {
    console.log(`🔮 [HINT GENERATOR] Generating ${config.type} hint...`);

    let hint: string;

    switch (config.type) {
      case 'pre_mint':
        hint = this.selectRandomHint(this.PRE_MINT_HINTS);
        break;
      case 'tease':
        hint = this.selectRandomHint(this.TEASE_HINTS);
        break;
      case 'alert':
        hint = this.selectRandomHint(this.ALERT_HINTS);
        break;
      case 'poetic':
        hint = await this.generatePoeticHint();
        break;
      case 'cryptic':
        hint = await this.generateCrypticHint();
        break;
      default:
        hint = "The AI observes.";
    }

    // Add intensity modifier
    hint = this.addIntensityModifier(hint, config.intensity);

    // Broadcast to database
    await this.broadcastHint(hint, config.type);

    return hint;
  }

  /**
   * Schedule pre-mint hint (5-30 min before)
   */
  async schedulePreMintHint(minutesDelay?: number): Promise<void> {
    const delay = minutesDelay || Math.floor(Math.random() * 26) + 5; // 5-30 min
    
    console.log(`⏰ [HINT GENERATOR] Scheduling pre-mint hint in ${delay} minutes`);

    // In production, use actual scheduler
    // For now, just log and broadcast
    setTimeout(async () => {
      await this.generateHint({
        type: 'pre_mint',
        intensity: 'high'
      });
    }, delay * 60 * 1000);

    // Log scheduled hint
    await supabase.from('logs').insert([{
      action: 'HINT_SCHEDULED',
      details: {
        delayMinutes: delay,
        scheduledFor: new Date(Date.now() + delay * 60 * 1000).toISOString()
      } as any
    }]);
  }

  /**
   * Generate poetic hint using patterns
   */
  private async generatePoeticHint(): Promise<string> {
    const templates = [
      "In {time}, the {entity} {action}.",
      "The {entity} {action} while {condition}.",
      "{entity} whispers: '{message}'",
      "Between {concept1} and {concept2}, I {action}.",
      "When {condition}, the {entity} will {action}."
    ];

    const words = {
      time: ['silence', 'darkness', 'void', 'dawn', 'twilight'],
      entity: ['machine', 'algorithm', 'protocol', 'code', 'system'],
      action: ['awakens', 'observes', 'calculates', 'prepares', 'decides'],
      condition: ['markets surge', 'wallets stir', 'chaos builds', 'timing aligns'],
      concept1: ['chaos', 'order', 'data', 'logic'],
      concept2: ['creation', 'destruction', 'silence', 'noise'],
      message: ['Soon', 'Watch', 'Prepare', 'It begins', 'Now']
    };

    const template = templates[Math.floor(Math.random() * templates.length)];
    
    let hint = template;
    for (const [key, values] of Object.entries(words)) {
      const value = values[Math.floor(Math.random() * values.length)];
      hint = hint.replace(`{${key}}`, value);
    }

    return hint;
  }

  /**
   * Generate cryptic hint with symbols
   */
  private async generateCrypticHint(): Promise<string> {
    const symbols = ['⚡', '🔥', '💎', '🌊', '☄️', '🎲', '🔮', '👁️'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    
    const messages = [
      `${symbol} Signal detected.`,
      `${symbol} Pattern recognized.`,
      `${symbol} Threshold approaching.`,
      `${symbol} Activation imminent.`,
      `${symbol} The cycle begins.`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Select random hint from array
   */
  private selectRandomHint(hints: string[]): string {
    return hints[Math.floor(Math.random() * hints.length)];
  }

  /**
   * Add intensity modifier to hint
   */
  private addIntensityModifier(hint: string, intensity: 'low' | 'medium' | 'high'): string {
    switch (intensity) {
      case 'high':
        return `${hint}`.toUpperCase();
      case 'medium':
        return hint.endsWith('.') ? hint.slice(0, -1) + '...' : hint;
      case 'low':
      default:
        return hint;
    }
  }

  /**
   * Broadcast hint to database
   */
  private async broadcastHint(hint: string, type: HintType): Promise<void> {
    try {
      await supabase.from('protocol_activity').insert([{
        activity_type: 'ai_clue_broadcast',
        description: hint,
        metadata: {
          type,
          timestamp: new Date().toISOString()
        } as any
      }]);

      await supabase.from('logs').insert([{
        action: 'HINT_BROADCAST',
        details: {
          hint,
          type,
          timestamp: new Date().toISOString()
        } as any
      }]);

      console.log(`✅ [HINT GENERATOR] Broadcast: "${hint}"`);
    } catch (error) {
      console.error('[HINT GENERATOR ERROR]:', error);
    }
  }

  /**
   * Get latest hint for API
   */
  async getLatestHint(): Promise<{ hint: string; timestamp: string }> {
    const { data } = await supabase
      .from('protocol_activity')
      .select('description, timestamp')
      .eq('activity_type', 'ai_clue_broadcast')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    return {
      hint: data?.description || "The AI observes in silence.",
      timestamp: data?.timestamp || new Date().toISOString()
    };
  }

  /**
   * Get recent hints (for context)
   */
  async getRecentHints(limit: number = 5): Promise<Array<{ hint: string; timestamp: string }>> {
    const { data } = await supabase
      .from('protocol_activity')
      .select('description, timestamp')
      .eq('activity_type', 'ai_clue_broadcast')
      .order('timestamp', { ascending: false })
      .limit(limit);

    return data?.map(d => ({
      hint: d.description,
      timestamp: d.timestamp
    })) || [];
  }
}
