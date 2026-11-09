import { fireEvent, screen, within } from '@testing-library/dom'
import { describe, expect, it } from 'vitest'
import NotFound from '../src/pages/404.astro'
import About from '../src/pages/about.astro'
import Home from '../src/pages/index.astro'
import Projects from '../src/pages/projects.astro'
import { PAPERS, paperUrl } from '@content/papers'
import { ABOUT_PARAGRAPHS, CONTACT_LINKS, EXPERIENCE, NAME, SITE_DESCRIPTION } from '@content/profile'
import { ARCHIVED_PROJECTS, FEATURED_PROJECTS } from '@content/projects'
import { DEFAULT_THEME, THEME_ATTRIBUTE, THEME_INIT_SCRIPT } from '@lib/theme'
import { initTerminalLaunchers } from '@scripts/terminal-launcher'
import { mountPage } from './astro'

/* jest-dom matchers need elements from the live document, so <head> checks compare attributes. */
const meta = (page: Document, selector: string) => page.head.querySelector(selector)

describe('Base layout', () => {
  it('applies the stored theme before first paint, then loads the Latin Inter it preloads', async () => {
    const page = await mountPage(Home)
    expect(page.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe(DEFAULT_THEME)
    expect(page.documentElement.getAttribute('lang')).toBe('en')
    const scripts = Array.from(page.head.querySelectorAll('script'))
    expect(scripts[0]?.textContent, 'init script is the first script in <head>').toBe(THEME_INIT_SCRIPT)

    const preload = meta(page, 'link[rel="preload"][as="font"]')
    expect(preload?.getAttribute('type')).toBe('font/woff2')
    expect(preload?.hasAttribute('crossorigin')).toBe(true)
    const fontFile = preload?.getAttribute('href') ?? ''
    expect(fontFile).toMatch(/inter-latin-wght-normal.*\.woff2/)
    const fontFaces = Array.from(page.head.querySelectorAll('style')).map((style) => style.textContent ?? '')
    expect(fontFaces.some((css) => css.includes("font-family:'Inter Variable'") && css.includes(fontFile))).toBe(true)
  })

  it('builds the canonical and Open Graph URL from the site URL and the page path', async () => {
    const page = await mountPage(About)
    expect(page.title).toBe(`About · ${NAME}`)
    expect(meta(page, 'link[rel="canonical"]')?.getAttribute('href')).toBe('https://charbelfayad.com/about')
    expect(meta(page, 'meta[property="og:url"]')?.getAttribute('content')).toBe('https://charbelfayad.com/about')
    expect(meta(page, 'meta[name="description"]')?.getAttribute('content')).toBe(ABOUT_PARAGRAPHS[0])
    expect(meta(page, 'meta[property="og:description"]')?.getAttribute('content')).toBe(ABOUT_PARAGRAPHS[0])
    expect(meta(page, 'meta[property="og:title"]')?.getAttribute('content')).toBe(`About · ${NAME}`)
  })

  it('gives Home the bare origin with a trailing slash', async () => {
    const page = await mountPage(Home)
    expect(page.title).toBe(NAME)
    expect(meta(page, 'link[rel="canonical"]')?.getAttribute('href')).toBe('https://charbelfayad.com/')
    expect(meta(page, 'meta[name="description"]')?.getAttribute('content')).toBe(SITE_DESCRIPTION)
  })

  it('omits canonical and description tags on 404', async () => {
    const page = await mountPage(NotFound)
    expect(page.title).toBe(`Page not found · ${NAME}`)
    expect(meta(page, 'link[rel="canonical"]')).toBeNull()
    expect(meta(page, 'meta[property="og:url"]')).toBeNull()
    expect(meta(page, 'meta[name="description"]')).toBeNull()
  })
})

describe('Home', () => {
  it('has the sections in order, with no eyebrow labels', async () => {
    await mountPage(Home)
    const headings = screen.getAllByRole('heading').map((heading) => heading.textContent)
    expect(headings).toEqual([NAME, 'Projects', 'Research', 'Experience', 'Elsewhere'])
  })

  it('lists every featured project and links the full list', async () => {
    await mountPage(Home)
    const projects = screen.getByRole('region', { name: 'Projects' })
    for (const project of FEATURED_PROJECTS) {
      expect(within(projects).getByText(project.title)).toBeInTheDocument()
    }
    expect(within(projects).getByRole('link', { name: 'See all projects' })).toHaveAttribute('href', '/projects')
  })

  it('links each paper by DOI in the Research section (the /research redirect target)', async () => {
    await mountPage(Home)
    const research = screen.getByRole('region', { name: 'Research' })
    expect(research).toHaveAttribute('id', 'research')
    for (const paper of PAPERS) {
      expect(within(research).getByRole('link', { name: new RegExp(paper.title.slice(0, 30)) })).toHaveAttribute(
        'href',
        paperUrl(paper)
      )
    }
  })

  it('lists experience as plain rows', async () => {
    await mountPage(Home)
    const experience = screen.getByRole('region', { name: 'Experience' })
    for (const entry of EXPERIENCE) {
      expect(within(experience).getByText(entry.detail)).toBeInTheDocument()
    }
    expect(within(experience).queryByRole('link')).toBeNull()
  })

  it('opens terminal mode from Elsewhere', async () => {
    await mountPage(Home)
    initTerminalLaunchers()
    const elsewhere = screen.getByRole('region', { name: 'Elsewhere' })
    expect(within(elsewhere).getAllByRole('link')).toHaveLength(CONTACT_LINKS.length)
    fireEvent.click(within(elsewhere).getByRole('button', { name: 'Terminal mode' }))
    expect(await screen.findByRole('dialog', { name: 'Terminal' })).toHaveAttribute('aria-modal', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Close terminal' }))
  })
})

describe('About', () => {
  it('prints every paragraph and the contact links', async () => {
    await mountPage(About)
    for (const paragraph of ABOUT_PARAGRAPHS) {
      expect(screen.getByText(paragraph)).toBeInTheDocument()
    }
    const contact = screen.getByRole('region', { name: 'Contact' })
    expect(within(contact).getAllByRole('link')).toHaveLength(CONTACT_LINKS.length)
  })
})

describe('Projects', () => {
  it('shows recent projects with stack and year, then the archive', async () => {
    await mountPage(Projects)
    const recent = screen.getByRole('region', { name: 'Recent' })
    expect(within(recent).getByText('React Native · Expo · 2026')).toBeInTheDocument()

    const earlier = screen.getByRole('region', { name: 'Earlier' })
    expect(within(earlier).getAllByRole('link')).toHaveLength(ARCHIVED_PROJECTS.length)
    for (const project of ARCHIVED_PROJECTS) {
      const link = within(earlier).getByRole('link', { name: new RegExp(project.title) })
      expect(link).toHaveAttribute('href', project.link)
      expect(link).toHaveTextContent(project.stack.join(' · '))
    }
  })
})

describe('404', () => {
  it('links back home', async () => {
    await mountPage(NotFound)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page not found')
    expect(screen.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/')
  })
})
