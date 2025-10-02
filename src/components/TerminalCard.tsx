import { ReactNode } from "react";

interface TerminalCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

const TerminalCard = ({ title, children, className = "" }: TerminalCardProps) => {
  return (
    <div className={`border-2 border-black bg-card p-6 ${className}`}>
      {title && (
        <div className="border-b-2 border-dashed border-black pb-2 mb-4">
          <h3 className="font-bold terminal-text text-lg">// {title}</h3>
        </div>
      )}
      {children}
    </div>
  );
};

export default TerminalCard;
