import { screen, within } from '@testing-library/dom'
import { describe, expect, it } from 'vitest'
import ContactLinks from '@components/ContactLinks.astro'
import PageHeader from '@components/PageHeader.astro'
import ProjectList from '@components/ProjectList.astro'
import Section from '@components/Section.astro'
import ThemeToggle from '@components/ThemeToggle.astro'
import TimelineRow from '@components/TimelineRow.astro'
import { CONTACT_LINKS, HEADLINE, NAME } from '@content/profile'
import { ANALYTICS_EVENTS, analyticsAttributes } from '@lib/analytics'
import { PREVIEW_SCALE } from '@lib/preview'
import type { FeaturedProject } from '@models/project'
import { declaredEvent, isTracked } from '../../tests/analytics'
import { mount } from '../../tests/astro'

const WIDE: FeaturedProject = {
  id: 'wide',
  title: 'Wide app',
  description: 'A 2:1 screenshot.',
  stack: ['React'],
  year: 2026,
  link: 'https://wide.example',
  image: { src: '/wide.png', width: 1000, height: 500 },
}
const TALL: FeaturedProject = {
  id: 'tall',
  title: 'Tall app',
  description: 'A 1.6:1 screenshot.',
  stack: ['Go', 'gRPC'],
  year: 2025,
  link: 'https://tall.example',
  image: { src: '/tall.png', width: 1600, height: 1000 },
}
const UNLINKED: FeaturedProject = {
  id: 'unlinked',
  title: 'Unlinked platform',
  description: 'No public link.',
  stack: ['Kafka'],
  year: 2026,
}

describe('Section', () => {
  it('labels the section with its heading so it is a named landmark', async () => {
    await mount(Section, {
      props: { id: 'research', title: 'Research' },
      slots: { default: '<p>body</p>' },
    })
    const region = screen.getByRole('region', { name: 'Research' })
    expect(region).toHaveAttribute('id', 'research')
    expect(within(region).getByRole('heading', { level: 2 })).toHaveAttribute(
      'id',
      'research-heading'
    )
    expect(region).toContainElement(screen.getByText('body'))
  })
})

describe('TimelineRow', () => {
  it('renders a plain row without href', async () => {
    await mount(TimelineRow, { props: { period: '2024' }, slots: { default: 'Degree' } })
    expect(screen.getByText('2024')).toHaveClass('tabular-nums')
    expect(screen.getByText('Degree')).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('renders an external link with href', async () => {
    await mount(TimelineRow, {
      props: { period: '2026', href: 'https://doi.org/10.1/x' },
      slots: { default: 'Paper' },
    })
    const link = screen.getByRole('link', { name: /Paper/ })
    expect(link).toHaveAttribute('href', 'https://doi.org/10.1/x')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
    expect(link).toHaveClass('row-link')
    expect(isTracked(link), 'untracked unless asked').toBe(false)
  })

  it('declares the analytics event it is given', async () => {
    const analytics = analyticsAttributes(ANALYTICS_EVENTS.PAPER_LINK_CLICKED, {
      paper_doi: '10.1/x',
    })
    await mount(TimelineRow, {
      props: { period: '2026', href: 'https://doi.org/10.1/x', analytics },
      slots: { default: 'Paper' },
    })
    expect(declaredEvent(screen.getByRole('link', { name: /Paper/ }))).toEqual({
      event: ANALYTICS_EVENTS.PAPER_LINK_CLICKED,
      properties: { paper_doi: '10.1/x' },
    })
  })
})

describe('ContactLinks', () => {
  it('renders every contact link; only email stays in the tab', async () => {
    await mount(ContactLinks)
    expect(screen.getAllByRole('link')).toHaveLength(CONTACT_LINKS.length)
    for (const link of CONTACT_LINKS) {
      const anchor = screen.getByRole('link', { name: link.label })
      expect(anchor).toHaveAttribute('href', link.href)
      expect(anchor.getAttribute('target'), link.label).toBe(link.id === 'email' ? null : '_blank')
      expect(anchor.getAttribute('rel'), link.label).toBe(link.id === 'email' ? null : 'noreferrer')
      expect(declaredEvent(anchor), link.label).toEqual({
        event: ANALYTICS_EVENTS.CONTACT_LINK_CLICKED,
        properties: { contact_method: link.id },
      })
    }
  })

  it('renders extra items after the links', async () => {
    await mount(ContactLinks, {
      slots: { default: '<button type="button">Terminal mode</button>' },
    })
    const button = screen.getByRole('button', { name: 'Terminal mode' })
    expect(button.previousElementSibling).toHaveTextContent(
      CONTACT_LINKS[CONTACT_LINKS.length - 1].label
    )
  })
})

describe('PageHeader', () => {
  it('on Home, makes the name the page heading', async () => {
    await mount(PageHeader)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(NAME)
    expect(screen.getByText(HEADLINE)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: NAME })).toBeNull()
  })

  it('on other pages, links the name home and titles the page', async () => {
    await mount(PageHeader, { props: { title: 'About' } })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('About')
    expect(screen.getByRole('link', { name: NAME })).toHaveAttribute('href', '/')
  })

  it('has the terminal launcher and the theme toggle', async () => {
    await mount(PageHeader)
    const terminal = screen.getByRole('button', { name: 'Open terminal mode' })
    expect(terminal).toHaveAttribute('data-open-terminal')
    expect(terminal).toHaveTextContent('>_')
    expect(terminal, 'uses the system mono so pages never fetch the terminal font').toHaveClass(
      'font-system-mono'
    )
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toHaveAttribute(
      'data-theme-toggle'
    )
  })
})

describe('ThemeToggle', () => {
  it('ships both icons and a label for the default dark theme', async () => {
    await mount(ThemeToggle)
    const button = screen.getByRole('button', { name: 'Switch to light theme' })
    expect(button.querySelector('.theme-icon-sun')).not.toBeNull()
    expect(button.querySelector('.theme-icon-moon')).not.toBeNull()
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('ProjectList', () => {
  const frame = () => document.querySelector<HTMLElement>('[data-project-preview]')
  const imageFor = (id: string) =>
    frame()?.querySelector<HTMLImageElement>(`img[data-project="${id}"]`)

  it('renders linked projects as links and unlinked ones as plain rows', async () => {
    await mount(ProjectList, { props: { projects: [WIDE, UNLINKED, TALL] } })
    expect(screen.getByRole('link', { name: /Wide app/ })).toHaveAttribute('href', WIDE.link)
    expect(screen.getByRole('link', { name: /Tall app/ })).toHaveAttribute('target', '_blank')
    expect(screen.getByText('Unlinked platform').closest('a')).toBeNull()
    expect(screen.getByText('Unlinked platform').closest('[data-preview-row]')).not.toBeNull()
  })

  it('declares a project click on every linked row, naming the list it is in', async () => {
    await mount(ProjectList, { props: { projects: [WIDE, UNLINKED] } })
    expect(declaredEvent(screen.getByRole('link', { name: /Wide app/ }))).toEqual({
      event: ANALYTICS_EVENTS.PROJECT_LINK_CLICKED,
      properties: { project_id: 'wide', project_title: 'Wide app', placement: 'home' },
    })
    const unlinked = screen.getByText('Unlinked platform').closest('[data-preview-row]')!
    expect(isTracked(unlinked), 'nothing to click on an unlinked row').toBe(false)

    await mount(ProjectList, { props: { projects: [WIDE], showStack: true } })
    expect(
      declaredEvent(screen.getByRole('link', { name: /Wide app/ })).properties.placement,
      'the /projects list'
    ).toBe('projects_recent')
  })

  it('tags only rows that have a screenshot with their project id', async () => {
    const noShot: FeaturedProject = {
      ...TALL,
      id: 'noshot',
      title: 'No screenshot',
      image: undefined,
    }
    await mount(ProjectList, { props: { projects: [WIDE, noShot] } })
    expect(screen.getByRole('link', { name: /Wide app/ })).toHaveAttribute(
      'data-project-id',
      'wide'
    )
    expect(screen.getByRole('link', { name: /No screenshot/ })).not.toHaveAttribute(
      'data-project-id'
    )
  })

  it('starts the preview hidden, sized to the first screenshot', async () => {
    await mount(ProjectList, { props: { projects: [UNLINKED, WIDE, TALL] } })
    // 288 * 500 / 1000 = 144
    expect(frame()).toHaveStyle({
      opacity: '0',
      transform: PREVIEW_SCALE.hidden,
      height: '144px',
      width: '288px',
    })
    expect(frame()).toHaveAttribute('aria-hidden', 'true')
    expect(imageFor('wide')?.style.opacity).toBe('1')
    expect(imageFor('tall')?.style.opacity).toBe('0')
  })

  it('renders every screenshot at its own full height, lazily, with no alt text', async () => {
    await mount(ProjectList, { props: { projects: [WIDE, TALL] } })
    expect(imageFor('wide')?.style.height, 'wide image at 288px wide').toBe('144px')
    expect(imageFor('tall')?.style.height, 'tall image at 288px wide (288 * 1000 / 1600)').toBe(
      '180px'
    )
    for (const id of ['wide', 'tall']) {
      expect(imageFor(id), id).toHaveAttribute('loading', 'lazy')
      expect(imageFor(id), id).toHaveAttribute('alt', '')
    }
    expect(imageFor('wide')).toHaveAttribute('width', '1000')
    expect(imageFor('wide')?.className).not.toMatch(/object-cover|h-full|inset-0/)
  })

  it('shows stack and year only when asked', async () => {
    await mount(ProjectList, { props: { projects: [TALL] } })
    expect(screen.queryByText('Go · gRPC · 2025')).toBeNull()
    await mount(ProjectList, { props: { projects: [TALL], showStack: true } })
    expect(screen.getByText('Go · gRPC · 2025')).toBeInTheDocument()
  })

  it('renders no preview at all when no project has a screenshot', async () => {
    await mount(ProjectList, { props: { projects: [UNLINKED] } })
    expect(frame()).toBeNull()
  })
})
