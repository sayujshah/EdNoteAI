"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Monitor, Moon, Sun, Check } from "lucide-react";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const getThemeIcon = (currentTheme: string | undefined) => {
    switch (currentTheme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      case "system":
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getThemeLabel = (currentTheme: string | undefined) => {
    switch (currentTheme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system":
        return "System";
      default:
        return "System";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="px-3 py-1 text-sm border rounded hover:bg-muted">
        <div className="flex items-center gap-2">
          {getThemeIcon(theme)}
          <span>{getThemeLabel(theme)}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <div className="flex items-center gap-2 w-full">
            <Sun className="h-4 w-4" />
            <span>Light</span>
            {theme === "light" && <Check className="h-4 w-4 ml-auto" />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <div className="flex items-center gap-2 w-full">
            <Moon className="h-4 w-4" />
            <span>Dark</span>
            {theme === "dark" && <Check className="h-4 w-4 ml-auto" />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <div className="flex items-center gap-2 w-full">
            <Monitor className="h-4 w-4" />
            <span>System</span>
            {theme === "system" && <Check className="h-4 w-4 ml-auto" />}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 