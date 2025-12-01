import { ReactNode } from "react";

interface TerminalCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

const TerminalCard = ({ title, children, className = "" }: TerminalCardProps) => {
  return (
    <div 
      className={`bg-card border-4 border-border p-6 transition-all relative ${className}`}
      style={{
        boxShadow: `
          0 0 20px hsl(var(--terminal-glow) / 0.4),
          inset 0 0 20px hsl(var(--terminal-glow) / 0.05),
          0 0 40px hsl(var(--terminal-glow) / 0.2)
        `,
        background: `
          linear-gradient(180deg, 
            hsl(var(--card)) 0%, 
            hsl(var(--card) / 0.95) 100%
          )
        `
      }}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary" 
           style={{ filter: 'drop-shadow(0 0 4px hsl(var(--terminal-glow)))' }} />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary" 
           style={{ filter: 'drop-shadow(0 0 4px hsl(var(--terminal-glow)))' }} />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary" 
           style={{ filter: 'drop-shadow(0 0 4px hsl(var(--terminal-glow)))' }} />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary" 
           style={{ filter: 'drop-shadow(0 0 4px hsl(var(--terminal-glow)))' }} />
      
      {title && (
        <div className="mb-4 pb-3 border-b-2 border-primary/30">
          <h3 className="module-header">
            {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  );
};

export default TerminalCard;
