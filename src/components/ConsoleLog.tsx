import { useEffect, useRef } from "react";

interface LogEntry {
  timestamp: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
}

interface ConsoleLogProps {
  logs: LogEntry[];
  maxHeight?: string;
}

const ConsoleLog = ({ logs, maxHeight = "400px" }: ConsoleLogProps) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getLogColor = (type?: string) => {
    switch (type) {
      case 'error': return 'text-destructive';
      case 'success': return 'text-green-600';
      case 'warning': return 'text-orange-600';
      default: return '';
    }
  };

  return (
    <div 
      className="bg-black text-background p-4 font-mono text-sm overflow-y-auto"
      style={{ maxHeight }}
    >
      {logs.map((log, index) => (
        <div key={index} className={`mb-1 terminal-text ${getLogColor(log.type)}`}>
          <span className="opacity-70">[{log.timestamp}]</span> {log.message}
        </div>
      ))}
      <div ref={logEndRef} />
      <div className="cursor-blink inline-block">█</div>
    </div>
  );
};

export default ConsoleLog;
