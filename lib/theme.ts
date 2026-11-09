export type Theme = 'dark' | 'light'

export const DEFAULT_THEME: Theme = 'dark'
export const THEME_STORAGE_KEY = 'theme'
export const THEME_ATTRIBUTE = 'data-theme'

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light'
}

/** Stored preference wins; anything else falls back to dark, the site's default. */
export function resolveTheme(stored: unknown): Theme {
  return isTheme(stored) ? stored : DEFAULT_THEME
}

export function oppositeTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark'
}

/**
 * Runs in <head> before first paint so a stored light preference never flashes dark.
 * Storage can throw in private windows; the default theme applies then.
 */
export const THEME_INIT_SCRIPT = `(function(){var t='${DEFAULT_THEME}';try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');if(s==='dark'||s==='light')t=s}catch(e){}document.documentElement.setAttribute('${THEME_ATTRIBUTE}',t)})()`
