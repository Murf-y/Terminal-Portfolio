import { fireEvent } from '@testing-library/dom'
import { describe, expect, it, vi } from 'vitest'
import {
  ANALYTICS_EVENTS,
  POSTHOG_INGEST_HOST,
  POSTHOG_PROJECT_TOKEN,
  POSTHOG_PROXY_PATH,
  PRODUCTION_HOSTNAME,
  analyticsAttributes,
} from '@lib/analytics'
import { initAnalytics, track } from '@scripts/analytics'
import { startTestAnalytics } from '../../tests/analytics'

const PREVIEW_HOSTNAME = 'deploy-preview-6--murfy.netlify.app'
const MIDDLE_BUTTON = 1
const RIGHT_BUTTON = 2

/** A tracked link with a nested span, as the project rows render. */
function mountTrackedLink(): HTMLElement {
  const link = document.createElement('a')
  link.href = 'https://example.com'
  for (const [name, value] of Object.entries(
    analyticsAttributes(ANALYTICS_EVENTS.PROJECT_LINK_CLICKED, {
      project_id: 'nevo',
      placement: 'home',
    })
  )) {
    link.setAttribute(name, value)
  }
  link.innerHTML = '<span>Nevo</span>'
  // Keep jsdom from attempting navigation.
  link.addEventListener('click', (event) => event.preventDefault())
  document.body.append(link)
  return link
}

describe('initAnalytics', () => {
  it('in production, starts PostHog through the proxy and tags events as production', () => {
    const { posthog, stop } = startTestAnalytics(PRODUCTION_HOSTNAME)
    expect(stop, 'returns a stop function once started').toBeTypeOf('function')
    expect(posthog.init).toHaveBeenCalledTimes(1)
    const [token, config] = posthog.init.mock.calls[0]
    expect(token).toBe(POSTHOG_PROJECT_TOKEN)
    expect(config).toMatchObject({ api_host: POSTHOG_PROXY_PATH, disable_session_recording: false })
    expect(posthog.register).toHaveBeenCalledWith({ site_environment: 'production' })
  })

  it('on a deploy preview, sends straight to PostHog and tags events as preview', () => {
    const { posthog } = startTestAnalytics(PREVIEW_HOSTNAME)
    expect(posthog.init.mock.calls[0][1]).toMatchObject({ api_host: POSTHOG_INGEST_HOST })
    expect(posthog.register).toHaveBeenCalledWith({ site_environment: 'preview' })
  })

  it('stays off locally, so development never reaches the project', () => {
    const { posthog, stop } = startTestAnalytics('localhost')
    expect(stop).toBeNull()
    expect(posthog.init).not.toHaveBeenCalled()
    track(ANALYTICS_EVENTS.TERMINAL_OPENED)
    expect(posthog.capture, 'track is a no-op').not.toHaveBeenCalled()
  })

  it('stays off when the page has no loader', () => {
    expect(initAnalytics(PRODUCTION_HOSTNAME)).toBeNull()
    expect(() => track(ANALYTICS_EVENTS.TERMINAL_OPENED)).not.toThrow()
  })

  it('starts once: a second call neither re-inits nor adds listeners', () => {
    const { posthog, propertiesOf } = startTestAnalytics()
    expect(initAnalytics(PRODUCTION_HOSTNAME)).toBeNull()
    expect(posthog.init).toHaveBeenCalledTimes(1)
    fireEvent.click(mountTrackedLink())
    expect(
      propertiesOf(ANALYTICS_EVENTS.PROJECT_LINK_CLICKED),
      'one capture per click'
    ).toHaveLength(1)
  })
})

describe('track', () => {
  it('sends to the SDK that replaced the stub, not to the stub it started with', () => {
    const { posthog: stub } = startTestAnalytics()
    // What array.js does when it arrives: window.posthog becomes the real instance.
    const sdk = { init: vi.fn(), capture: vi.fn(), register: vi.fn() }
    window.posthog = sdk
    track(ANALYTICS_EVENTS.TERMINAL_OPENED)
    expect(sdk.capture).toHaveBeenCalledWith('terminal_opened', {})
    expect(stub.capture, 'the stale stub would never send it').not.toHaveBeenCalled()
  })

  it('captures the event with its properties, defaulting to none', () => {
    const { captured } = startTestAnalytics()
    track(ANALYTICS_EVENTS.TERMINAL_OPENED)
    track(ANALYTICS_EVENTS.THEME_TOGGLED, { theme: 'light', source: 'button' })
    expect(captured()).toEqual([
      ['terminal_opened', {}],
      ['theme_toggled', { theme: 'light', source: 'button' }],
    ])
  })
})

describe('tracked link clicks', () => {
  const EXPECTED = { project_id: 'nevo', placement: 'home' }

  it('captures what the link declares, also when the click lands on a child', () => {
    const { propertiesOf } = startTestAnalytics()
    const link = mountTrackedLink()
    fireEvent.click(link.querySelector('span')!)
    fireEvent.click(link)
    expect(propertiesOf(ANALYTICS_EVENTS.PROJECT_LINK_CLICKED)).toEqual([EXPECTED, EXPECTED])
  })

  it('counts a middle click, which opens the link, but not a right click', () => {
    const { propertiesOf } = startTestAnalytics()
    const link = mountTrackedLink()
    fireEvent(link, new MouseEvent('auxclick', { bubbles: true, button: MIDDLE_BUTTON }))
    fireEvent(link, new MouseEvent('auxclick', { bubbles: true, button: RIGHT_BUTTON }))
    expect(propertiesOf(ANALYTICS_EVENTS.PROJECT_LINK_CLICKED)).toEqual([EXPECTED])
  })

  it('ignores clicks outside tracked elements', () => {
    const { captured } = startTestAnalytics()
    mountTrackedLink()
    const other = document.createElement('button')
    document.body.append(other)
    fireEvent.click(other)
    fireEvent.click(document.body)
    expect(captured()).toEqual([])
  })

  it('stop() removes the listeners and silences track()', () => {
    const { stop, captured } = startTestAnalytics()
    const link = mountTrackedLink()
    stop!()
    fireEvent.click(link)
    track(ANALYTICS_EVENTS.TERMINAL_OPENED)
    expect(captured()).toEqual([])
  })
})
