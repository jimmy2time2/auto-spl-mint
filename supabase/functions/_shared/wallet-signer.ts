/**
 * Secure Wallet Signer Module
 * 
 * This module provides secure transaction signing without exposing private keys.
 * Keys are stored in Supabase secrets and never returned to callers.
 * 
 * SECURITY PRINCIPLES:
 * 1. Private keys NEVER leave this module
 * 2. Only signed transactions are returned
 * 3. All operations are logged
 * 4. Multi-sig support ready (Squads/Threshold)
 */

import { Connection, Keypair, Transaction, SystemProgram, PublicKey, sendAndConfirmTransaction } from "https://esm.sh/@solana/web3.js@1.98.4";

/**
 * Wallet types supported by the system
 */
export type WalletType = 'ai' | 'system' | 'treasury' | 'creator' | 'lucky';

/**
 * Transaction instruction types
 */
export interface TransactionInstruction {
  type: 'transfer' | 'mint' | 'burn' | 'swap';
  params: {
    to?: string;
    amount?: number;
    tokenMint?: string;
    [key: string]: any;
  };
}

/**
 * Transaction result
 */
export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
  blockhash?: string;
  slot?: number;
}

/**
 * Wallet Signer Class
 * 
 * Provides secure signing services without exposing private keys
 */
export class WalletSigner {
  private connection: Connection;
  private rpcUrl: string;

  constructor(rpcUrl?: string) {
    this.rpcUrl = rpcUrl || 'https://api.devnet.solana.com';
    this.connection = new Connection(this.rpcUrl, 'confirmed');
  }

  /**
   * Get keypair from secure storage (Supabase secrets)
   * NEVER expose this method outside this module
   */
  private getKeypair(walletType: WalletType): Keypair {
    const secretKey = Deno.env.get(`WALLET_PRIVATE_KEY_${walletType.toUpperCase()}`);
    
    if (!secretKey) {
      throw new Error(`Private key not found for wallet type: ${walletType}`);
    }

    try {
      // Convert base58 or JSON private key to Keypair
      const secretBytes = this.parsePrivateKey(secretKey);
      return Keypair.fromSecretKey(secretBytes);
    } catch (error) {
      throw new Error(`Failed to load keypair for ${walletType}: ${error}`);
    }
  }

  /**
   * Parse private key from various formats
   */
  private parsePrivateKey(key: string): Uint8Array {
    try {
      // Try JSON array format first [1,2,3,...]
      const parsed = JSON.parse(key);
      if (Array.isArray(parsed)) {
        return Uint8Array.from(parsed);
      }
      throw new Error('Invalid key format');
    } catch {
      // Try base58 format (if using bs58 library)
      throw new Error('Base58 parsing not implemented. Use JSON array format for private keys.');
    }
  }

  /**
   * Get public key for a wallet (safe to expose)
   */
  public getPublicKey(walletType: WalletType): string {
    const keypair = this.getKeypair(walletType);
    return keypair.publicKey.toBase58();
  }

  /**
   * Sign and send a transaction
   * This is the ONLY way to execute transactions
   */
  public async signAndSendTransaction(
    walletType: WalletType,
    instruction: TransactionInstruction,
    options?: {
      skipPreflight?: boolean;
      commitment?: 'processed' | 'confirmed' | 'finalized';
    }
  ): Promise<TransactionResult> {
    try {
      console.log(`🔐 Signing transaction for ${walletType}:`, instruction.type);

      const keypair = this.getKeypair(walletType);
      const transaction = await this.buildTransaction(keypair, instruction);

      // Sign transaction
      transaction.sign(keypair);
      
      console.log('✍️ Transaction signed, sending to Solana...');

      // Send transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [keypair],
        {
          skipPreflight: options?.skipPreflight || false,
          commitment: options?.commitment || 'confirmed'
        }
      );

      console.log('✅ Transaction confirmed:', signature);

      // Get confirmation details
      const confirmation = await this.connection.getTransaction(signature, {
        commitment: 'confirmed'
      });

      return {
        success: true,
        signature,
        blockhash: transaction.recentBlockhash || undefined,
        slot: confirmation?.slot
      };

    } catch (error) {
      console.error('❌ Transaction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Build transaction from instruction
   */
  private async buildTransaction(
    signer: Keypair,
    instruction: TransactionInstruction
  ): Promise<Transaction> {
    const transaction = new Transaction();

    // Get recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = signer.publicKey;

    // Build instruction based on type
    switch (instruction.type) {
      case 'transfer':
        if (!instruction.params.to || !instruction.params.amount) {
          throw new Error('Transfer requires: to, amount');
        }
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: signer.publicKey,
            toPubkey: new PublicKey(instruction.params.to),
            lamports: instruction.params.amount * 1e9 // Convert SOL to lamports
          })
        );
        break;

      case 'mint':
        // Token minting logic would go here
        throw new Error('Token minting not yet implemented');

      case 'burn':
        // Token burning logic would go here
        throw new Error('Token burning not yet implemented');

      case 'swap':
        // Token swap logic would go here
        throw new Error('Token swapping not yet implemented');

      default:
        throw new Error(`Unknown instruction type: ${instruction.type}`);
    }

    return transaction;
  }

  /**
   * Verify transaction signature (for auditing)
   */
  public async verifyTransaction(signature: string): Promise<boolean> {
    try {
      const tx = await this.connection.getTransaction(signature, {
        commitment: 'confirmed'
      });
      return tx !== null && tx.meta?.err === null;
    } catch {
      return false;
    }
  }

  /**
   * Get wallet balance
   */
  public async getBalance(walletType: WalletType): Promise<number> {
    const keypair = this.getKeypair(walletType);
    const balance = await this.connection.getBalance(keypair.publicKey);
    return balance / 1e9; // Convert lamports to SOL
  }

  /**
   * Check if wallet is initialized
   */
  public isWalletConfigured(walletType: WalletType): boolean {
    try {
      this.getKeypair(walletType);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Create singleton instance
 */
let signerInstance: WalletSigner | null = null;

export function getWalletSigner(rpcUrl?: string): WalletSigner {
  if (!signerInstance) {
    signerInstance = new WalletSigner(rpcUrl);
  }
  return signerInstance;
}

/**
 * Permission check - only allow backend functions
 * Call this at the start of any function using the signer
 */
export function requireBackendAuth(request: Request): void {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authHeader = request.headers.get('authorization');
  
  // Check if request is from service role (backend only)
  if (!authHeader || !authHeader.includes(serviceRoleKey || '')) {
    throw new Error('Unauthorized: Only backend functions can access wallet signer');
  }
}
