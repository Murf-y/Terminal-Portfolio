/* Analytics in the browser. The rules live in lib/analytics.ts. window.posthog is the stub that
   POSTHOG_LOADER_SCRIPT defines in <head>; init() makes it load the SDK and replay queued calls. */
import type { PostHog } from 'posthog-js'
import {
  ANALYTICS_EVENT_ATTRIBUTE,
  ANALYTICS_PROPERTIES_ATTRIBUTE,
  type AnalyticsEvent,
  type EventProperties,
  POSTHOG_PROJECT_TOKEN,
  parseAnalyticsAttributes,
  posthogConfig,
  siteEnvironment,
} from '@lib/analytics'

/** The part of the SDK this site calls; the stub queues each of them. */
type PostHogClient = Pick<PostHog, 'init' | 'capture' | 'register'>

declare global {
  interface Window {
    posthog?: PostHogClient
  }
}

const TRACKED_SELECTOR = `[${ANALYTICS_EVENT_ATTRIBUTE}]`
/** auxclick also fires for the right button, which opens a menu rather than the link. */
const MIDDLE_BUTTON = 1

let client: PostHogClient | null = null

/** Captures a custom event. Does nothing until initAnalytics() has started PostHog. */
export function track(event: AnalyticsEvent, properties: EventProperties = {}): void {
  client?.capture(event, properties)
}

/** Captures the event a tracked link declares. Middle clicks count: they open the link too. */
function captureTrackedClick(event: MouseEvent): void {
  if (event.type === 'auxclick' && event.button !== MIDDLE_BUTTON) return
  if (!(event.target instanceof Element)) return
  const tracked = event.target.closest(TRACKED_SELECTOR)
  if (tracked === null) return
  const declared = parseAnalyticsAttributes(
    tracked.getAttribute(ANALYTICS_EVENT_ATTRIBUTE),
    tracked.getAttribute(ANALYTICS_PROPERTIES_ATTRIBUTE)
  )
  track(declared.event, declared.properties)
}

/**
 * Starts PostHog for this host, tags every event with the site environment, and captures clicks
 * on tracked links. Returns null without doing anything on local hosts, on pages without the
 * loader, and when tracking already runs. Otherwise returns a function that stops tracking.
 */
export function initAnalytics(hostname: string): (() => void) | null {
  const environment = siteEnvironment(hostname)
  const posthog = window.posthog
  if (environment === 'local' || posthog === undefined || client !== null) return null

  posthog.init(POSTHOG_PROJECT_TOKEN, posthogConfig(environment))
  posthog.register({ site_environment: environment })
  client = posthog
  document.addEventListener('click', captureTrackedClick)
  document.addEventListener('auxclick', captureTrackedClick)

  return () => {
    document.removeEventListener('click', captureTrackedClick)
    document.removeEventListener('auxclick', captureTrackedClick)
    client = null
  }
}
