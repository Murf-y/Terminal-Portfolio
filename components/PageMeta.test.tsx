import { render } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import PageMeta from '@components/PageMeta'

// next/head hoists its children into <head> through Next's head manager, which tests don't run.
// Rendering them in place keeps the tags themselves under test.
vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const tag = (container: HTMLElement, selector: string) => container.querySelector(selector)

describe('PageMeta', () => {
  it('builds the canonical and Open Graph URL from the site URL and the page path', () => {
    const { container } = render(<PageMeta title="About · Charbel Fayad" description="Dense." path="/about" />)
    expect(tag(container, 'title')).toHaveTextContent('About · Charbel Fayad')
    expect(tag(container, 'link[rel="canonical"]')).toHaveAttribute('href', 'https://charbelfayad.com/about')
    expect(tag(container, 'meta[property="og:url"]')).toHaveAttribute('content', 'https://charbelfayad.com/about')
    expect(tag(container, 'meta[name="description"]')).toHaveAttribute('content', 'Dense.')
    expect(tag(container, 'meta[property="og:description"]')).toHaveAttribute('content', 'Dense.')
    expect(tag(container, 'meta[property="og:title"]')).toHaveAttribute('content', 'About · Charbel Fayad')
  })

  it('gives Home the bare origin with a trailing slash', () => {
    const { container } = render(<PageMeta title="Charbel Fayad" description="Home." path="/" />)
    expect(tag(container, 'link[rel="canonical"]')).toHaveAttribute('href', 'https://charbelfayad.com/')
  })

  it('omits canonical and description tags when the page has none (404)', () => {
    const { container } = render(<PageMeta title="Page not found · Charbel Fayad" />)
    expect(tag(container, 'link[rel="canonical"]')).toBeNull()
    expect(tag(container, 'meta[property="og:url"]')).toBeNull()
    expect(tag(container, 'meta[name="description"]')).toBeNull()
  })
})
