import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Analytics would call gtag on window; tests assert on these mocks instead.
vi.mock('@hooks/useAnalytics', () => ({
  trackOutboundClick: vi.fn(),
  trackProjectClick: vi.fn(),
  trackPaperClick: vi.fn(),
  trackResumeOpen: vi.fn(),
  trackThemeToggle: vi.fn(),
  trackTerminalOpen: vi.fn(),
  trackTerminalCommand: vi.fn(),
  trackContactClick: vi.fn(),
  trackSocialClick: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})
