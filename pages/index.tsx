import Link from 'next/link'
import React from 'react'
import ContactLinks from '@components/ContactLinks'
import PageHeader from '@components/PageHeader'
import PageMeta from '@components/PageMeta'
import ProjectList from '@components/ProjectList'
import Section from '@components/Section'
import TimelineRow from '@components/TimelineRow'
import { EXPERIENCE, LINKS, NAME, SITE_DESCRIPTION } from '@content/profile'
import { FEATURED_PROJECTS } from '@content/projects'
import { PAPERS, paperUrl } from '@content/papers'
import { trackOutboundClick, trackPaperClick } from '@hooks/useAnalytics'
import { useTerminal } from '@hooks/useTerminal'

export default function Home() {
  const terminal = useTerminal()

  return (
    <>
      <PageMeta title={NAME} description={SITE_DESCRIPTION} path="/" />

      <PageHeader />

      <section className="flex flex-col gap-4">
        <p>
          Software integration engineer and Scrum Master at{' '}
          <a
            href={LINKS.murex}
            target="_blank"
            rel="noreferrer"
            className="text-link"
            onClick={() => trackOutboundClick('murex', LINKS.murex)}
          >
            Murex
          </a>
          . ESB, API gateway and event-driven architecture brokering real-time and async traffic
          across hundreds of on-prem and cloud systems.
        </p>
        <p>
          Outside Murex, I build things that live on the internet and serve a public good. Research
          in evolutionary algorithms, ensemble and federated learning, through network science.
        </p>
        <p>
          <Link href="/about" className="text-link text-muted">
            More about me
          </Link>
        </p>
      </section>

      <Section id="projects" title="Projects">
        <ProjectList projects={FEATURED_PROJECTS} source="home" />
        <p className="mt-3">
          <Link href="/projects" className="text-link text-muted">
            See all projects
          </Link>
        </p>
      </Section>

      <Section id="research" title="Research">
        {PAPERS.map((paper) => (
          <TimelineRow
            key={paper.doi}
            period={String(paper.year)}
            href={paperUrl(paper)}
            onClick={() => trackPaperClick(paper.title, paperUrl(paper))}
          >
            {paper.title}
          </TimelineRow>
        ))}
      </Section>

      <Section id="experience" title="Experience">
        {EXPERIENCE.map((entry) => (
          <TimelineRow key={entry.title} period={entry.period}>
            {entry.title}
            <span className="block text-muted">{entry.detail}</span>
          </TimelineRow>
        ))}
      </Section>

      <Section id="elsewhere" title="Elsewhere">
        <ContactLinks source="home">
          <button type="button" className="text-link" onClick={terminal.open}>
            Terminal mode
          </button>
        </ContactLinks>
      </Section>
    </>
  )
}
