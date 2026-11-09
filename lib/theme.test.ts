import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_THEME,
  THEME_ATTRIBUTE,
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
  isTheme,
  oppositeTheme,
  persistTheme,
  resolveTheme,
  themeToggleLabel,
} from '@lib/theme'

describe('theme helpers', () => {
  it('defaults to dark', () => {
    expect(DEFAULT_THEME).toBe('dark')
  })

  it.each([
    ['dark', true],
    ['light', true],
    ['Dark', false],
    ['', false],
    [null, false],
    [undefined, false],
    [1, false],
  ])('isTheme(%j) is %s', (value, expected) => {
    expect(isTheme(value)).toBe(expected)
  })

  it.each([
    ['light', 'light'],
    ['dark', 'dark'],
    [null, 'dark'],
    ['solarized', 'dark'],
  ])('resolveTheme(%j) -> %s', (stored, expected) => {
    expect(resolveTheme(stored)).toBe(expected)
  })

  it('flips between the two themes', () => {
    expect(oppositeTheme('dark')).toBe('light')
    expect(oppositeTheme('light')).toBe('dark')
  })

  it('labels the toggle with the theme a click switches to', () => {
    expect(themeToggleLabel('dark')).toBe('Switch to light theme')
    expect(themeToggleLabel('light')).toBe('Switch to dark theme')
  })
})

describe('THEME_INIT_SCRIPT', () => {
  const run = () => new Function(THEME_INIT_SCRIPT)()

  it('applies a stored light preference before first paint', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    run()
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe('light')
  })

  it('falls back to dark when nothing valid is stored', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'neon')
    run()
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe('dark')
  })

  it('still sets dark when storage throws (private windows)', () => {
    const original = Storage.prototype.getItem
    Storage.prototype.getItem = () => {
      throw new DOMException('denied', 'SecurityError')
    }
    try {
      run()
    } finally {
      Storage.prototype.getItem = original
    }
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe('dark')
  })
})

describe('persistTheme', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('stores the choice under the key the init script reads', () => {
    persistTheme('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('swallows the DOMException private windows throw, so toggling still works', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    expect(() => persistTheme('light')).not.toThrow()
  })

  it('rethrows anything else, which would be a bug rather than a storage policy', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new TypeError('unexpected')
    })
    expect(() => persistTheme('light')).toThrow(TypeError)
  })
})
