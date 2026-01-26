// Theme is now always Y2K dark mode - toggle removed
// This component now just shows the current mode indicator

const ThemeToggle = () => {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-l border-primary/30 data-sm">
      <span className="power-pulse">◉</span>
      <span className="hidden sm:inline text-muted-foreground">Y2K</span>
    </div>
  );
};

export default ThemeToggle;
