"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun, SunMoon } from "lucide-react";
import {
  getServerTheme,
  getTheme,
  setTheme,
  subscribeToTheme,
} from "@/lib/theme";

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getTheme,
    getServerTheme,
  );
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label =
    theme === null
      ? "Tema"
      : nextTheme === "dark"
        ? "Modo oscuro"
        : "Modo claro";
  const Icon = theme === null ? SunMoon : nextTheme === "dark" ? Moon : Sun;

  return (
    <button
      type="button"
      className="theme-toggle"
      disabled={theme === null}
      aria-label={
        theme === null ? "Cambiar tema" : `Activar ${label.toLowerCase()}`
      }
      title={theme === null ? "Cambiar tema" : `Activar ${label.toLowerCase()}`}
      onClick={() => setTheme(nextTheme)}
    >
      <Icon size={18} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
