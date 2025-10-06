import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CreateProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
  onProposalCreated: () => void;
}

export function CreateProposalDialog({
  open,
  onOpenChange,
  walletAddress,
  onProposalCreated
}: CreateProposalDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    payout_address: '',
    payout_amount: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('dao-create-proposal', {
        body: {
          ...formData,
          wallet_address: walletAddress,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          payout_amount: formData.payout_amount ? parseFloat(formData.payout_amount) : null
        }
      });

      if (error) throw error;

      toast({
        title: 'Proposal Created',
        description: 'Your proposal has been submitted to the DAO'
      });

      setFormData({ title: '', description: '', tags: '', payout_address: '', payout_amount: '' });
      onOpenChange(false);
      onProposalCreated();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create proposal',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Proposal</DialogTitle>
          <DialogDescription>
            Submit a proposal for the DAO to vote on. Requires DAO eligibility.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Proposal title..."
              required
              minLength={5}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your proposal in detail..."
              required
              minLength={20}
              maxLength={5000}
              rows={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="token policy, treasury, gameplay"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payout_address">Payout Address (optional)</Label>
              <Input
                id="payout_address"
                value={formData.payout_address}
                onChange={(e) => setFormData({ ...formData, payout_address: e.target.value })}
                placeholder="0x..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payout_amount">Payout Amount (SOL)</Label>
              <Input
                id="payout_amount"
                type="number"
                step="0.01"
                value={formData.payout_amount}
                onChange={(e) => setFormData({ ...formData, payout_amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Proposal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
