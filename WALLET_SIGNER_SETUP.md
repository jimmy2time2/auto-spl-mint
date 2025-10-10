# 🔐 Wallet Signer Setup Guide

Complete guide to setting up the secure wallet signing service for Mind9.

## Overview

The wallet signer provides secure transaction signing without exposing private keys to the AI, frontend, or any unauthorized services. All private keys are stored in Supabase secrets and accessed only by the backend signing module.

## 🎯 Quick Setup Checklist

- [ ] Install Solana CLI
- [ ] Generate 5 wallet keypairs (AI, System, Treasury, Creator, Lucky)
- [ ] Add private keys to Supabase secrets
- [ ] Fund wallets with SOL for transaction fees
- [ ] Test wallet executor function
- [ ] Verify all wallets are working

## 📋 Detailed Setup

### Step 1: Install Solana CLI

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Verify installation
solana --version
```

### Step 2: Generate Wallet Keypairs

Generate a keypair for each wallet type:

```bash
# Create directory for wallets
mkdir -p solana-wallets
cd solana-wallets

# Generate keypairs
solana-keygen new --outfile ai-wallet.json --no-bip39-passphrase
solana-keygen new --outfile system-wallet.json --no-bip39-passphrase
solana-keygen new --outfile treasury-wallet.json --no-bip39-passphrase
solana-keygen new --outfile creator-wallet.json --no-bip39-passphrase
solana-keygen new --outfile lucky-wallet.json --no-bip39-passphrase
```

**Important**: Save these files securely! They contain your private keys.

### Step 3: Get Public Addresses

```bash
# Get public addresses for each wallet
echo "AI Wallet:"
solana address -k ai-wallet.json

echo "System Wallet:"
solana address -k system-wallet.json

echo "Treasury Wallet:"
solana address -k treasury-wallet.json

echo "Creator Wallet:"
solana address -k creator-wallet.json

echo "Lucky Wallet:"
solana address -k lucky-wallet.json
```

Save these addresses - you'll need them for the database.

### Step 4: Add Private Keys to Supabase Secrets

**CRITICAL**: Private keys must be in JSON array format.

Each keypair file is already a JSON array. To add them to Supabase:

1. Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. Add these secrets (copy the ENTIRE contents of each JSON file):

```
WALLET_PRIVATE_KEY_AI=[123,45,67,89,...]
WALLET_PRIVATE_KEY_SYSTEM=[123,45,67,89,...]
WALLET_PRIVATE_KEY_TREASURY=[123,45,67,89,...]
WALLET_PRIVATE_KEY_CREATOR=[123,45,67,89,...]
WALLET_PRIVATE_KEY_LUCKY=[123,45,67,89,...]
```

**To get the JSON array:**
```bash
# Display the private key array
cat ai-wallet.json
# Copy the entire output: [123,45,67,...]
```

### Step 5: Update Database with Wallet Addresses

Run this SQL in Supabase SQL Editor:

```sql
-- Update or insert wallet records
INSERT INTO public.wallets (type, address, balance, total_rewards, reward_count)
VALUES 
  ('ai', 'YOUR_AI_WALLET_ADDRESS', 0, 0, 0),
  ('system', 'YOUR_SYSTEM_WALLET_ADDRESS', 0, 0, 0),
  ('creator', 'YOUR_CREATOR_WALLET_ADDRESS', 0, 0, 0),
  ('public_lucky', 'YOUR_LUCKY_WALLET_ADDRESS', 0, 0, 0)
ON CONFLICT (address) DO UPDATE 
SET type = EXCLUDED.type;

-- Update DAO treasury address if needed
UPDATE public.dao_treasury 
SET id = 'YOUR_TREASURY_WALLET_ADDRESS'
WHERE id = (SELECT id FROM public.dao_treasury LIMIT 1);
```

### Step 6: Fund Wallets

#### For Devnet (Testing)
```bash
# Airdrop SOL to each wallet
solana airdrop 2 $(solana address -k ai-wallet.json) --url devnet
solana airdrop 2 $(solana address -k system-wallet.json) --url devnet
solana airdrop 2 $(solana address -k treasury-wallet.json) --url devnet
solana airdrop 2 $(solana address -k creator-wallet.json) --url devnet
solana airdrop 2 $(solana address -k lucky-wallet.json) --url devnet
```

#### For Mainnet (Production)
Transfer SOL from your main wallet:
```bash
solana transfer <WALLET_ADDRESS> 1.0 --from <YOUR_FUNDING_KEYPAIR>
```

### Step 7: Verify Setup

Test the wallet executor:

```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/wallet-executor \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_type": "ai",
    "instruction_type": "transfer",
    "params": {
      "to": "TEST_RECIPIENT_ADDRESS",
      "amount": 0.001
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "transaction_signature": "...",
  "message": "Transaction executed and confirmed on Solana"
}
```

## 🔧 Configuration

### Environment Variables

These are automatically available in Supabase Edge Functions:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (never expose)
- `WALLET_PRIVATE_KEY_AI` - AI wallet private key
- `WALLET_PRIVATE_KEY_SYSTEM` - System wallet private key
- `WALLET_PRIVATE_KEY_TREASURY` - Treasury wallet private key
- `WALLET_PRIVATE_KEY_CREATOR` - Creator wallet private key
- `WALLET_PRIVATE_KEY_LUCKY` - Lucky wallet private key

### Network Configuration

By default, the signer uses Solana devnet. To switch networks:

```typescript
// In your edge function
const signer = getWalletSigner('https://api.mainnet-beta.solana.com');
```

Available networks:
- Devnet: `https://api.devnet.solana.com`
- Testnet: `https://api.testnet.solana.com`
- Mainnet: `https://api.mainnet-beta.solana.com`

## 🛡️ Security Best Practices

### 1. Key Storage
- ✅ Store private keys ONLY in Supabase secrets
- ✅ Use different keys for devnet/testnet/mainnet
- ✅ Rotate keys periodically (quarterly recommended)
- ❌ NEVER commit private keys to git
- ❌ NEVER expose keys in frontend code
- ❌ NEVER share keys via chat/email

### 2. Access Control
- ✅ Only backend functions can call wallet-executor
- ✅ Use service role key for authentication
- ✅ Log all transaction attempts
- ✅ Monitor for suspicious activity
- ❌ NEVER allow frontend access to wallet-executor
- ❌ NEVER skip authentication checks

### 3. Transaction Safety
- ✅ Validate all input parameters
- ✅ Check wallet balances before operations
- ✅ Set reasonable transaction limits
- ✅ Implement rate limiting
- ✅ Use multi-sig for large amounts (coming soon)
- ❌ NEVER skip validation
- ❌ NEVER trust user input without sanitization

### 4. Operational Security
- ✅ Use devnet for all testing
- ✅ Monitor wallet balances regularly
- ✅ Keep sufficient SOL for transaction fees
- ✅ Set up alerts for low balances
- ✅ Audit transaction logs weekly
- ❌ NEVER test on mainnet with real funds
- ❌ NEVER let wallets run out of SOL

## 📊 Monitoring & Maintenance

### Check Wallet Balances

```sql
-- Query wallet balances from database
SELECT type, address, balance, total_rewards, reward_count 
FROM public.wallets 
ORDER BY type;
```

Or via the signer module:
```typescript
import { getWalletSigner } from './_shared/wallet-signer.ts';

const signer = getWalletSigner();
const aiBalance = await signer.getBalance('ai');
console.log(`AI Wallet: ${aiBalance} SOL`);
```

### Transaction Logs

```sql
-- Recent wallet executions
SELECT 
  timestamp,
  metadata->>'wallet_type' as wallet,
  metadata->>'instruction_type' as action,
  metadata->>'transaction_signature' as tx
FROM protocol_activity 
WHERE activity_type = 'wallet_execution' 
ORDER BY timestamp DESC 
LIMIT 20;
```

### Health Check Script

Create a scheduled function to monitor wallet health:

```typescript
// supabase/functions/wallet-health-check/index.ts
import { getWalletSigner } from "../_shared/wallet-signer.ts";

const MIN_BALANCE = 0.5; // SOL

async function checkHealth() {
  const signer = getWalletSigner();
  const wallets = ['ai', 'system', 'treasury', 'creator', 'lucky'];
  
  for (const wallet of wallets) {
    try {
      if (!signer.isWalletConfigured(wallet)) {
        console.warn(`⚠️ ${wallet} wallet not configured`);
        continue;
      }
      
      const balance = await signer.getBalance(wallet);
      
      if (balance < MIN_BALANCE) {
        console.error(`❌ ${wallet} wallet low balance: ${balance} SOL`);
        // TODO: Send alert (email, Discord, etc.)
      } else {
        console.log(`✅ ${wallet} wallet healthy: ${balance} SOL`);
      }
    } catch (error) {
      console.error(`Error checking ${wallet}:`, error);
    }
  }
}
```

## 🚨 Troubleshooting

### "Private key not found" Error

**Solution**: Verify secret is added correctly in Supabase
```bash
# Check secret format (should be JSON array)
cat ai-wallet.json
# Ensure it looks like: [123,45,67,...]

# In Supabase, add as:
WALLET_PRIVATE_KEY_AI=[paste entire array]
```

### "Transaction failed" Error

**Possible causes**:
1. Insufficient SOL balance for fees
   - Check: `solana balance <ADDRESS> --url devnet`
   - Fix: Airdrop more SOL
   
2. Invalid recipient address
   - Verify address is valid Solana public key
   
3. Network issues
   - Check Solana status: https://status.solana.com/
   
4. Rate limiting
   - Wait and retry

### "Unauthorized" Error

**Solution**: Ensure using service role key
```typescript
// ✅ Correct
const supabase = createClient(url, serviceRoleKey);

// ❌ Wrong
const supabase = createClient(url, anonKey);
```

### Wallet Not Responding

1. Check if wallet is configured:
```typescript
const signer = getWalletSigner();
console.log('Configured:', signer.isWalletConfigured('ai'));
```

2. Verify network connectivity:
```bash
solana cluster-version --url devnet
```

3. Check RPC endpoint health:
```bash
curl -X POST https://api.devnet.solana.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

## 🎓 Next Steps

1. **Test thoroughly on devnet** before mainnet
2. **Set up monitoring** for wallet balances
3. **Implement alerts** for low balances
4. **Plan key rotation** schedule
5. **Consider multi-sig** for treasury operations
6. **Document your procedures** for team

## 📚 Additional Resources

- [Solana CLI Reference](https://docs.solana.com/cli)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Wallet Signer Module](supabase/functions/_shared/wallet-signer.ts)
- [Integration Examples](supabase/functions/_shared/wallet-integration-example.ts)
- [Wallet Executor](supabase/functions/wallet-executor)

## 🆘 Support

If you encounter issues:
1. Check this guide thoroughly
2. Review function logs in Supabase Dashboard
3. Verify all secrets are configured correctly
4. Test on devnet first
5. Check Solana network status
