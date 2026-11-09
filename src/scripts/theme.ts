/* Theme toggling in the browser. The pure rules live in lib/theme.ts; THEME_INIT_SCRIPT has
   already applied the stored preference before this module runs. */
import {
  THEME_ATTRIBUTE,
  type Theme,
  oppositeTheme,
  persistTheme,
  resolveTheme,
  themeToggleLabel,
} from '@lib/theme'

const TOGGLE_SELECTOR = '[data-theme-toggle]'

export function currentTheme(): Theme {
  return resolveTheme(document.documentElement.getAttribute(THEME_ATTRIBUTE))
}

function syncToggleLabels(theme: Theme): void {
  for (const toggle of document.querySelectorAll(TOGGLE_SELECTOR)) {
    toggle.setAttribute('aria-label', themeToggleLabel(theme))
  }
}

/** Switches to the other theme, saves it and relabels the toggles. Returns the new theme. */
export function toggleTheme(): Theme {
  const next = oppositeTheme(currentTheme())
  document.documentElement.setAttribute(THEME_ATTRIBUTE, next)
  persistTheme(next)
  syncToggleLabels(next)
  return next
}

/** Labels the toggles for the applied theme and makes them switch it. */
export function initThemeToggles(): void {
  syncToggleLabels(currentTheme())
  for (const toggle of document.querySelectorAll(TOGGLE_SELECTOR)) {
    toggle.addEventListener('click', toggleTheme)
  }
}
