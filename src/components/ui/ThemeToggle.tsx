"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          {resolvedTheme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-[#18181B] border-white/10 text-white"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`focus:bg-white/10 focus:text-white ${
            theme === "light" ? "bg-white/10" : ""
          }`}
        >
          <Sun className="mr-2 h-4 w-4" />
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`focus:bg-white/10 focus:text-white ${
            theme === "dark" ? "bg-white/10" : ""
          }`}
        >
          <Moon className="mr-2 h-4 w-4" />
          Escuro
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`focus:bg-white/10 focus:text-white ${
            theme === "system" ? "bg-white/10" : ""
          }`}
        >
          <Monitor className="mr-2 h-4 w-4" />
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
