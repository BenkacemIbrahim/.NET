import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import { Button } from "./ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted
    ? resolvedTheme === "dark" || theme === "dark" || (typeof document !== "undefined" && document.documentElement.classList.contains("dark"))
    : true;

  const toggle = () => {
    const nextTheme = isDark ? "light" : "dark";
    setTheme(nextTheme);
    if (typeof document !== "undefined") {
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("size-9 rounded-full", className)}
      aria-label={isDark ? "Use light theme" : "Use dark theme"}
      onClick={toggle}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
