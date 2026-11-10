/* Product analytics with PostHog (EU cloud). The pure rules live here; src/scripts/analytics.ts
   wires them to the page. Tracking is cookieless: PostHog never writes cookies or storage, and
   counts unique visitors with a server-side hash, so the site needs no consent banner. */
import type { PostHogConfig } from 'posthog-js'
import { SITE_URL } from '@content/site'
import type { CommandResult } from '@lib/terminalCommands'

/** Public by design: PostHog project tokens can only send events, and ship in every page. */
export const POSTHOG_PROJECT_TOKEN = 'phc_mB2nfSByCVgmsAoFQtm5xbceGvr54CGZbifdzUv28st5'
/** Where links back to PostHog (the toolbar, for one) point. */
export const POSTHOG_UI_HOST = 'https://eu.posthog.com'
export const POSTHOG_INGEST_HOST = 'https://eu.i.posthog.com'
export const POSTHOG_ASSETS_HOST = 'https://eu-assets.i.posthog.com'
/**
 * Same-origin path that public/_redirects proxies to PostHog, so blockers that list PostHog's
 * domains still let events through. Deliberately not a name like /analytics that blockers match.
 */
export const POSTHOG_PROXY_PATH = '/lantern'
/** Feature defaults pinned to a PostHog release date, so an SDK update cannot change them. */
const POSTHOG_DEFAULTS = '2026-08-30'

export const PRODUCTION_HOSTNAME = new URL(SITE_URL).hostname
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])

/** production: the live site. preview: Netlify deploy previews. local: dev and astro preview. */
export type SiteEnvironment = 'production' | 'preview' | 'local'

export function siteEnvironment(hostname: string): SiteEnvironment {
  if (hostname === PRODUCTION_HOSTNAME) return 'production'
  return LOCAL_HOSTNAMES.has(hostname) ? 'local' : 'preview'
}

/**
 * The proxy only runs on the custom domain: on *.netlify.app hosts Netlify rewrites
 * Content-Encoding and breaks proxied requests, so deploy previews send to PostHog directly.
 */
export function posthogApiHost(environment: SiteEnvironment): string {
  return environment === 'production' ? POSTHOG_PROXY_PATH : POSTHOG_INGEST_HOST
}

/** Captures everything the browser SDK can collect without cookies. */
export function posthogConfig(environment: SiteEnvironment): Partial<PostHogConfig> {
  return {
    api_host: posthogApiHost(environment),
    ui_host: POSTHOG_UI_HOST,
    defaults: POSTHOG_DEFAULTS,
    cookieless_mode: 'always',
    // Anonymous visitors get person profiles too: the site has no sign-in to identify anyone.
    person_profiles: 'always',
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    rageclick: true,
    capture_dead_clicks: true,
    capture_heatmaps: true,
    capture_exceptions: true,
    capture_performance: { web_vitals: true, network_timing: true },
    disable_session_recording: false,
    enable_recording_console_log: true,
    // The only input on the site is the terminal prompt; its commands are what replay should show.
    session_recording: { maskAllInputs: false },
  }
}

/**
 * PostHog's snippet: defines a window.posthog stub that queues calls, and on init loads the SDK
 * from api_host. Runs inline in <head> so calls made before the SDK arrives are kept.
 */
export const POSTHOG_LOADER_SCRIPT = `!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split('.');2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement('script')).type='text/javascript',p.crossOrigin='anonymous',p.async=!0,p.src=s.api_host+'/static/array.js',(r=t.getElementsByTagName('script')[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a='posthog',u.people=u.people||[],Object.defineProperty(u,'toString',{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e='posthog';return'posthog'!==a&&(e+='.'+a),t||(e+=' (stub)'),e}}),Object.defineProperty(u.people,'toString',{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+'.people (stub)'}}),o='capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId'.split(' '),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[])`

/** Custom events. PostHog's own ($pageview, $autocapture, $rageclick, ...) come on top. */
export const ANALYTICS_EVENTS = {
  TERMINAL_OPENED: 'terminal_opened',
  TERMINAL_COMMAND_RUN: 'terminal_command_run',
  TERMINAL_MAXIMIZE_TOGGLED: 'terminal_maximize_toggled',
  TERMINAL_CLOSED: 'terminal_closed',
  THEME_TOGGLED: 'theme_toggled',
  PROJECT_PREVIEW_SHOWN: 'project_preview_shown',
  PROJECT_LINK_CLICKED: 'project_link_clicked',
  PAPER_LINK_CLICKED: 'paper_link_clicked',
  CONTACT_LINK_CLICKED: 'contact_link_clicked',
  PAGE_NOT_FOUND: 'page_not_found',
} as const

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

const EVENT_NAMES = new Set<string>(Object.values(ANALYTICS_EVENTS))

export function isAnalyticsEvent(value: unknown): value is AnalyticsEvent {
  return typeof value === 'string' && EVENT_NAMES.has(value)
}

/** Flat values only, so every property is filterable in PostHog without parsing. */
export type EventProperties = Record<string, string | number | boolean>

/* ─── Link clicks: markup declares the event, one document listener captures it ─── */

export const ANALYTICS_EVENT_ATTRIBUTE = 'data-analytics-event'
export const ANALYTICS_PROPERTIES_ATTRIBUTE = 'data-analytics-properties'

export type AnalyticsAttributes = Record<
  typeof ANALYTICS_EVENT_ATTRIBUTE | typeof ANALYTICS_PROPERTIES_ATTRIBUTE,
  string
>

/** Attributes to spread on a link so clicking it captures `event` with `properties`. */
export function analyticsAttributes(
  event: AnalyticsEvent,
  properties: EventProperties
): AnalyticsAttributes {
  return {
    [ANALYTICS_EVENT_ATTRIBUTE]: event,
    [ANALYTICS_PROPERTIES_ATTRIBUTE]: JSON.stringify(properties),
  }
}

/** The markup on a tracked link is not what analyticsAttributes() writes. */
export class AnalyticsMarkupError extends Error {
  constructor(detail: string) {
    super(`Invalid analytics markup: ${detail}`)
    this.name = 'AnalyticsMarkupError'
  }
}

const isFlatValue = (value: unknown): value is string | number | boolean =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'

/** Reads back what analyticsAttributes() wrote. Anything else is a markup bug and throws. */
export function parseAnalyticsAttributes(
  event: string | null,
  properties: string | null
): { event: AnalyticsEvent; properties: EventProperties } {
  if (!isAnalyticsEvent(event)) throw new AnalyticsMarkupError(`unknown event ${String(event)}`)
  if (properties === null) throw new AnalyticsMarkupError(`${event} has no properties`)
  const parsed: unknown = JSON.parse(properties)
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    Array.isArray(parsed) ||
    !Object.values(parsed).every(isFlatValue)
  ) {
    throw new AnalyticsMarkupError(`${event} properties are not a flat object: ${properties}`)
  }
  return { event, properties: parsed as EventProperties }
}

/* ─── Terminal ─── */

/** Longer input (a pasted essay after "echo") is cut, to keep events small. */
export const MAX_TRACKED_COMMAND_LENGTH = 200

/** How the visitor left terminal mode. */
export type TerminalCloseMethod =
  'close_button' | 'escape_key' | 'backdrop' | 'exit_command' | 'navigate_command'

/** Properties of one non-blank command: what was typed, whether it failed, what it did. */
export function terminalCommandProperties(raw: string, result: CommandResult): EventProperties {
  return {
    command: raw.trim().toLowerCase().slice(0, MAX_TRACKED_COMMAND_LENGTH),
    printed_error: result.output.some((line) => line.type === 'error'),
    action: result.action?.type ?? 'none',
  }
}
