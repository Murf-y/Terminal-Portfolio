import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ProjectList from '@components/ProjectList'
import { FeaturedProject } from '@models/project'
import { trackProjectClick } from '@hooks/useAnalytics'

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
const PRIVATE: FeaturedProject = {
  id: 'private',
  title: 'Private platform',
  description: 'No public link.',
  stack: ['Kafka'],
  year: 2026,
}

const renderList = (showStack = false) =>
  render(<ProjectList projects={[WIDE, PRIVATE, TALL]} source="test" showStack={showStack} />)

const preview = () => screen.getByTestId('project-preview')
const imageFor = (id: string) =>
  preview().querySelector<HTMLImageElement>(`img[data-project="${id}"]`)!

/** jsdom has no layout, so give rows the offsets a browser would compute. */
function placeRow(name: RegExp, offsetTop: number): HTMLElement {
  const row = screen.getByRole('link', { name })
  Object.defineProperty(row, 'offsetTop', { configurable: true, value: offsetTop })
  return row
}

describe('ProjectList', () => {
  it('renders linked projects as links and private ones as plain rows', () => {
    renderList()
    expect(screen.getByRole('link', { name: /Wide app/ })).toHaveAttribute('href', WIDE.link)
    expect(screen.getByRole('link', { name: /Tall app/ })).toHaveAttribute('target', '_blank')
    expect(screen.getByText('Private platform').closest('a')).toBeNull()
  })

  it('starts with the preview hidden', () => {
    renderList()
    expect(preview()).toHaveStyle({ opacity: '0', transform: 'scale(0.96)' })
    expect(preview()).toHaveAttribute('aria-hidden', 'true')
  })

  it('fades in at the hovered row, sized to that screenshot', () => {
    renderList()
    fireEvent.mouseEnter(placeRow(/Wide app/, 0))

    expect(preview()).toHaveStyle({ opacity: '1', transform: 'scale(1)', top: '8px', height: '160px' })
    expect(preview().style.transition, 'first appearance only fades').not.toContain('top')
    expect(imageFor('wide').style.opacity).toBe('1')
    expect(imageFor('tall').style.opacity).toBe('0')
  })

  it('morphs to the next row: slides, reshapes and crossfades instead of cropping', () => {
    renderList()
    fireEvent.mouseEnter(placeRow(/Wide app/, 0))
    fireEvent.mouseEnter(placeRow(/Tall app/, 120))

    // 320 * 1000 / 1600 = 200
    expect(preview()).toHaveStyle({ top: '128px', height: '200px', opacity: '1' })
    expect(preview().style.transition).toContain('top 260ms')
    expect(preview().style.transition).toContain('height 260ms')
    expect(imageFor('tall').style.opacity).toBe('1')
    expect(imageFor('tall').style.filter).toBe('blur(0px)')
    expect(imageFor('wide').style.opacity).toBe('0')
    expect(imageFor('wide').style.filter).toBe('blur(2px)')
  })

  it('hides when the pointer reaches a private project, which has no screenshot', () => {
    renderList()
    fireEvent.mouseEnter(placeRow(/Wide app/, 0))
    fireEvent.mouseEnter(screen.getByText('Private platform').parentElement!)
    expect(preview()).toHaveStyle({ opacity: '0' })
  })

  it('hides when the pointer leaves the list', () => {
    const { container } = renderList()
    fireEvent.mouseEnter(placeRow(/Wide app/, 0))
    fireEvent.mouseLeave(container.firstElementChild!)
    expect(preview()).toHaveStyle({ opacity: '0' })
  })

  it('follows keyboard focus and hides on blur', () => {
    renderList()
    const row = placeRow(/Tall app/, 80)
    fireEvent.focus(row)
    expect(preview()).toHaveStyle({ opacity: '1', top: '88px' })
    fireEvent.blur(row)
    expect(preview()).toHaveStyle({ opacity: '0' })
  })

  it('reappearing after a hide fades in rather than sliding from the old row', () => {
    const { container } = renderList()
    fireEvent.mouseEnter(placeRow(/Wide app/, 0))
    fireEvent.mouseLeave(container.firstElementChild!)
    fireEvent.mouseEnter(placeRow(/Tall app/, 120))
    expect(preview().style.transition).not.toContain('top')
  })

  it('shows stack and year only when asked', () => {
    const { unmount } = renderList()
    expect(screen.queryByText('Go · gRPC · 2025')).toBeNull()
    unmount()
    renderList(true)
    expect(screen.getByText('Go · gRPC · 2025')).toBeInTheDocument()
  })

  it('reports project clicks to analytics', () => {
    renderList()
    fireEvent.click(screen.getByRole('link', { name: /Wide app/ }))
    expect(trackProjectClick).toHaveBeenCalledWith('Wide app', WIDE.link)
  })

  it('renders no preview at all when no project has a screenshot', () => {
    render(<ProjectList projects={[PRIVATE]} source="test" />)
    expect(screen.queryByTestId('project-preview')).toBeNull()
  })
})
