/* Theme toggling in the browser. The pure rules live in lib/theme.ts; THEME_INIT_SCRIPT has
   already applied the stored preference before this module runs. */
import { ANALYTICS_EVENTS } from '@lib/analytics'
import {
  THEME_ATTRIBUTE,
  type Theme,
  oppositeTheme,
  persistTheme,
  resolveTheme,
  themeToggleLabel,
} from '@lib/theme'
import { track } from '@scripts/analytics'

const TOGGLE_SELECTOR = '[data-theme-toggle]'

/** Where the switch came from: the header button, or the terminal's theme command. */
export type ThemeToggleSource = 'button' | 'terminal'

export function currentTheme(): Theme {
  return resolveTheme(document.documentElement.getAttribute(THEME_ATTRIBUTE))
}

function syncToggleLabels(theme: Theme): void {
  for (const toggle of document.querySelectorAll(TOGGLE_SELECTOR)) {
    toggle.setAttribute('aria-label', themeToggleLabel(theme))
  }
}

/** Switches to the other theme, saves it, relabels the toggles and tracks it. Returns it. */
export function toggleTheme(source: ThemeToggleSource): Theme {
  const next = oppositeTheme(currentTheme())
  document.documentElement.setAttribute(THEME_ATTRIBUTE, next)
  persistTheme(next)
  syncToggleLabels(next)
  track(ANALYTICS_EVENTS.THEME_TOGGLED, { theme: next, source })
  return next
}

/** Labels the toggles for the applied theme and makes them switch it. */
export function initThemeToggles(): void {
  syncToggleLabels(currentTheme())
  for (const toggle of document.querySelectorAll(TOGGLE_SELECTOR)) {
    toggle.addEventListener('click', () => toggleTheme('button'))
  }
}
