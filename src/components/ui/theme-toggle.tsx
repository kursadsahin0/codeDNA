"use client";

import { Moon, Sun } from "lucide-react";
import { toggleTheme } from "@/lib/theme";
import { IconButton } from "./icon-button";

export function ThemeToggle() {
  return (
    <IconButton label="Toggle color theme" onClick={toggleTheme}>
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
    </IconButton>
  );
}
