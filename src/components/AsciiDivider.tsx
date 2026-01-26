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
      <div className={`py-2 overflow-hidden ${className}`}>
        <div className="data-sm text-muted-foreground text-center tracking-widest">
          {side} {text} {side}
        </div>
      </div>
    );
  }

  return (
    <div className={`py-1 overflow-hidden ${className}`}>
      <div className="data-sm text-muted-foreground text-center tracking-widest opacity-60">
        {line}
      </div>
    </div>
  );
};

export default AsciiDivider;
