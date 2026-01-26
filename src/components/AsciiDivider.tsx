interface AsciiDividerProps {
  pattern?: 'slash' | 'asterisk' | 'dash' | 'dot' | 'equals' | 'wave' | 'arrow' | 'block';
  className?: string;
  text?: string;
}

const patterns = {
  slash: '/',
  asterisk: '*',
  dash: '─',
  dot: '·',
  equals: '═',
  wave: '~',
  arrow: '▸',
  block: '█',
};

const AsciiDivider = ({ pattern = 'slash', className = '', text }: AsciiDividerProps) => {
  const char = patterns[pattern];
  const repeat = 60;
  const line = char.repeat(repeat);

  if (text) {
    const side = char.repeat(8);
    return (
      <div className={`py-3 overflow-hidden border-y border-primary/30 ${className}`}>
        <div className="data-sm text-center tracking-widest flex items-center justify-center gap-4">
          <span className="text-primary/50">{side}</span>
          <span className="glow-text">{text}</span>
          <span className="text-primary/50">{side}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`py-2 overflow-hidden ${className}`}>
      <div className="data-sm text-primary/30 text-center tracking-widest">
        {line}
      </div>
    </div>
  );
};

export default AsciiDivider;
