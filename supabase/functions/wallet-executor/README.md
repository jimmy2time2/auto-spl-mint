# Wallet Executor - Secure Transaction Signing Service

A secure, isolated wallet signing service that never exposes private keys to the AI or frontend.

## 🔒 Security Architecture

### Key Principles
1. **Private keys NEVER leave the signer module**
2. **Only signed transactions are returned**
3. **Backend-only access** (service role auth required)
4. **All transactions are logged**
5. **Multi-sig ready** (Squads/Threshold support coming)

### How It Works
```
AI/Backend Function → Wallet Executor → Secure Signer → Solana Network
                          ↓
                    Logs Transaction
```

## 📋 Setup Instructions

### 1. Generate Wallet Keypairs

For each wallet type, generate a Solana keypair:

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Generate keypairs
solana-keygen new --outfile ai-wallet.json
solana-keygen new --outfile system-wallet.json
solana-keygen new --outfile treasury-wallet.json
solana-keygen new --outfile creator-wallet.json
solana-keygen new --outfile lucky-wallet.json
```

### 2. Add Private Keys to Supabase Secrets

**CRITICAL**: Private keys must be stored as JSON arrays, not base58 strings.

To convert a keypair file to the required format:

```bash
# Read the keypair (this is already a JSON array)
cat ai-wallet.json
# Example output: [123,45,67,89,...]
```

Add these secrets in Supabase:
- `WALLET_PRIVATE_KEY_AI`
- `WALLET_PRIVATE_KEY_SYSTEM`
- `WALLET_PRIVATE_KEY_TREASURY`
- `WALLET_PRIVATE_KEY_CREATOR`
- `WALLET_PRIVATE_KEY_LUCKY`

Each should be the full JSON array (e.g., `[123,45,67,...]`)

### 3. Fund Wallets

Fund each wallet with SOL for transaction fees:

```bash
# Get wallet addresses
solana address -k ai-wallet.json
solana address -k system-wallet.json
# ... etc

# Fund wallets (devnet example)
solana airdrop 2 <WALLET_ADDRESS> --url devnet
```

## 🎯 Usage

### Call from Backend Functions

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Execute a transfer
const { data, error } = await supabase.functions.invoke('wallet-executor', {
  body: {
    wallet_type: 'ai',           // Which wallet to use
    instruction_type: 'transfer', // What action to take
    params: {
      to: 'RECIPIENT_ADDRESS',
      amount: 0.1                // Amount in SOL
    }
  }
});
```

### Supported Wallet Types
- `ai` - AI Governor wallet (autonomous operations)
- `system` - System wallet (reinvestment, operations)
- `treasury` - DAO treasury wallet
- `creator` - Creator rewards wallet
- `lucky` - Lucky lottery wallet

### Supported Instructions

#### Transfer SOL
```typescript
{
  wallet_type: 'ai',
  instruction_type: 'transfer',
  params: {
    to: 'RECIPIENT_PUBLIC_KEY',
    amount: 0.5  // SOL amount
  }
}
```

#### Burn Tokens (coming soon)
```typescript
{
  wallet_type: 'ai',
  instruction_type: 'burn',
  params: {
    tokenMint: 'TOKEN_MINT_ADDRESS',
    amount: 100
  }
}
```

#### Swap Tokens (coming soon)
```typescript
{
  wallet_type: 'ai',
  instruction_type: 'swap',
  params: {
    fromToken: 'TOKEN_A_MINT',
    toToken: 'TOKEN_B_MINT',
    amount: 50
  }
}
```

## 🛡️ Security Features

### 1. Backend-Only Access
```typescript
// Automatically checks service role auth
requireBackendAuth(req);
```

Only functions with `SUPABASE_SERVICE_ROLE_KEY` can call this.

### 2. Private Key Isolation
```typescript
// ❌ NEVER EXPOSED
private getKeypair(walletType: WalletType): Keypair

// ✅ SAFE TO USE
public getPublicKey(walletType: WalletType): string
public signAndSendTransaction(...)
```

### 3. Transaction Logging
All transactions are logged to:
- `protocol_activity` table (public visibility)
- `logs` table (system logs)

### 4. Validation
- Input schema validation
- Wallet configuration checks
- Amount validation (must be positive)
- Transaction type validation

## 🔮 Future Enhancements

### Multi-Sig Support
Integration with Squads Protocol or Threshold Network:

```typescript
// Coming soon
{
  wallet_type: 'treasury',
  instruction_type: 'transfer',
  params: { ... },
  multisig: {
    threshold: 2,
    signers: ['PUBKEY1', 'PUBKEY2', 'PUBKEY3']
  }
}
```

### Hardware Wallet Support
Support for Ledger/Trezor signing:

```typescript
// Coming soon
{
  wallet_type: 'treasury',
  hardware_signer: {
    type: 'ledger',
    derivation_path: "44'/501'/0'/0'"
  }
}
```

## 📊 Monitoring

### Check Wallet Balances
```typescript
const signer = getWalletSigner();
const balance = await signer.getBalance('ai');
console.log(`AI Wallet Balance: ${balance} SOL`);
```

### Verify Transactions
```typescript
const signer = getWalletSigner();
const isValid = await signer.verifyTransaction('SIGNATURE');
console.log(`Transaction valid: ${isValid}`);
```

### Query Transaction Logs
```sql
-- Recent wallet executions
SELECT * FROM protocol_activity 
WHERE activity_type = 'wallet_execution' 
ORDER BY timestamp DESC 
LIMIT 20;

-- Transactions by wallet
SELECT metadata->>'wallet_type' as wallet,
       COUNT(*) as tx_count,
       SUM((metadata->>'params'->>'amount')::numeric) as total_amount
FROM protocol_activity
WHERE activity_type = 'wallet_execution'
GROUP BY wallet;
```

## ⚠️ Important Notes

1. **Never commit private keys** to git
2. **Use devnet for testing** before mainnet
3. **Monitor wallet balances** - ensure sufficient SOL for fees
4. **Rotate keys periodically** for security
5. **Enable multi-sig** for treasury operations (coming soon)
6. **Audit all transactions** via logs

## 🆘 Troubleshooting

### Error: "Private key not found"
- Add `WALLET_PRIVATE_KEY_<TYPE>` to Supabase secrets
- Format must be JSON array: `[123,45,67,...]`

### Error: "Unauthorized: Only backend functions"
- Ensure you're calling with service role key
- Check authorization header

### Error: "Transaction failed"
- Check wallet has sufficient SOL balance
- Verify recipient address is valid
- Check Solana network status

### Check Configuration
```typescript
const signer = getWalletSigner();
console.log('AI Wallet configured:', signer.isWalletConfigured('ai'));
console.log('System Wallet configured:', signer.isWalletConfigured('system'));
```
