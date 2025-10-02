import { ReactNode } from "react";

interface TerminalCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

const TerminalCard = ({ title, children, className = "" }: TerminalCardProps) => {
  return (
    <div className={`border border-border bg-card p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {title && (
        <div className="border-b border-border pb-3 mb-4">
          <h3 className="font-bold terminal-text text-sm uppercase tracking-wider text-muted-foreground">
            {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  );
};

export default TerminalCard;
