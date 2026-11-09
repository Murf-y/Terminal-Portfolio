import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { trackTerminalOpen } from '@hooks/useAnalytics'

interface TerminalContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
}

const TerminalContext = createContext<TerminalContextValue | null>(null)

export function useTerminal(): TerminalContextValue {
  const context = useContext(TerminalContext)
  if (context === null) {
    throw new Error('useTerminal must be used inside <TerminalProvider>')
  }
  return context
}

export const TerminalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => {
    trackTerminalOpen()
    setIsOpen(true)
  }, [])
  const close = useCallback(() => setIsOpen(false), [])

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close])
  return <TerminalContext.Provider value={value}>{children}</TerminalContext.Provider>
}
