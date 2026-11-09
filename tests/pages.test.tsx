import { fireEvent, screen, within } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import Home from '../pages/index'
import About from '../pages/about'
import Projects from '../pages/projects'
import NotFound from '../pages/404'
import Layout from '@components/Layout'
import { ABOUT_PARAGRAPHS, CONTACT_LINKS } from '@content/profile'
import { ARCHIVED_PROJECTS, FEATURED_PROJECTS } from '@content/projects'
import { PAPERS, paperUrl } from '@content/papers'
import { renderWithProviders } from './render'

vi.mock('next/dynamic', () => ({
  default: () => {
    const TerminalStub = ({ onExit }: { onExit: () => void }) => (
      <div role="dialog" aria-label="Terminal">
        <button type="button" onClick={onExit}>
          exit
        </button>
      </div>
    )
    return TerminalStub
  },
}))

describe('Home', () => {
  it('has the sections in order, with no eyebrow labels', () => {
    renderWithProviders(<Home />)
    const headings = screen.getAllByRole('heading').map((h) => h.textContent)
    expect(headings).toEqual(['Charbel Fayad', 'Projects', 'Research', 'Experience', 'Elsewhere'])
  })

  it('lists every featured project and links the full list', () => {
    renderWithProviders(<Home />)
    const projects = screen.getByRole('region', { name: 'Projects' })
    for (const project of FEATURED_PROJECTS) {
      expect(within(projects).getByText(project.title)).toBeInTheDocument()
    }
    expect(within(projects).getByRole('link', { name: 'See all projects' })).toHaveAttribute(
      'href',
      '/projects'
    )
  })

  it('links each paper by DOI in the Research section (the /research page anchor)', () => {
    renderWithProviders(<Home />)
    const research = screen.getByRole('region', { name: 'Research' })
    expect(research).toHaveAttribute('id', 'research')
    for (const paper of PAPERS) {
      expect(within(research).getByRole('link', { name: new RegExp(paper.title.slice(0, 30)) }))
        .toHaveAttribute('href', paperUrl(paper))
    }
  })

  it('opens terminal mode from Elsewhere', () => {
    renderWithProviders(
      <Layout>
        <Home />
      </Layout>
    )
    expect(screen.queryByRole('dialog', { name: 'Terminal' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Terminal mode' }))
    expect(screen.getByRole('dialog', { name: 'Terminal' })).toBeInTheDocument()
  })
})

describe('Layout', () => {
  it('locks page scroll while the terminal is open and restores it on exit', () => {
    renderWithProviders(
      <Layout>
        <Home />
      </Layout>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open terminal mode' }))
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.click(screen.getByRole('button', { name: 'exit' }))
    expect(screen.queryByRole('dialog', { name: 'Terminal' })).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })
})

describe('About', () => {
  it('prints every paragraph and the contact links', () => {
    renderWithProviders(<About />)
    for (const paragraph of ABOUT_PARAGRAPHS) {
      expect(screen.getByText(paragraph)).toBeInTheDocument()
    }
    const contact = screen.getByRole('region', { name: 'Contact' })
    expect(within(contact).getAllByRole('link')).toHaveLength(CONTACT_LINKS.length)
  })
})

describe('Projects', () => {
  it('shows recent projects with stack and year, then the archive', () => {
    renderWithProviders(<Projects />)
    const recent = screen.getByRole('region', { name: 'Recent' })
    expect(within(recent).getByText('React Native · Expo · 2026')).toBeInTheDocument()

    const earlier = screen.getByRole('region', { name: 'Earlier' })
    expect(within(earlier).getAllByRole('link')).toHaveLength(ARCHIVED_PROJECTS.length)
    for (const project of ARCHIVED_PROJECTS) {
      expect(within(earlier).getByRole('link', { name: new RegExp(project.title) })).toHaveAttribute(
        'href',
        project.link
      )
    }
  })
})

describe('404', () => {
  it('links back home', () => {
    renderWithProviders(<NotFound />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page not found')
    expect(screen.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/')
  })
})
