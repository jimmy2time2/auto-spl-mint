import { ReactNode } from "react";

interface TerminalCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

const TerminalCard = ({ title, children, className = "" }: TerminalCardProps) => {
  return (
    <div className={`bg-card border-2 border-border p-6 hover:shadow-none transition-all ${className}`}>
      {title && (
        <div className="mb-6">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground border-b border-border pb-2">
            {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  );
};

export default TerminalCard;
