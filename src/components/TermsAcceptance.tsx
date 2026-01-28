import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TermsAcceptanceProps {
  open: boolean;
  onAccept: () => void;
  onReject: () => void;
}

type AcceptanceStep = 'jurisdiction' | 'terms' | 'risks' | 'confirm';

interface AcceptanceState {
  jurisdiction: boolean;
  age: boolean;
  terms: boolean;
  risks: boolean;
  lossAck: boolean;
  notAdvice: boolean;
}

export default function TermsAcceptance({ open, onAccept, onReject }: TermsAcceptanceProps) {
  const [step, setStep] = useState<AcceptanceStep>('jurisdiction');
  const [acceptance, setAcceptance] = useState<AcceptanceState>({
    jurisdiction: false,
    age: false,
    terms: false,
    risks: false,
    lossAck: false,
    notAdvice: false,
  });
  
  const canProceed = {
    jurisdiction: acceptance.jurisdiction && acceptance.age,
    terms: acceptance.terms,
    risks: acceptance.risks,
    confirm: acceptance.lossAck && acceptance.notAdvice,
  };
  
  const handleAccept = () => {
    localStorage.setItem('mind9_terms', JSON.stringify({
      timestamp: new Date().toISOString(),
      accepted: true,
    }));
    onAccept();
  };
  
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl bg-background border-border">
        {step === 'jurisdiction' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground">Eligibility Check</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded p-4">
                <p className="text-sm text-foreground">
                  Mind9 is NOT available in: United States, China, North Korea, Iran, Syria, Cuba
                </p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox 
                  checked={acceptance.jurisdiction}
                  onCheckedChange={(c) => setAcceptance(p => ({...p, jurisdiction: !!c}))}
                />
                <span className="text-sm text-foreground">I am NOT located in any restricted jurisdiction</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox 
                  checked={acceptance.age}
                  onCheckedChange={(c) => setAcceptance(p => ({...p, age: !!c}))}
                />
                <span className="text-sm text-foreground">I am at least 18 years old</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onReject}>Not Eligible</Button>
              <Button onClick={() => setStep('terms')} disabled={!canProceed.jurisdiction}>
                Continue
              </Button>
            </div>
          </>
        )}
        
        {step === 'terms' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground">Terms of Service</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-64 border border-border rounded p-4">
              <div className="prose prose-sm prose-invert">
                <h3 className="text-foreground">1. Acceptance of Terms</h3>
                <p className="text-muted-foreground">By accessing or using Mind9, you agree to be bound by these Terms of Service. If you do not agree, you must not use the platform.</p>
                
                <h3 className="text-foreground">2. Nature of the Platform</h3>
                <p className="text-muted-foreground">Mind9 is an autonomous AI-powered token creation platform. M9, the AI agent, operates independently and may create tokens, execute trades, and distribute profits without human intervention. All AI decisions are final and irreversible.</p>
                
                <h3 className="text-foreground">3. No Investment Advice</h3>
                <p className="text-muted-foreground">Mind9 does NOT provide investment, financial, tax, or legal advice. All content is for informational purposes only. You are solely responsible for your own investment decisions.</p>
                
                <h3 className="text-foreground">4. Limitation of Liability</h3>
                <p className="text-muted-foreground">To the maximum extent permitted by law, Mind9's total liability is limited to $100 USD. We are not liable for any indirect, incidental, or consequential damages.</p>
                
                <h3 className="text-foreground">5. User Responsibilities</h3>
                <p className="text-muted-foreground">You are responsible for securing your wallet, understanding blockchain technology, and complying with all applicable laws in your jurisdiction.</p>
              </div>
            </ScrollArea>
            <label className="flex items-start gap-3 pt-4 cursor-pointer">
              <Checkbox 
                checked={acceptance.terms}
                onCheckedChange={(c) => setAcceptance(p => ({...p, terms: !!c}))}
              />
              <span className="text-sm text-foreground">I have read and agree to the Terms of Service</span>
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('jurisdiction')}>Back</Button>
              <Button onClick={() => setStep('risks')} disabled={!canProceed.terms}>
                Continue
              </Button>
            </div>
          </>
        )}
        
        {step === 'risks' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-destructive">Risk Disclosure</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-64 border border-destructive/30 rounded p-4">
              <div className="prose prose-sm prose-invert">
                <div className="bg-destructive/20 p-4 rounded text-center font-bold text-foreground mb-4">
                  YOU MAY LOSE ALL YOUR INVESTED FUNDS
                </div>
                
                <h3 className="text-foreground">AI-Specific Risks</h3>
                <ul className="text-muted-foreground">
                  <li>M9 operates autonomously and may make decisions that result in losses</li>
                  <li>AI behavior is experimental and unpredictable</li>
                  <li>No human oversight on individual AI decisions</li>
                  <li>AI may create tokens that lose all value</li>
                </ul>
                
                <h3 className="text-foreground">Cryptocurrency Risks</h3>
                <ul className="text-muted-foreground">
                  <li>Extreme price volatility - tokens may lose 100% of value</li>
                  <li>No regulatory protection or deposit insurance</li>
                  <li>Smart contract bugs may cause loss of funds</li>
                  <li>Blockchain transactions are irreversible</li>
                </ul>
                
                <h3 className="text-foreground">Market Risks</h3>
                <ul className="text-muted-foreground">
                  <li>Meme tokens are highly speculative</li>
                  <li>Liquidity may be insufficient to exit positions</li>
                  <li>Market manipulation is common in crypto</li>
                </ul>
              </div>
            </ScrollArea>
            <label className="flex items-start gap-3 pt-4 cursor-pointer">
              <Checkbox 
                checked={acceptance.risks}
                onCheckedChange={(c) => setAcceptance(p => ({...p, risks: !!c}))}
              />
              <span className="text-sm text-foreground">I understand and accept all risks described above</span>
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('terms')}>Back</Button>
              <Button onClick={() => setStep('confirm')} disabled={!canProceed.risks}>
                Continue
              </Button>
            </div>
          </>
        )}
        
        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground">Final Confirmation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Before entering Mind9, please confirm the following:
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox 
                  checked={acceptance.lossAck}
                  onCheckedChange={(c) => setAcceptance(p => ({...p, lossAck: !!c}))}
                />
                <span className="text-sm text-foreground">
                  I understand I may lose all invested funds and am only using money I can afford to lose completely
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox 
                  checked={acceptance.notAdvice}
                  onCheckedChange={(c) => setAcceptance(p => ({...p, notAdvice: !!c}))}
                />
                <span className="text-sm text-foreground">
                  I understand Mind9 does NOT provide investment advice and I am solely responsible for my decisions
                </span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('risks')}>Back</Button>
              <Button 
                onClick={handleAccept} 
                disabled={!canProceed.confirm}
                className="bg-primary hover:bg-primary/90"
              >
                I Agree - Enter Mind9
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function useTermsAccepted(): boolean {
  const stored = localStorage.getItem('mind9_terms');
  if (!stored) return false;
  
  try {
    const { timestamp, accepted } = JSON.parse(stored);
    // Terms valid for 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return accepted && new Date(timestamp).getTime() > thirtyDaysAgo;
  } catch {
    return false;
  }
}
