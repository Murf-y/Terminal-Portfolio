import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  DEFAULT_THEME,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  Theme,
  oppositeTheme,
  resolveTheme,
} from '@lib/theme'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (context === null) {
    throw new Error('useTheme must be used inside <ThemeProvider>')
  }
  return context
}

function persistTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch (error) {
    // Storage is unavailable in some private windows; the choice then lasts for this page only.
    if (!(error instanceof DOMException)) throw error
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME)

  // THEME_INIT_SCRIPT already set the attribute before paint; adopt it so React matches the page.
  useEffect(() => {
    setTheme(resolveTheme(document.documentElement.getAttribute(THEME_ATTRIBUTE)))
  }, [])

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = oppositeTheme(current)
      document.documentElement.setAttribute(THEME_ATTRIBUTE, next)
      persistTheme(next)
      return next
    })
  }, [])

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}
