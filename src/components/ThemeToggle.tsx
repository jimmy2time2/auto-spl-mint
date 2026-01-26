import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDark(true);
    }
  }, []);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="flex items-center gap-2 px-3 py-2 border-l border-border hover:bg-secondary transition-colors data-sm"
      title={isDark ? "Switch to light mode" : "Switch to hacker mode"}
      aria-label="Toggle theme"
    >
      <span className={`transition-opacity ${isDark ? "opacity-100" : "opacity-40"}`}>
        {isDark ? "◉" : "○"}
      </span>
      <span className="hidden sm:inline">
        {isDark ? "HACKER" : "LIGHT"}
      </span>
    </button>
  );
};

export default ThemeToggle;
