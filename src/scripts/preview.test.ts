import { fireEvent, screen } from '@testing-library/dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ProjectList from '@components/ProjectList.astro'
import { IMAGE_FILTER, MORPH_GRACE_MS, PREVIEW_SCALE } from '@lib/preview'
import type { FeaturedProject } from '@models/project'
import { initProjectPreviews } from '@scripts/preview'
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
const NO_SHOT: FeaturedProject = {
  id: 'noshot',
  title: 'No screenshot',
  description: 'Linked, but nothing to preview.',
  stack: ['Go'],
  year: 2024,
  link: 'https://noshot.example',
}

async function mountList() {
  await mount(ProjectList, { props: { projects: [WIDE, UNLINKED, TALL, NO_SHOT] } })
  initProjectPreviews()
}

const list = () => document.querySelector<HTMLElement>('[data-project-list]')!
const frame = () => document.querySelector<HTMLElement>('[data-project-preview]')!
const imageFor = (id: string) =>
  frame().querySelector<HTMLImageElement>(`img[data-project="${id}"]`)!
const unlinkedRow = () =>
  screen.getByText('Unlinked platform').closest<HTMLElement>('[data-preview-row]')!

/** jsdom has no layout, so give rows the offsets a browser would compute. */
function placeRow(name: RegExp, offsetTop: number): HTMLElement {
  const row = screen.getByRole('link', { name })
  Object.defineProperty(row, 'offsetTop', { configurable: true, value: offsetTop })
  return row
}

describe('initProjectPreviews', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('fades in at the hovered row, sized to that screenshot', async () => {
    await mountList()
    fireEvent.mouseEnter(placeRow(/Wide app/, 0))

    // 288 * 500 / 1000 = 144; the top adds the row's 8px padding.
    expect(frame()).toHaveStyle({
      opacity: '1',
      transform: PREVIEW_SCALE.shown,
      top: '8px',
      height: '144px',
    })
    expect(frame().style.transition, 'first appearance only fades').not.toContain('top')
    expect(imageFor('wide').style.opacity).toBe('1')
    expect(imageFor('tall').style.opacity).toBe('0')
  })

  it('morphs to the next row: slides, reshapes and crossfades instead of cropping', async () => {
    await mountList()
    fireEvent.mouseEnter(placeRow(/Wide app/, 0))
    fireEvent.mouseEnter(placeRow(/Tall app/, 120))

    // 288 * 1000 / 1600 = 180
    expect(frame()).toHaveStyle({ top: '128px', height: '180px', opacity: '1' })
    expect(frame().style.transition).toContain('top 260ms')
    expect(frame().style.transition).toContain('height 260ms')
    expect(imageFor('tall').style.opacity).toBe('1')
    expect(imageFor('tall').style.filter).toBe(IMAGE_FILTER.active)
    expect(imageFor('wide').style.opacity).toBe('0')
    expect(imageFor('wide').style.filter).toBe(IMAGE_FILTER.inactive)
    expect(imageFor('wide').style.height, 'images keep their own height').toBe('144px')
  })

  it('hides when the pointer reaches an unlinked project, which has no screenshot', async () => {
    await mountList()
    fireEvent.mouseEnter(placeRow(/Wide app/, 0))
    fireEvent.mouseEnter(unlinkedRow())
    expect(frame()).toHaveStyle({ opacity: '0', transform: PREVIEW_SCALE.hidden })
  })

  it('hides on a linked project without a screenshot', async () => {
    await mountList()
    fireEvent.mouseEnter(placeRow(/Wide app/, 0))
    fireEvent.mouseEnter(placeRow(/No screenshot/, 240))
    expect(frame()).toHaveStyle({ opacity: '0' })
  })

  it('hides when the pointer leaves the list', async () => {
    await mountList()
    fireEvent.mouseEnter(placeRow(/Wide app/, 0))
    fireEvent.mouseLeave(list())
    expect(frame()).toHaveStyle({ opacity: '0' })
  })

  it('follows keyboard focus and hides on blur', async () => {
    await mountList()
    const row = placeRow(/Tall app/, 80)
    fireEvent.focus(row)
    expect(frame()).toHaveStyle({ opacity: '1', top: '88px' })
    fireEvent.blur(row)
    expect(frame()).toHaveStyle({ opacity: '0' })
  })

  it('morphs across an unlinked row instead of teleporting', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    await mountList()
    fireEvent.mouseEnter(placeRow(/Wide app/, 0))
    fireEvent.mouseEnter(unlinkedRow())
    vi.advanceTimersByTime(MORPH_GRACE_MS - 60)
    fireEvent.mouseEnter(placeRow(/Tall app/, 120))
    expect(frame()).toHaveStyle({ opacity: '1', top: '128px' })
    expect(frame().style.transition, 'crossing an unlinked row').toContain('top 260ms')
  })

  it('morphs when Tab moves focus to the next row (blur and focus in one tick)', async () => {
    await mountList()
    const wide = placeRow(/Wide app/, 0)
    const tall = placeRow(/Tall app/, 120)
    fireEvent.focus(wide)
    fireEvent.blur(wide)
    fireEvent.focus(tall)
    expect(frame()).toHaveStyle({ opacity: '1', top: '128px' })
    expect(frame().style.transition, 'keyboard focus move').toContain('top 260ms')
  })

  it('fades in at the new row once the preview has been hidden past the grace window', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    await mountList()
    fireEvent.mouseEnter(placeRow(/Wide app/, 0))
    fireEvent.mouseLeave(list())
    vi.advanceTimersByTime(MORPH_GRACE_MS)
    fireEvent.mouseEnter(placeRow(/Tall app/, 120))
    expect(frame()).toHaveStyle({ opacity: '1', top: '128px' })
    expect(frame().style.transition, 'reappearing after a long hide').not.toContain('top')
  })

  it('a second hide while already hidden does not restart the grace window', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    await mountList()
    const wide = placeRow(/Wide app/, 0)
    fireEvent.focus(wide)
    fireEvent.mouseLeave(list())
    vi.advanceTimersByTime(MORPH_GRACE_MS)
    fireEvent.blur(wide)
    fireEvent.mouseEnter(placeRow(/Tall app/, 120))
    expect(frame().style.transition).not.toContain('top')
  })

  it('wires each list on the page independently', async () => {
    await mount(ProjectList, { props: { projects: [WIDE] } })
    const first = document.body.innerHTML
    document.body.innerHTML = first + first
    initProjectPreviews()
    const [a, b] = Array.from(document.querySelectorAll<HTMLElement>('[data-project-preview]'))
    fireEvent.mouseEnter(screen.getAllByRole('link', { name: /Wide app/ })[1])
    expect(a.style.opacity, 'untouched list').toBe('0')
    expect(b.style.opacity, 'hovered list').toBe('1')
  })
})
