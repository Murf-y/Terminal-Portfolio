import React from 'react'
import { useTheme } from '@hooks/useTheme'

const ThemeToggle: React.FC = () => {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="relative w-[38px] h-[20px] rounded-full border transition-all duration-100 ease-out cursor-pointer group
        border-border/60 hover:border-accent/40"
      style={{
        background: theme === 'dark' ? 'var(--color-elevated)' : 'var(--color-border)',
      }}
    >
      {/* Track knob */}
      <span
        className="absolute top-[2px] w-[14px] h-[14px] rounded-full transition-all duration-100 ease-out"
        style={{
          left: theme === 'dark' ? '2px' : '20px',
          background: 'var(--color-accent)',
          boxShadow:
            theme === 'dark'
              ? '0 0 6px var(--color-accent-glow)'
              : '0 0 8px var(--color-accent-glow)',
        }}
      />
    </button>
  )
}

export default ThemeToggle
