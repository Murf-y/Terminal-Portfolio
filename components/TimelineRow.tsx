import React from 'react'

interface TimelineRowProps {
  period: string
  children: React.ReactNode
  /** Renders the row as a link when set. */
  href?: string
  onClick?: () => void
}

const ROW_CLASS = 'grid grid-cols-[88px_minmax(0,1fr)] gap-4 py-1.5'

const TimelineRow: React.FC<TimelineRowProps> = ({ period, children, href, onClick }) => {
  const periodCell = <span className="tabular-nums text-muted">{period}</span>
  if (href === undefined) {
    return (
      <div className={ROW_CLASS}>
        {periodCell}
        <span>{children}</span>
      </div>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`row-link ${ROW_CLASS}`}
      onClick={onClick}
    >
      {periodCell}
      <span className="row-title">{children}</span>
    </a>
  )
}

export default TimelineRow
