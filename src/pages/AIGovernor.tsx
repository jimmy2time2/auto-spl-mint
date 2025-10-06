/**
 * AI Governor Page
 * 
 * Main page for viewing and monitoring the autonomous AI Governor
 */

import { AIGovernorDashboard } from '@/components/AIGovernorDashboard';

export default function AIGovernor() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">AI Governor</h1>
        <p className="text-muted-foreground text-lg">
          The autonomous AI Mind that governs the Mind9 ecosystem
        </p>
      </div>

      <AIGovernorDashboard />
    </div>
  );
}
