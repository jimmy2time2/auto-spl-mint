import { ReactNode } from "react";

interface TerminalCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

const TerminalCard = ({ title, children, className = "" }: TerminalCardProps) => {
  return (
    <div className={`bg-card border border-border p-8 rounded-3xl hover:shadow-lg transition-shadow ${className}`}>
      {title && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  );
};

export default TerminalCard;
