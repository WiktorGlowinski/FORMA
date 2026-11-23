"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Search, Sun } from "lucide-react";

const THEME_STORAGE_KEY = "forma-theme";
const READABILITY_STORAGE_KEY = "forma-readability";
const PREFERENCE_CHANGE_EVENT = "forma-preference-change";

function subscribeToPreferences(onChange: () => void) {
  window.addEventListener(PREFERENCE_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(PREFERENCE_CHANGE_EVENT, onChange);
}

function getThemeSnapshot() {
  return document.documentElement.classList.contains("darktheme");
}

function getReadabilitySnapshot() {
  return document.documentElement.classList.contains("readability-mode");
}

function getServerThemeSnapshot() {
  return false;
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(
    subscribeToPreferences,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const isReadable = useSyncExternalStore(
    subscribeToPreferences,
    getReadabilitySnapshot,
    getServerThemeSnapshot,
  );

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const savedReadability = window.localStorage.getItem(READABILITY_STORAGE_KEY);
    document.documentElement.classList.toggle("darktheme", savedTheme === "dark");
    document.documentElement.classList.toggle(
      "readability-mode",
      savedReadability === "enabled",
    );
    window.dispatchEvent(new Event(PREFERENCE_CHANGE_EVENT));
  }, []);

  function toggleTheme() {
    const nextIsDark = !isDark;
    document.documentElement.classList.toggle("darktheme", nextIsDark);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextIsDark ? "dark" : "light");
    window.dispatchEvent(new Event(PREFERENCE_CHANGE_EVENT));
  }

  function toggleReadability() {
    const nextIsReadable = !isReadable;
    document.documentElement.classList.toggle("readability-mode", nextIsReadable);
    window.localStorage.setItem(
      READABILITY_STORAGE_KEY,
      nextIsReadable ? "enabled" : "disabled",
    );
    window.dispatchEvent(new Event(PREFERENCE_CHANGE_EVENT));
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleReadability}
        aria-label={
          isReadable ? "Wyłącz tryb czytelności" : "Włącz tryb czytelności"
        }
        title={
          isReadable ? "Wyłącz tryb czytelności" : "Włącz tryb czytelności"
        }
        aria-pressed={isReadable}
        className="fixed bottom-20 left-4 z-[70] inline-flex size-12 items-center justify-center rounded-full border-2 border-foreground bg-card/30 text-foreground shadow-[3px_3px_0_0_var(--foreground)] transition hover:-translate-y-0.5 hover:bg-card/50 hover:shadow-[4px_4px_0_0_var(--foreground)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Search className="size-5" />
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Włącz jasny motyw" : "Włącz ciemny motyw"}
        title={isDark ? "Włącz jasny motyw" : "Włącz ciemny motyw"}
        aria-pressed={isDark}
        className="fixed bottom-4 left-4 z-[70] inline-flex size-12 items-center justify-center rounded-full border-2 border-foreground bg-card/30 text-foreground shadow-[3px_3px_0_0_var(--foreground)] transition hover:-translate-y-0.5 hover:bg-card/50 hover:shadow-[4px_4px_0_0_var(--foreground)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </button>
    </>
  );
}
