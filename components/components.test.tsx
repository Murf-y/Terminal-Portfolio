import { fireEvent, render, renderHook, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ContactLinks, { trackContactLink } from '@components/ContactLinks'
import PageHeader from '@components/PageHeader'
import Section from '@components/Section'
import ThemeToggle from '@components/ThemeToggle'
import TimelineRow from '@components/TimelineRow'
import { CONTACT_LINKS, NAME } from '@content/profile'
import {
  trackContactClick,
  trackResumeOpen,
  trackSocialClick,
  trackTerminalOpen,
  trackThemeToggle,
} from '@hooks/useAnalytics'
import { useTerminal } from '@hooks/useTerminal'
import { useTheme } from '@hooks/useTheme'
import { THEME_STORAGE_KEY } from '@lib/theme'
import { renderWithProviders } from '../tests/render'

describe('ThemeToggle', () => {
  it('switches dark -> light -> dark, updating the page, storage and label', () => {
    renderWithProviders(<ThemeToggle />)
    const button = screen.getByRole('button', { name: 'Switch to light theme' })

    fireEvent.click(button)
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(trackThemeToggle).toHaveBeenLastCalledWith('light')
    expect(button).toHaveAccessibleName('Switch to dark theme')

    fireEvent.click(button)
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('adopts the theme the init script already applied', () => {
    document.documentElement.setAttribute('data-theme', 'light')
    renderWithProviders(<ThemeToggle />)
    expect(screen.getByRole('button')).toHaveAccessibleName('Switch to dark theme')
  })
})

describe('PageHeader', () => {
  it('on Home, makes the name the page heading', () => {
    renderWithProviders(<PageHeader />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(NAME)
    expect(screen.queryByRole('link', { name: NAME })).toBeNull()
  })

  it('on other pages, links the name home and titles the page', () => {
    renderWithProviders(<PageHeader title="About" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('About')
    expect(screen.getByRole('link', { name: NAME })).toHaveAttribute('href', '/')
  })

  it('opens terminal mode', () => {
    let terminal: ReturnType<typeof useTerminal> | undefined
    const Probe = () => {
      terminal = useTerminal()
      return null
    }
    renderWithProviders(
      <>
        <PageHeader />
        <Probe />
      </>
    )
    expect(terminal?.isOpen).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Open terminal mode' }))
    expect(terminal?.isOpen).toBe(true)
    expect(trackTerminalOpen).toHaveBeenCalledTimes(1)
  })
})

describe('ContactLinks', () => {
  it('renders every contact link; only email stays in the tab', () => {
    render(<ContactLinks source="test" />)
    for (const link of CONTACT_LINKS) {
      const anchor = screen.getByRole('link', { name: link.label })
      expect(anchor).toHaveAttribute('href', link.href)
      expect(anchor.getAttribute('target'), link.label).toBe(link.id === 'email' ? null : '_blank')
    }
  })

  it('renders extra items after the links', () => {
    render(
      <ContactLinks source="test">
        <button type="button">Terminal mode</button>
      </ContactLinks>
    )
    expect(screen.getByRole('button', { name: 'Terminal mode' })).toBeInTheDocument()
  })

  it('routes each link to the matching analytics event', () => {
    trackContactLink('email', 'home')
    expect(trackContactClick).toHaveBeenCalledWith('home')
    trackContactLink('resume', 'about')
    expect(trackResumeOpen).toHaveBeenCalledWith('about')
    trackContactLink('orcid', 'home')
    expect(trackSocialClick).toHaveBeenCalledWith('orcid', 'home')
    expect(trackContactClick).toHaveBeenCalledTimes(1)
    expect(trackResumeOpen).toHaveBeenCalledTimes(1)
  })

  it('tracks clicks with the source it was rendered in', () => {
    render(<ContactLinks source="about" />)
    fireEvent.click(screen.getByRole('link', { name: 'GitHub' }))
    expect(trackSocialClick).toHaveBeenCalledWith('github', 'about')
  })
})

describe('Section', () => {
  it('labels the section with its heading so it is a named landmark', () => {
    render(
      <Section id="research" title="Research">
        <p>body</p>
      </Section>
    )
    const region = screen.getByRole('region', { name: 'Research' })
    expect(region).toHaveAttribute('id', 'research')
    expect(region).toContainElement(screen.getByText('body'))
  })
})

describe('TimelineRow', () => {
  it('renders a plain row without href', () => {
    render(<TimelineRow period="2024">Degree</TimelineRow>)
    expect(screen.getByText('2024')).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('renders an external link with href and fires onClick', () => {
    let clicks = 0
    render(
      <TimelineRow period="2026" href="https://doi.org/10.1/x" onClick={() => clicks++}>
        Paper
      </TimelineRow>
    )
    const link = screen.getByRole('link', { name: /Paper/ })
    expect(link).toHaveAttribute('href', 'https://doi.org/10.1/x')
    expect(link).toHaveAttribute('rel', 'noreferrer')
    fireEvent.click(link)
    expect(clicks).toBe(1)
  })
})

describe('hooks outside their providers', () => {
  // React logs the thrown error before rethrowing it; that log is expected here.
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('useTheme throws a clear error', () => {
    expect(() => renderHook(() => useTheme())).toThrow('useTheme must be used inside <ThemeProvider>')
  })

  it('useTerminal throws a clear error', () => {
    expect(() => renderHook(() => useTerminal())).toThrow(
      'useTerminal must be used inside <TerminalProvider>'
    )
  })
})
