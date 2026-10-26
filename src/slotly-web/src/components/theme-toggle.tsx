import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "../lib/cn";
import { Button } from "./ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("size-9 rounded-full", className)}
      aria-label={
        resolvedTheme === "dark" ? "Use light theme" : "Use dark theme"
      }
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
