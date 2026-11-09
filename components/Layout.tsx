import dynamic from 'next/dynamic'
import React, { useEffect } from 'react'
import { useTerminal } from '@hooks/useTerminal'

/* Lazy-load Terminal: it is large and only opened on demand. */
const Terminal = dynamic(() => import('@components/Terminal'), { ssr: false })

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const terminal = useTerminal()

  /* The terminal is a modal overlay; stop the page behind it from scrolling. */
  useEffect(() => {
    if (!terminal.isOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [terminal.isOpen])

  return (
    <>
      <main className="mx-auto flex min-h-screen max-w-[608px] flex-col gap-16 px-6 pb-[72px] pt-16 sm:pt-[120px]">
        {children}
      </main>
      {terminal.isOpen && <Terminal onExit={terminal.close} />}
    </>
  )
}

export default Layout
