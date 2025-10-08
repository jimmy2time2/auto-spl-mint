interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

const MetricCard = ({ label, value, unit, trend, subtitle }: MetricCardProps) => {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
      {/* Decorative dots */}
      <div className="absolute top-4 right-4 flex gap-1">
        <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
        <div className="w-1 h-1 rounded-full bg-muted-foreground/20" />
        <div className="w-1 h-1 rounded-full bg-muted-foreground/10" />
      </div>

      <div className="space-y-3">
        <div className="metric-label">{label}</div>
        
        <div className="flex items-baseline gap-2">
          <div className="metric-display text-5xl text-metric-primary">
            {value}
          </div>
          {unit && (
            <div className="metric-label text-metric-secondary pb-1">
              {unit}
            </div>
          )}
        </div>

        {subtitle && (
          <div className="metric-label text-muted-foreground/60">
            {subtitle}
          </div>
        )}

        {trend && (
          <div className={`inline-flex items-center gap-1 text-xs ${
            trend === 'up' ? 'text-success-green' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
          }`}>
            <div className={`w-0 h-0 border-l-[4px] border-r-[4px] border-l-transparent border-r-transparent ${
              trend === 'up' ? 'border-b-[6px] border-b-current' : 
              trend === 'down' ? 'border-t-[6px] border-t-current' : 
              'hidden'
            }`} />
            <span className="metric-label">{trend === 'up' ? 'RISING' : trend === 'down' ? 'FALLING' : 'STABLE'}</span>
          </div>
        )}
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/[0.02] pointer-events-none group-hover:to-primary/[0.04] transition-all" />
    </div>
  );
};

export default MetricCard;
