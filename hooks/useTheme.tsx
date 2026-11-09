import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_THEME,
  THEME_ATTRIBUTE,
  Theme,
  oppositeTheme,
  persistTheme,
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

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME)

  // THEME_INIT_SCRIPT already set the attribute before paint; adopt it so React matches the page.
  useEffect(() => {
    setTheme(resolveTheme(document.documentElement.getAttribute(THEME_ATTRIBUTE)))
  }, [])

  const toggle = useCallback(() => {
    const next = oppositeTheme(theme)
    document.documentElement.setAttribute(THEME_ATTRIBUTE, next)
    persistTheme(next)
    setTheme(next)
  }, [theme])

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
