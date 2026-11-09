import Head from 'next/head'
import React from 'react'
import PageHeader from '@components/PageHeader'
import ProjectList from '@components/ProjectList'
import Section from '@components/Section'
import { ARCHIVED_PROJECTS, FEATURED_PROJECTS } from '@content/projects'
import { NAME } from '@content/profile'
import { trackProjectClick } from '@hooks/useAnalytics'

export default function Projects() {
  return (
    <>
      <Head>
        <title>{`Projects · ${NAME}`}</title>
        <meta name="description" content={`Recent and earlier projects by ${NAME}.`} />
      </Head>

      <PageHeader title="Projects" />

      <Section id="recent" title="Recent">
        <ProjectList projects={FEATURED_PROJECTS} showStack source="projects" />
      </Section>

      <Section id="earlier" title="Earlier">
        {ARCHIVED_PROJECTS.map((project) => (
          <a
            key={project.title}
            href={project.link}
            target="_blank"
            rel="noreferrer"
            className="row-link flex justify-between gap-4 py-1.5"
            onClick={() => trackProjectClick(project.title, project.link)}
          >
            <span className="row-title">{project.title}</span>
            <span className="text-right text-muted">{project.stack.join(' · ')}</span>
          </a>
        ))}
      </Section>
    </>
  )
}
