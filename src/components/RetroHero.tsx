import { useEffect, useState } from "react";

const RetroHero = () => {
  const [displayText, setDisplayText] = useState("");
  const fullText = "WELCOME TO THE FUTURE";
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(typingInterval);
      }
    }, 100);

    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => {
      clearInterval(typingInterval);
      clearInterval(cursorInterval);
    };
  }, []);

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden border-4 border-terminal-green rounded-3xl mb-12"
      style={{
        boxShadow: `
          0 0 30px hsl(var(--terminal-green) / 0.4),
          inset 0 0 40px hsl(var(--terminal-green) / 0.05)
        `,
        background: `
          linear-gradient(135deg, 
            hsl(var(--digital-blue)) 0%, 
            hsl(220 85% 20%) 100%
          )
        `
      }}
    >
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 102, 0.3) 2px, rgba(0, 255, 102, 0.3) 4px)'
        }}
      />

      <div className="relative z-10 text-center px-8">
        <div className="mb-8">
          <h1 className="editorial-headline text-foreground mb-4">
            New<br />Style
          </h1>
          <div className="w-48 h-1 bg-terminal-green mx-auto mb-6"
            style={{
              boxShadow: '0 0 20px hsl(var(--terminal-green) / 0.8)'
            }}
          />
        </div>

        <div className="terminal-text text-terminal-green text-xl">
          {displayText}
          {showCursor && <span className="inline-block ml-1">█</span>}
        </div>

        <div className="mt-8 flex gap-4 justify-center flex-wrap">
          <button className="px-8 py-3 bg-analog-yellow text-background font-mono font-bold rounded-2xl hover:scale-105 transition-transform"
            style={{
              boxShadow: '0 0 20px hsl(var(--analog-yellow) / 0.5)'
            }}
          >
            EXPLORE
          </button>
          <button className="px-8 py-3 border-2 border-terminal-green text-terminal-green font-mono font-bold rounded-2xl hover:bg-terminal-green hover:text-background transition-all"
            style={{
              boxShadow: '0 0 15px hsl(var(--terminal-green) / 0.3)'
            }}
          >
            CONTACT
          </button>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-terminal-green" />
      <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-terminal-green" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-terminal-green" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-terminal-green" />
    </section>
  );
};

export default RetroHero;
