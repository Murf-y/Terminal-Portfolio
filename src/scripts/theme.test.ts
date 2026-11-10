import { fireEvent, screen } from '@testing-library/dom'
import { describe, expect, it } from 'vitest'
import PageHeader from '@components/PageHeader.astro'
import { ANALYTICS_EVENTS } from '@lib/analytics'
import { THEME_ATTRIBUTE, THEME_STORAGE_KEY } from '@lib/theme'
import { currentTheme, initThemeToggles, toggleTheme } from '@scripts/theme'
import { startTestAnalytics } from '../../tests/analytics'
import { mount } from '../../tests/astro'

const root = document.documentElement

describe('currentTheme', () => {
  it('reads the attribute the init script set, falling back to dark', () => {
    expect(currentTheme(), 'no attribute').toBe('dark')
    root.setAttribute(THEME_ATTRIBUTE, 'light')
    expect(currentTheme()).toBe('light')
    root.setAttribute(THEME_ATTRIBUTE, 'sepia')
    expect(currentTheme(), 'unknown value').toBe('dark')
  })
})

describe('toggleTheme', () => {
  it('flips the page theme, stores it and returns it', () => {
    root.setAttribute(THEME_ATTRIBUTE, 'dark')
    expect(toggleTheme('button')).toBe('light')
    expect(root).toHaveAttribute(THEME_ATTRIBUTE, 'light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(toggleTheme('terminal')).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })
})

describe('toggleTheme analytics', () => {
  it('captures the new theme and where the switch came from', () => {
    const { propertiesOf } = startTestAnalytics()
    root.setAttribute(THEME_ATTRIBUTE, 'dark')
    toggleTheme('terminal')
    toggleTheme('button')
    expect(propertiesOf(ANALYTICS_EVENTS.THEME_TOGGLED)).toEqual([
      { theme: 'light', source: 'terminal' },
      { theme: 'dark', source: 'button' },
    ])
  })

  it('the header toggle reports itself as the button', async () => {
    const { propertiesOf } = startTestAnalytics()
    root.setAttribute(THEME_ATTRIBUTE, 'dark')
    await mount(PageHeader)
    initThemeToggles()
    fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }))
    expect(propertiesOf(ANALYTICS_EVENTS.THEME_TOGGLED)).toEqual([
      { theme: 'light', source: 'button' },
    ])
  })
})

describe('initThemeToggles', () => {
  it('switches dark -> light -> dark from the header toggle, updating page, storage and label', async () => {
    root.setAttribute(THEME_ATTRIBUTE, 'dark')
    await mount(PageHeader)
    initThemeToggles()
    const button = screen.getByRole('button', { name: 'Switch to light theme' })

    fireEvent.click(button)
    expect(root).toHaveAttribute(THEME_ATTRIBUTE, 'light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(button).toHaveAccessibleName('Switch to dark theme')

    fireEvent.click(button)
    expect(root).toHaveAttribute(THEME_ATTRIBUTE, 'dark')
    expect(button).toHaveAccessibleName('Switch to light theme')
  })

  it('relabels the server-rendered toggle for a stored light preference', async () => {
    root.setAttribute(THEME_ATTRIBUTE, 'light')
    await mount(PageHeader)
    expect(
      screen.getByRole('button', { name: 'Switch to light theme' }),
      'server render assumes dark'
    ).toBeInTheDocument()
    initThemeToggles()
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
  })
})
