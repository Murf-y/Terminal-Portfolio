import { describe, expect, it } from 'vitest'
import {
  MORPH_GRACE_MS,
  PREVIEW_WIDTH,
  previewHeight,
  previewTransition,
  shouldMorph,
} from '@lib/preview'
import { FEATURED_PROJECTS } from '@content/projects'

describe('previewHeight', () => {
  it('keeps the screenshot ratio at the default preview width', () => {
    const height = previewHeight({ src: '/a.png', width: 1440, height: 900 })
    // 288 * 900 / 1440 = 180 exactly
    expect(height, `1440x900 at ${PREVIEW_WIDTH}px wide`).toBe(180)
  })

  it('rounds to whole pixels', () => {
    // 288 * 602 / 1195 = 145.08...
    expect(previewHeight({ src: '/muleprep.png', width: 1195, height: 602 })).toBe(145)
  })

  it('scales with a custom width', () => {
    expect(previewHeight({ src: '/a.png', width: 1000, height: 500 }, 500)).toBe(250)
  })

  it.each([
    [0, 500],
    [500, 0],
    [-1, 500],
  ])('rejects invalid dimensions %ix%i', (width, height) => {
    expect(() => previewHeight({ src: '/broken.png', width, height })).toThrow(RangeError)
    expect(() => previewHeight({ src: '/broken.png', width, height })).toThrow('/broken.png')
  })

  it('gives every featured screenshot a usable height (no cropping, no zero-height frame)', () => {
    for (const project of FEATURED_PROJECTS) {
      if (project.image === undefined) continue
      const height = previewHeight(project.image)
      expect(height, `${project.id} preview height`).toBeGreaterThan(100)
      expect(height, `${project.id} preview height`).toBeLessThan(PREVIEW_WIDTH)
    }
  })
})

describe('shouldMorph', () => {
  it('morphs while the preview is still showing', () => {
    expect(shouldMorph(true, null)).toBe(true)
    expect(shouldMorph(true, 10_000)).toBe(true)
  })

  it('fades in when the preview has never been shown', () => {
    expect(shouldMorph(false, null)).toBe(false)
  })

  it('still morphs right after a hide, as when Tab blurs one row and focuses the next', () => {
    expect(shouldMorph(false, 0)).toBe(true)
    expect(shouldMorph(false, MORPH_GRACE_MS - 1)).toBe(true)
  })

  it('fades in once the grace window has passed', () => {
    expect(shouldMorph(false, MORPH_GRACE_MS)).toBe(false)
    expect(shouldMorph(false, MORPH_GRACE_MS + 1000)).toBe(false)
  })
})

describe('previewTransition', () => {
  it('animates position and size when morphing between rows', () => {
    const transition = previewTransition(true)
    expect(transition).toContain('top 260ms')
    expect(transition).toContain('height 260ms')
    expect(transition).toContain('opacity 160ms')
  })

  it('only fades and scales when appearing from hidden', () => {
    const transition = previewTransition(false)
    expect(transition).not.toContain('top')
    expect(transition).not.toContain('height')
    expect(transition).toContain('opacity 160ms ease-out')
    expect(transition).toContain('transform 160ms ease-out')
  })
})
