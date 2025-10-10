/**
 * Profit Allocation Manager
 * 
 * Manages dynamic profit split allocations across the protocol.
 * Replaces hardcoded splits with database-driven, AI-adjustable allocations.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * Allocation percentages
 */
export interface AllocationSplit {
  reinvestment: number;  // System wallet for reinvestment
  dao: number;          // DAO treasury
  lucky: number;        // Lucky lottery pool
  creator: number;      // Creator rewards
}

/**
 * Allocation proposal
 */
export interface AllocationProposal {
  id?: string;
  reinvestment_pct: number;
  dao_pct: number;
  lucky_pct: number;
  creator_pct: number;
  reasoning: string;
  confidence: number;
  input_metrics: any;
  proposed_by: 'ai' | 'manual' | 'system';
}

/**
 * Allocation Manager Class
 */
export class AllocationManager {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Get current active allocation split
   */
  async getCurrentAllocation(): Promise<AllocationSplit> {
    const { data, error } = await this.supabase
      .from('profit_allocation_log')
      .select('*')
      .eq('status', 'active')
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch allocation:', error);
      // Fallback to defaults
      return {
        reinvestment: 80,
        dao: 15,
        lucky: 3,
        creator: 2
      };
    }

    if (!data) {
      console.warn('No active allocation found, using defaults');
      return {
        reinvestment: 80,
        dao: 15,
        lucky: 3,
        creator: 2
      };
    }

    return {
      reinvestment: parseFloat(data.reinvestment_pct.toString()),
      dao: parseFloat(data.dao_pct.toString()),
      lucky: parseFloat(data.lucky_pct.toString()),
      creator: parseFloat(data.creator_pct.toString())
    };
  }

  /**
   * Calculate actual amounts from percentages
   */
  calculateAmounts(totalProfit: number, split?: AllocationSplit): {
    reinvestment: number;
    dao: number;
    lucky: number;
    creator: number;
  } {
    const allocation = split || {
      reinvestment: 80,
      dao: 15,
      lucky: 3,
      creator: 2
    };

    return {
      reinvestment: totalProfit * (allocation.reinvestment / 100),
      dao: totalProfit * (allocation.dao / 100),
      lucky: totalProfit * (allocation.lucky / 100),
      creator: totalProfit * (allocation.creator / 100)
    };
  }

  /**
   * Propose new allocation (AI or manual)
   */
  async proposeAllocation(proposal: AllocationProposal): Promise<string | null> {
    // Validate percentages sum to 100
    const total = proposal.reinvestment_pct + proposal.dao_pct + 
                  proposal.lucky_pct + proposal.creator_pct;
    
    if (Math.abs(total - 100) > 0.01) {
      throw new Error(`Allocation percentages must sum to 100. Got ${total}`);
    }

    // Validate reasonable ranges (optional safety checks)
    if (proposal.reinvestment_pct < 40 || proposal.reinvestment_pct > 90) {
      console.warn(`Reinvestment ${proposal.reinvestment_pct}% outside typical range (40-90%)`);
    }

    const { data, error } = await this.supabase
      .from('profit_allocation_log')
      .insert({
        status: 'proposed',
        proposed_by: proposal.proposed_by,
        reinvestment_pct: proposal.reinvestment_pct,
        dao_pct: proposal.dao_pct,
        lucky_pct: proposal.lucky_pct,
        creator_pct: proposal.creator_pct,
        reasoning: proposal.reasoning,
        confidence: proposal.confidence,
        input_metrics: proposal.input_metrics
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to propose allocation:', error);
      return null;
    }

    console.log('📝 Allocation proposed:', data.id);
    return data.id;
  }

  /**
   * Review and approve/reject a proposal
   * (Future: integrate with governance)
   */
  async reviewProposal(
    proposalId: string,
    decision: 'approved' | 'rejected',
    reviewedBy: string,
    notes?: string
  ): Promise<boolean> {
    const newStatus = decision === 'approved' ? 'active' : 'rejected';

    // If approving, deactivate current allocation
    if (decision === 'approved') {
      await this.supabase
        .from('profit_allocation_log')
        .update({
          status: 'active',
          effective_until: new Date().toISOString()
        })
        .eq('status', 'active')
        .neq('id', proposalId);
    }

    const { error } = await this.supabase
      .from('profit_allocation_log')
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
        review_notes: notes || null,
        effective_from: decision === 'approved' ? new Date().toISOString() : null
      })
      .eq('id', proposalId);

    if (error) {
      console.error('Failed to review proposal:', error);
      return false;
    }

    console.log(`✅ Allocation ${decision}:`, proposalId);
    return true;
  }

  /**
   * Get allocation history
   */
  async getAllocationHistory(limit: number = 10): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('profit_allocation_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch history:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get pending proposals
   */
  async getPendingProposals(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('profit_allocation_log')
      .select('*')
      .eq('status', 'proposed')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Failed to fetch proposals:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Validate allocation proposal makes sense
   */
  validateProposal(proposal: AllocationProposal): {
    valid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check sum
    const total = proposal.reinvestment_pct + proposal.dao_pct + 
                  proposal.lucky_pct + proposal.creator_pct;
    
    if (Math.abs(total - 100) > 0.01) {
      errors.push(`Percentages must sum to 100 (got ${total.toFixed(2)})`);
    }

    // Check ranges
    if (proposal.reinvestment_pct < 40) {
      warnings.push('Reinvestment below 40% may reduce system sustainability');
    }
    if (proposal.reinvestment_pct > 90) {
      warnings.push('Reinvestment above 90% may reduce community incentives');
    }
    if (proposal.dao_pct < 5) {
      warnings.push('DAO treasury below 5% may limit governance capacity');
    }
    if (proposal.lucky_pct < 1) {
      warnings.push('Lucky lottery below 1% may reduce user engagement');
    }
    if (proposal.creator_pct < 1) {
      warnings.push('Creator rewards below 1% may reduce builder incentives');
    }

    // Check confidence
    if (proposal.confidence < 0.5) {
      warnings.push('Low confidence score (<0.5) - consider gathering more data');
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors
    };
  }
}

/**
 * Create allocation manager instance
 */
export function createAllocationManager(supabase: SupabaseClient): AllocationManager {
  return new AllocationManager(supabase);
}
