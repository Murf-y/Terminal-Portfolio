import { render } from '@testing-library/react'
import React from 'react'
import { TerminalProvider } from '@hooks/useTerminal'
import { ThemeProvider } from '@hooks/useTheme'

/** Renders UI inside the same providers _app uses. */
export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <TerminalProvider>{ui}</TerminalProvider>
    </ThemeProvider>
  )
}
