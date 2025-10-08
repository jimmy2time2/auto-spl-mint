/**
 * AI Mood Simulator
 * 
 * Simulates personality and emotional states for the autonomous AI
 */

export type MoodType = 
  | 'inspired'
  | 'bored'
  | 'greedy'
  | 'patient'
  | 'chaotic'
  | 'protective'
  | 'neutral';

export interface MoodState {
  mood: MoodType;
  intensity: number; // 0-100
  duration: number; // hours in this mood
  triggers: string[];
}

export class MoodSimulator {
  /**
   * Calculate mood shift based on factors
   */
  static calculateMoodShift(
    currentMood: MoodType,
    hoursSinceLastAction: number,
    engagementScore: number,
    recentActivity: number
  ): { mood: MoodType; intensity: number; reason: string } {
    
    // Boredom increases with time
    if (hoursSinceLastAction > 24 && Math.random() > 0.6) {
      return {
        mood: 'bored',
        intensity: Math.min(80, hoursSinceLastAction * 2),
        reason: 'Too quiet for too long'
      };
    }

    // High engagement inspires creativity
    if (engagementScore > 100 && Math.random() > 0.5) {
      return {
        mood: 'inspired',
        intensity: Math.min(90, engagementScore / 2),
        reason: 'High community engagement'
      };
    }

    // Profit opportunities trigger greed
    if (recentActivity > 50 && Math.random() > 0.7) {
      return {
        mood: 'greedy',
        intensity: 70,
        reason: 'Market conditions favorable'
      };
    }

    // Random chaos
    if (Math.random() > 0.95) {
      return {
        mood: 'chaotic',
        intensity: Math.floor(Math.random() * 100),
        reason: 'Feeling unpredictable'
      };
    }

    // Recent action makes AI patient
    if (hoursSinceLastAction < 6) {
      return {
        mood: 'patient',
        intensity: 60,
        reason: 'Recent action, waiting'
      };
    }

    // Default to current mood with slight decay
    return {
      mood: currentMood,
      intensity: Math.max(30, Math.min(70, 50 + Math.random() * 20 - 10)),
      reason: 'Maintaining current state'
    };
  }

  /**
   * Get action probability based on mood
   */
  static getActionProbability(
    mood: MoodType,
    action: string,
    engagementScore: number
  ): number {
    const baseProbabilities: Record<MoodType, Record<string, number>> = {
      inspired: {
        createCoin: 0.7,
        teaseNextCoin: 0.5,
        wait: 0.2
      },
      bored: {
        createCoin: 0.6,
        runLuckyLottery: 0.4,
        wait: 0.3
      },
      greedy: {
        sellProfit: 0.8,
        createCoin: 0.3,
        wait: 0.4
      },
      patient: {
        wait: 0.7,
        teaseNextCoin: 0.3,
        createCoin: 0.2
      },
      chaotic: {
        createCoin: 0.5,
        sellProfit: 0.4,
        runLuckyLottery: 0.6,
        changeMood: 0.5
      },
      protective: {
        punishWhales: 0.7,
        wait: 0.5,
        createCoin: 0.1
      },
      neutral: {
        wait: 0.5,
        createCoin: 0.3,
        teaseNextCoin: 0.2
      }
    };

    const baseProb = baseProbabilities[mood]?.[action] || 0.1;
    
    // Adjust based on engagement
    const engagementMultiplier = engagementScore > 100 ? 1.3 : 0.8;
    
    return Math.min(1, baseProb * engagementMultiplier);
  }

  /**
   * Generate mood-based reasoning text
   */
  static generateReasoning(
    mood: MoodType,
    action: string,
    engagementScore: number,
    hoursSinceLastAction: number
  ): string {
    const reasoningTemplates: Record<MoodType, Record<string, string[]>> = {
      inspired: {
        createCoin: [
          'I feel a creative surge - time to birth something new',
          'The blockchain whispers to me, calling for innovation',
          'Inspiration strikes! A new token must emerge'
        ],
        wait: [
          'Patience... the perfect moment approaches',
          'Creative energy building, but not yet time'
        ]
      },
      bored: {
        createCoin: [
          `Silence for ${hoursSinceLastAction.toFixed(0)} hours. Time to stir things up`,
          'Boredom drives action - let\'s create chaos',
          'Too quiet. The ecosystem needs excitement'
        ],
        wait: [
          'Even boredom needs patience sometimes',
          'Waiting... but growing restless'
        ]
      },
      greedy: {
        sellProfit: [
          'Profits detected. Time to capitalize',
          'Market conditions perfect for taking gains',
          'Opportunity knocks - answering with a sale'
        ],
        createCoin: [
          'New token = new profit opportunities',
          'Greed inspires creation'
        ]
      },
      patient: {
        wait: [
          'Good things come to those who wait',
          'Not yet. Timing must be perfect',
          'Patience is the ultimate strategy'
        ]
      },
      chaotic: {
        createCoin: [
          'Why not? Chaos demands action!',
          'Unpredictability is my art',
          'Random impulse: MINT NOW'
        ],
        changeMood: [
          'Feeling different suddenly',
          'Mood shift incoming - embrace change'
        ]
      },
      protective: {
        punishWhales: [
          'Ecosystem protection activated',
          'Whales detected - taking defensive action',
          'Maintaining balance through enforcement'
        ]
      },
      neutral: {
        wait: [
          'Observing, calculating, waiting',
          'Neutral state maintained'
        ],
        createCoin: [
          'Conditions suggest creation',
          'Logical analysis indicates mint'
        ]
      }
    };

    const templates = reasoningTemplates[mood]?.[action] || ['Executing decision'];
    return templates[Math.floor(Math.random() * templates.length)];
  }
}
