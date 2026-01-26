import { useState, useEffect } from "react";

const ThemeSwitch = () => {
  const [isInverted, setIsInverted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("m9-theme") === "inverted";
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isInverted) {
      root.classList.add("theme-inverted");
      localStorage.setItem("m9-theme", "inverted");
    } else {
      root.classList.remove("theme-inverted");
      localStorage.setItem("m9-theme", "default");
    }
  }, [isInverted]);

  // Initialize theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("m9-theme");
    if (saved === "inverted") {
      document.documentElement.classList.add("theme-inverted");
      setIsInverted(true);
    }
  }, []);

  // Keyboard shortcut: Ctrl+Shift+T
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        setIsInverted((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <button
      onClick={() => setIsInverted(!isInverted)}
      className="flex items-center gap-2 px-3 py-2 border border-border hover:bg-primary hover:text-primary-foreground transition-colors"
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      <div className="flex items-center gap-1">
        <span
          className={`w-3 h-3 border border-current ${
            !isInverted ? "bg-current" : ""
          }`}
        />
        <span
          className={`w-3 h-3 border border-current ${
            isInverted ? "bg-current" : ""
          }`}
        />
      </div>
      <span className="data-sm hidden sm:inline">
        {isInverted ? "INVERTED" : "DEFAULT"}
      </span>
    </button>
  );
};

export default ThemeSwitch;
