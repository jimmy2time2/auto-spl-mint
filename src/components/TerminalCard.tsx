import { ReactNode } from "react";

interface TerminalCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

const TerminalCard = ({ title, children, className = "" }: TerminalCardProps) => {
  return (
    <div className={`border border-border bg-card ${className}`}>
      {title && (
        <div className="border-b border-border px-3 py-1.5 bg-muted">
          <span className="data-sm text-muted-foreground">{title}</span>
        </div>
      )}
      <div className="p-3">
        {children}
      </div>
    </div>
  );
};

export default TerminalCard;
