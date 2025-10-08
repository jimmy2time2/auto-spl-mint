/**
 * Security Validator
 * 
 * Validates all AI-triggered actions before execution
 * Prevents unsafe operations and SQL injection
 */

import { supabase } from "@/integrations/supabase/client";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitized?: any;
}

export class SecurityValidator {
  private readonly MAX_TOKEN_SUPPLY = 1000000000000; // 1 trillion
  private readonly MIN_TOKEN_SUPPLY = 1000;
  private readonly MAX_PERCENTAGE = 100;
  private readonly DANGEROUS_PATTERNS = [
    /;\s*DROP/i,
    /;\s*DELETE/i,
    /;\s*TRUNCATE/i,
    /;\s*ALTER/i,
    /--/,
    /\/\*/,
    /<script/i,
    /javascript:/i
  ];

  /**
   * Validate token creation parameters
   */
  validateTokenCreation(params: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate name
    if (!params.name || typeof params.name !== 'string') {
      errors.push('Token name is required and must be a string');
    } else if (params.name.length < 2) {
      errors.push('Token name must be at least 2 characters');
    } else if (params.name.length > 50) {
      errors.push('Token name must be less than 50 characters');
    } else if (this.containsDangerousPatterns(params.name)) {
      errors.push('Token name contains dangerous patterns');
    }

    // Validate symbol
    if (!params.symbol || typeof params.symbol !== 'string') {
      errors.push('Token symbol is required and must be a string');
    } else if (params.symbol.length < 2) {
      errors.push('Token symbol must be at least 2 characters');
    } else if (params.symbol.length > 10) {
      errors.push('Token symbol must be less than 10 characters');
    } else if (!/^[A-Z0-9]+$/.test(params.symbol)) {
      errors.push('Token symbol must contain only uppercase letters and numbers');
    }

    // Validate supply
    if (!params.supply || typeof params.supply !== 'number') {
      errors.push('Token supply is required and must be a number');
    } else if (params.supply < this.MIN_TOKEN_SUPPLY) {
      errors.push(`Token supply must be at least ${this.MIN_TOKEN_SUPPLY}`);
    } else if (params.supply > this.MAX_TOKEN_SUPPLY) {
      errors.push(`Token supply must be less than ${this.MAX_TOKEN_SUPPLY}`);
    }

    // Validate poem (optional)
    if (params.poem && typeof params.poem === 'string') {
      if (params.poem.length > 500) {
        warnings.push('Poem is very long (>500 chars)');
      }
      if (this.containsDangerousPatterns(params.poem)) {
        errors.push('Poem contains dangerous patterns');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitized: this.sanitizeTokenParams(params)
    };
  }

  /**
   * Validate profit sale parameters
   */
  validateProfitSale(params: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate token ID
    if (!params.tokenId || typeof params.tokenId !== 'string') {
      errors.push('Token ID is required and must be a string');
    } else if (!this.isValidUUID(params.tokenId)) {
      errors.push('Token ID must be a valid UUID');
    }

    // Validate percentage
    if (!params.percentage || typeof params.percentage !== 'number') {
      errors.push('Percentage is required and must be a number');
    } else if (params.percentage <= 0 || params.percentage > this.MAX_PERCENTAGE) {
      errors.push(`Percentage must be between 0 and ${this.MAX_PERCENTAGE}`);
    } else if (params.percentage > 30) {
      warnings.push('Selling more than 30% may impact price');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitized: params
    };
  }

  /**
   * Validate wallet addresses
   */
  validateWalletAddresses(addresses: string[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(addresses)) {
      errors.push('Addresses must be an array');
      return { valid: false, errors, warnings };
    }

    if (addresses.length === 0) {
      errors.push('At least one address is required');
    }

    if (addresses.length > 100) {
      warnings.push('Processing more than 100 addresses may be slow');
    }

    addresses.forEach((addr, idx) => {
      if (typeof addr !== 'string') {
        errors.push(`Address at index ${idx} must be a string`);
      } else if (addr.length < 32 || addr.length > 44) {
        errors.push(`Address at index ${idx} has invalid length`);
      } else if (this.containsDangerousPatterns(addr)) {
        errors.push(`Address at index ${idx} contains dangerous patterns`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitized: addresses.filter(a => typeof a === 'string')
    };
  }

  /**
   * Validate DAO proposal
   */
  validateDAOProposal(params: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate title
    if (!params.title || typeof params.title !== 'string') {
      errors.push('Proposal title is required');
    } else if (params.title.length < 5) {
      errors.push('Proposal title must be at least 5 characters');
    } else if (params.title.length > 200) {
      errors.push('Proposal title must be less than 200 characters');
    } else if (this.containsDangerousPatterns(params.title)) {
      errors.push('Proposal title contains dangerous patterns');
    }

    // Validate description
    if (!params.description || typeof params.description !== 'string') {
      errors.push('Proposal description is required');
    } else if (params.description.length < 20) {
      errors.push('Proposal description must be at least 20 characters');
    } else if (params.description.length > 5000) {
      errors.push('Proposal description must be less than 5000 characters');
    } else if (this.containsDangerousPatterns(params.description)) {
      errors.push('Proposal description contains dangerous patterns');
    }

    // Validate payout (optional)
    if (params.payout_address && params.payout_amount) {
      if (typeof params.payout_amount !== 'number' || params.payout_amount <= 0) {
        errors.push('Payout amount must be a positive number');
      }
      if (typeof params.payout_address !== 'string') {
        errors.push('Payout address must be a string');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitized: this.sanitizeProposal(params)
    };
  }

  /**
   * Validate clue/hint message
   */
  validateClue(clue: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof clue !== 'string') {
      errors.push('Clue must be a string');
    } else if (clue.length < 10) {
      errors.push('Clue must be at least 10 characters');
    } else if (clue.length > 280) {
      errors.push('Clue must be less than 280 characters (Twitter-style)');
    } else if (this.containsDangerousPatterns(clue)) {
      errors.push('Clue contains dangerous patterns');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitized: this.sanitizeString(clue)
    };
  }

  /**
   * Check for dangerous SQL/XSS patterns
   */
  private containsDangerousPatterns(input: string): boolean {
    return this.DANGEROUS_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Validate UUID format
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Sanitize token parameters
   */
  private sanitizeTokenParams(params: any): any {
    return {
      name: this.sanitizeString(params.name),
      symbol: this.sanitizeString(params.symbol).toUpperCase(),
      supply: Math.max(this.MIN_TOKEN_SUPPLY, Math.min(this.MAX_TOKEN_SUPPLY, Number(params.supply))),
      poem: params.poem ? this.sanitizeString(params.poem) : undefined
    };
  }

  /**
   * Sanitize proposal parameters
   */
  private sanitizeProposal(params: any): any {
    return {
      title: this.sanitizeString(params.title),
      description: this.sanitizeString(params.description),
      tags: Array.isArray(params.tags) ? params.tags.map((t: any) => this.sanitizeString(t)) : [],
      payout_address: params.payout_address ? this.sanitizeString(params.payout_address) : undefined,
      payout_amount: params.payout_amount ? Number(params.payout_amount) : undefined
    };
  }

  /**
   * Sanitize string input
   */
  private sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/\\/g, '') // Remove backslashes
      .replace(/\0/g, ''); // Remove null bytes
  }

  /**
   * Log validation attempt
   */
  async logValidation(
    action: string,
    result: ValidationResult,
    params: any
  ): Promise<void> {
    try {
      await supabase.from('protocol_activity').insert({
        activity_type: 'security_validation',
        description: `Security validation: ${action}`,
        metadata: {
          action,
          valid: result.valid,
          errors: result.errors,
          warnings: result.warnings,
          timestamp: new Date().toISOString()
        } as any
      });
    } catch (error) {
      console.error('[SECURITY] Failed to log validation:', error);
    }
  }
}
