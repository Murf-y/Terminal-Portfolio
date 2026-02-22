import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggle: () => {},
})

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark')

  // Read stored preference on mount
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored)
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light')
    }
  }, [])

  // Apply data-theme to <html>
  useEffect(() => {
    const root = document.documentElement
    // Disable all CSS transitions briefly so the swap is instant
    root.style.setProperty('--theme-transition', 'none')
    document.body.style.transition = 'none'
    root.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    // Re-enable after a frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.style.removeProperty('--theme-transition')
        document.body.style.transition = ''
      })
    })
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}
