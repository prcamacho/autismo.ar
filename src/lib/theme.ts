export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "autismo-ar-theme";
const THEME_CHANGE_EVENT = "autismo-ar-theme-change";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

// Only trusted constants enter this script. Run before paint, without making
// the root layout dynamic or requiring a server request to change appearance.
export const themeInitScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch{}`;

export function getTheme(): Theme {
  const preference = document.documentElement.dataset.theme;
  return isTheme(preference)
    ? preference
    : window.matchMedia(DARK_QUERY).matches
      ? "dark"
      : "light";
}

export function getServerTheme(): null {
  return null;
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked. The choice still works for this page session.
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function subscribeToTheme(onChange: () => void) {
  // Reapply after development Strict Mode remounts the root element.
  try {
    const preference = localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(preference))
      document.documentElement.dataset.theme = preference;
  } catch {
    // CSS follows the device when no preference is available.
  }

  const media = window.matchMedia(DARK_QUERY);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    if (isTheme(event.newValue)) {
      document.documentElement.dataset.theme = event.newValue;
    } else {
      delete document.documentElement.dataset.theme;
    }
    onChange();
  };
  media.addEventListener("change", onChange);
  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}
