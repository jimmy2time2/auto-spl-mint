const AsciiLoader = ({ text = "LOADING" }: { text?: string }) => {
  return (
    <div className="flex items-center gap-2 font-mono">
      <span className="terminal-text">{text}</span>
      <span className="cursor-blink">█</span>
    </div>
  );
};

export default AsciiLoader;
