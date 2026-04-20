import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'topicpulse_theme'

function safeReadStoredTheme(): Theme | null {
	try {
		const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
		return saved === "dark" || saved === "light" ? saved : null;
	} catch {
		return null;
	}
}

function safeWriteStoredTheme(theme: Theme) {
	try {
		localStorage.setItem(STORAGE_KEY, theme);
	} catch {
		// ignore storage write failures
	}
}

function prefersLightTheme(): boolean {
	try {
		return (
			typeof window !== "undefined" &&
			typeof window.matchMedia === "function" &&
			window.matchMedia("(prefers-color-scheme: light)").matches
		);
	} catch {
		return false;
	}
}

function getInitialTheme(): Theme {
  // 1. Saved preference takes priority
  const saved = safeReadStoredTheme();
	if (saved) return saved;
  // 2. Fall back to OS preference
  return prefersLightTheme() ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement
  if (theme === 'light') {
    root.setAttribute('data-theme', 'light')
  } else {
    root.removeAttribute('data-theme')
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const t = getInitialTheme()
    applyTheme(t)
    return t
  })

  // Keep <html> in sync whenever theme changes
  useEffect(() => {
    applyTheme(theme)
    safeWriteStoredTheme(theme);
  }, [theme])

  // Listen for OS preference changes (only if user hasn't manually set a preference)
  useEffect(() => {
    if (
			typeof window === "undefined" ||
			typeof window.matchMedia !== "function"
		) {
			return undefined;
		}
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = (e: MediaQueryListEvent) => {
      if (!safeReadStoredTheme()) {
				setThemeState(e.matches ? "light" : "dark");
			}
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])
  const toggleTheme = useCallback(() => setThemeState(t => t === 'dark' ? 'light' : 'dark'), [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
