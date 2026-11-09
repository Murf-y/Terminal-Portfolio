import React from 'react'
import { useTheme } from '@hooks/useTheme'
import { trackThemeToggle } from '@hooks/useAnalytics'
import { oppositeTheme } from '@lib/theme'

const ThemeToggle: React.FC = () => {
  const { theme, toggle } = useTheme()
  const next = oppositeTheme(theme)

  return (
    <button
      type="button"
      className="icon-button"
      aria-label={`Switch to ${next} theme`}
      onClick={() => {
        trackThemeToggle(next)
        toggle()
      }}
    >
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {theme === 'dark' ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M5.6 18.4l1.1-1.1M17.3 6.7l1.1-1.1" />
          </>
        ) : (
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        )}
      </svg>
    </button>
  )
}

export default ThemeToggle
