/* The terminal is the only heavy interactive piece, so its code and font load on first open. */

const OPEN_SELECTOR = '[data-open-terminal]'

async function launchTerminal(): Promise<void> {
  const { openTerminal } = await import('@scripts/terminal')
  openTerminal()
}

/** Makes every "open terminal" control load and open the terminal. */
export function initTerminalLaunchers(): void {
  for (const control of document.querySelectorAll(OPEN_SELECTOR)) {
    control.addEventListener('click', launchTerminal)
  }
}
