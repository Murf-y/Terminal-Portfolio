/* Starts analytics against a recording stand-in for PostHog's window.posthog stub, so tests can
   assert exactly which events the real code captures. Stops itself when the test finishes. */
import { onTestFinished, vi } from 'vitest'
import {
  ANALYTICS_EVENT_ATTRIBUTE,
  ANALYTICS_PROPERTIES_ATTRIBUTE,
  type AnalyticsEvent,
  type EventProperties,
  PRODUCTION_HOSTNAME,
  parseAnalyticsAttributes,
} from '@lib/analytics'
import { initAnalytics } from '@scripts/analytics'

type PostHogClient = NonNullable<Window['posthog']>

export function startTestAnalytics(hostname: string = PRODUCTION_HOSTNAME) {
  const posthog = {
    init: vi.fn<PostHogClient['init']>(),
    capture: vi.fn<PostHogClient['capture']>(),
    register: vi.fn<PostHogClient['register']>(),
  }
  window.posthog = posthog
  const stop = initAnalytics(hostname)
  onTestFinished(() => {
    stop?.()
    delete window.posthog
  })

  /** Every captured custom event, in order, as [name, properties]. */
  const captured = () =>
    posthog.capture.mock.calls.map(([event, properties]) => [event, properties] as const)
  /** Properties of each capture of one event, in order. */
  const propertiesOf = (event: AnalyticsEvent): EventProperties[] =>
    captured()
      .filter(([name]) => name === event)
      .map(([, properties]) => properties as EventProperties)

  return { posthog, stop, captured, propertiesOf }
}

/** The event a rendered element declares for its clicks, read the way the page reads it. */
export function declaredEvent(element: Element) {
  return parseAnalyticsAttributes(
    element.getAttribute(ANALYTICS_EVENT_ATTRIBUTE),
    element.getAttribute(ANALYTICS_PROPERTIES_ATTRIBUTE)
  )
}

/** Whether an element carries any analytics markup at all. */
export const isTracked = (element: Element) => element.hasAttribute(ANALYTICS_EVENT_ATTRIBUTE)
