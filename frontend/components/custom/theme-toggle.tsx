"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Sun01Icon,
  Moon02Icon,
  ComputerIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThemeToggleProps {
  variant?: "button" | "switch" | "dropdown";
  className?: string;
}

export function ThemeToggle({
  variant = "button",
  className,
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    if (variant === "switch") {
      return (
        <div className={cn("h-5 w-9 rounded-full bg-muted animate-pulse", className)} />
      );
    }
    return (
      <div
        className={cn(
          "size-9 flex items-center justify-center border border-border bg-background text-muted-foreground opacity-50",
          className
        )}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  if (variant === "switch") {
    return (
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle theme"
        className={className}
      />
    );
  }

  if (variant === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex size-9 items-center justify-center border border-border bg-background text-foreground hover:bg-muted transition-colors outline-none cursor-pointer",
            className
          )}
          aria-label="Select theme"
        >
          {isDark ? (
            <HugeiconsIcon icon={Moon02Icon} size={18} strokeWidth={2} />
          ) : (
            <HugeiconsIcon icon={Sun01Icon} size={18} strokeWidth={2} />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem
            onClick={() => setTheme("light")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <HugeiconsIcon icon={Sun01Icon} size={16} />
            <span>Light</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("dark")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <HugeiconsIcon icon={Moon02Icon} size={16} />
            <span>Dark</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("system")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <HugeiconsIcon icon={ComputerIcon} size={16} />
            <span>System</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "flex size-9 items-center justify-center border border-border bg-background text-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer",
        className
      )}
    >
      {isDark ? (
        <HugeiconsIcon
          icon={Sun01Icon}
          size={18}
          strokeWidth={2}
          className="text-amber-400 hover:rotate-45 transition-transform duration-200"
        />
      ) : (
        <HugeiconsIcon
          icon={Moon02Icon}
          size={18}
          strokeWidth={2}
          className="text-foreground hover:-rotate-12 transition-transform duration-200"
        />
      )}
    </button>
  );
}
