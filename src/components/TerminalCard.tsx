import { ReactNode } from "react";

interface TerminalCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

const TerminalCard = ({ title, children, className = "" }: TerminalCardProps) => {
  return (
    <div className={`bg-card border-2 border-border p-6 transition-all ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="metric-label text-muted-foreground font-bold">
            {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  );
};

export default TerminalCard;
