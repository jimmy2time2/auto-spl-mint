import { ReactNode } from "react";

interface TerminalCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

const TerminalCard = ({ title, children, className = "" }: TerminalCardProps) => {
  return (
    <div className={`border-2 border-black bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all ${className}`}>
      {title && (
        <div className="border-b-2 border-dashed border-black pb-3 mb-4">
          <h3 className="terminal-text text-foreground uppercase">
            // {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  );
};

export default TerminalCard;
