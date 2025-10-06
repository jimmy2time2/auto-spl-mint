# Mind9 AI Governor - Wallet & Fee Logic

## 🏦 Wallet Distribution Summary

### Token Mint (Initial Distribution)
| Wallet Type | Allocation | Purpose |
|------------|-----------|----------|
| **Public Sale** | 83% | Available for trading |
| **AI Wallet** | 7% | Autonomous profit generation |
| **Creator Wallet** | 5% | Token creator reward |
| **Lucky Wallet** | 3% | Random minter reward |
| **System Wallet** | 2% | Protocol operations |

### Trading Fees (Buy/Sell Transactions)
| Fee Type | Rate | Recipient |
|----------|------|-----------|
| **Creator Fee** | 1% | Token creator |
| **System Fee** | 1% | AI/Protocol wallet |
| **Net Amount** | 98% | Trader |

**CRITICAL:** The 2% trading fee (1% + 1%) is **MANDATORY** and cannot be bypassed. All trade functions enforce this.

### AI Profit Distribution (When AI Sells)
| Allocation | Percentage | Purpose |
|-----------|-----------|----------|
| **Reinvestment** | 80% | Buy back other tokens |
| **DAO Treasury** | 15% | Community governance |
| **Creator** | 2% | Additional creator reward |
| **Lucky Wallet** | 3% | Random recent trader |

## 🔄 Fee Flow Example

**User buys 1000 tokens:**
- Creator receives: 10 tokens (1%)
- System receives: 10 tokens (1%)
- User receives: 980 tokens (98%)
- Logged in `trade_fees_log` table

**AI Wallet sells 500 tokens profit:**
1. First: Trading fees applied (1% creator, 1% system)
2. Then: Net profit distributed (80/15/2/3 split)
3. Lucky lottery triggered
4. All logged to `protocol_activity`

## 🛡️ Security Notes

- Creator wallet pulled dynamically from token metadata (`mint_address`)
- System wallet from env: `SYSTEM_WALLET_ADDRESS` (fallback: `system_ai_wallet`)
- All fees logged to `trade_fees_log` with transaction hash
- Creator profits tracked in `creator_wallet_profits` table
- **Fees are backend-only** - never exposed to frontend

## 📊 Database Tables

### `trade_fees_log`
Stores all trading fee transactions:
- `trade_amount`: Original transaction amount
- `creator_fee`: 1% fee to creator
- `system_fee`: 1% fee to system
- `trader_address`: Who made the trade
- `token_id`: Which token was traded
- `trade_type`: 'buy' or 'sell'

### `creator_wallet_profits`
Tracks all creator earnings:
- `profit_source`: Where profit came from (e.g., 'trade_buy_fee', 'trade_sell_fee', 'mint_allocation')
- `amount`: Amount earned
- `creator_address`: Creator's wallet
- `token_id`: Related token

## 🤖 AI Governor Integration

The `handleTrade()` function in `ai-governor` automatically:
1. Calculates 2% fees (1% creator + 1% system)
2. Logs to `trade_fees_log`
3. Records creator profit
4. Detects whale activity on **net amount**
5. Updates DAO eligibility
6. If AI wallet is selling, triggers profit distribution

**Never bypass fee logic** - it's core protocol functionality.
