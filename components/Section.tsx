import React from 'react'

interface SectionProps {
  id: string
  title: string
  children: React.ReactNode
}

const Section: React.FC<SectionProps> = ({ id, title, children }) => {
  const headingId = `${id}-heading`
  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-16">
      <h2 id={headingId} className="mb-5 font-medium text-text">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default Section
