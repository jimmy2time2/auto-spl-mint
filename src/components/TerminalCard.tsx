import { ReactNode } from "react";

interface TerminalCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

const TerminalCard = ({ title, children, className = "" }: TerminalCardProps) => {
  return (
    <div className={`border-2 border-primary bg-card glow-border ${className}`}>
      {title && (
        <div className="border-b-2 border-primary px-4 py-2 bg-muted flex items-center gap-3">
          <span className="power-pulse">⏻</span>
          <span className="data-sm">{title}</span>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default TerminalCard;
