import { ReactNode } from "react";

interface TerminalCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

const TerminalCard = ({ title, children, className = "" }: TerminalCardProps) => {
  return (
    <div className={`bg-card border-2 border-foreground p-6 ${className}`}>
      {title && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-foreground border-b-2 border-foreground pb-2">
            {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  );
};

export default TerminalCard;
