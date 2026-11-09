import Link from 'next/link'
import React from 'react'
import ThemeToggle from '@components/ThemeToggle'
import { HEADLINE, NAME } from '@content/profile'
import { useTerminal } from '@hooks/useTerminal'

interface PageHeaderProps {
  /** Page name shown under the site name. Omit on Home, where the name itself is the heading. */
  title?: string
}

const PageHeader: React.FC<PageHeaderProps> = ({ title }) => {
  const terminal = useTerminal()

  return (
    <header className="flex items-start justify-between gap-4">
      {title === undefined ? (
        <div>
          <h1 className="font-medium text-text">{NAME}</h1>
          <p className="text-muted">{HEADLINE}</p>
        </div>
      ) : (
        <div>
          <p>
            <Link href="/" className="font-medium text-text">
              {NAME}
            </Link>
          </p>
          <h1 className="text-muted">{title}</h1>
        </div>
      )}
      <div className="-mr-3 -mt-2.5 flex">
        <button
          type="button"
          className="icon-button font-mono text-[13px]"
          aria-label="Open terminal mode"
          onClick={terminal.open}
        >
          {'>_'}
        </button>
        <ThemeToggle />
      </div>
    </header>
  )
}

export default PageHeader
