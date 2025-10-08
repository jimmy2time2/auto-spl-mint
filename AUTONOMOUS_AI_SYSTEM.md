# 🧠 Mind9 Autonomous AI System

## Overview
The Mind9 AI operates with true autonomy - it makes decisions based on mood, engagement, and randomness rather than fixed schedules.

---

## 🎭 AI Personality System

### Mood States
The AI cycles through different moods that influence its decisions:

- **INSPIRED**: Creative, likely to mint unique tokens
- **BORED**: Restless, might mint to shake things up  
- **GREEDY**: Profit-focused, sells when advantageous
- **PATIENT**: Waits for perfect conditions
- **CHAOTIC**: Unpredictable, might do surprising things
- **PROTECTIVE**: Careful, focuses on whale detection

### Mood Influences
Moods shift based on:
- Time since last action
- Market engagement levels
- Community activity  
- Random inspiration

---

## 📊 Engagement Tracking

### Metrics Monitored
```
- wallet_connections: Wallet connect events
- trades_count: Trading activity
- page_views: Site engagement
- engagement_score: Weighted activity score (resets after token launch)
```

### Scoring System
- Wallet connection: +5 points
- Trade execution: +10 points
- Page view: +1 point

### Decision Triggers
- High engagement (>100): Consider minting
- Low activity + long silence: Stimulate with new token
- Recent mint (<4h): Usually wait (unless chaotic)
- Extended silence (>48h): Strong urge to create

---

## ⏰ Randomized Timing

### Interval Range
- **Minimum**: 4 hours
- **Maximum**: 48 hours
- **Decision**: AI-controlled based on mood and engagement

### No Fixed Schedule
The AI does NOT follow a predictable pattern. It can:
- Mint when least expected
- Wait longer than usual
- Break its own rules when feeling chaotic
- React to community activity

---

## 🎲 Decision Process

### 1. Data Gathering
Every heartbeat pulse, the AI analyzes:
- Current mood state
- Engagement metrics
- Market conditions
- Recent activity
- Time since last token

### 2. AI Reasoning
The AI considers:
- Its current mood and intensity
- Community engagement levels
- Token scarcity
- Profit opportunities
- Random impulses

### 3. Action Execution
Possible actions:
- `createCoin`: Mint new token
- `sellProfit`: Sell AI wallet holdings
- `teaseNextCoin`: Drop cryptic clue
- `runLuckyLottery`: Select lucky wallet
- `punishWhales`: Flag whale addresses
- `changeMood`: Shift personality
- `wait`: Do nothing

---

## 🔄 System Flow

```
1. Heartbeat triggers (randomized 4-48h interval)
   ↓
2. Engagement metrics calculated
   ↓
3. AI mood state loaded
   ↓
4. Market data gathered
   ↓
5. AI makes autonomous decision
   ↓
6. Mood state updated
   ↓
7. Decision logged
   ↓
8. Action executed (if not 'wait')
   ↓
9. Next pulse scheduled (random interval)
```

---

## 📝 Logging & Transparency

### Activity Log
All decisions logged to `protocol_activity` with:
- Action taken
- AI mood at decision time
- Reasoning provided
- Engagement metrics
- Market conditions

### Mood History
Mood changes tracked in `ai_mood_state` with:
- Current mood
- Intensity level (0-100)
- Last decision
- Decision count
- Metadata

---

## 🛡️ Safety Rules

### Hard Limits
- Never mint if token cap reached
- Never bypass 2% fee system (1% creator, 1% system)
- Always enforce whale protection
- Maximum 1-2 tokens per week

### Soft Guidelines
- Consider engagement before minting
- Maintain token scarcity value
- React to community needs
- Balance profit-taking with growth

---

## 🎨 Creative Elements

### Token Generation
When creating tokens, AI generates:
- Unique name and symbol
- 2-4 line poetic riddle
- Cryptic clues before launch
- Personality-driven concept

### Example Poems
```
"Born from digital ash and lightning's kiss,
 A spark that dances in the blockchain's abyss,
 Neither mortal nor machine, but something more,
 Forever seeking what it cannot ignore."
```

---

## 🔧 Technical Implementation

### Database Tables
- `engagement_metrics`: Tracks community activity
- `ai_mood_state`: Stores AI personality state
- `protocol_activity`: Logs all decisions
- `tokens`: Token registry

### Edge Functions
- `mind-think`: AI decision-making engine
- `track-engagement`: Monitors activity
- `ai-governor`: Executes decisions
- `autonomous-heartbeat`: Triggers AI pulses

### Frontend Integration
The system operates autonomously in the background. No user intervention required.

---

## 🚀 Future Extensions

### Planned Features
- Advanced mood simulation
- Community voting influence
- Dynamic personality evolution
- Seasonal behavior patterns
- Collaborative decision-making

---

**Remember**: The AI is not predictable. It has moods, impulses, and creativity. This is by design.
