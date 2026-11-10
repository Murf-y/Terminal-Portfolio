import { describe, expect, it } from 'vitest'
import {
  ANALYTICS_EVENTS,
  ANALYTICS_EVENT_ATTRIBUTE,
  ANALYTICS_PROPERTIES_ATTRIBUTE,
  AnalyticsMarkupError,
  MAX_TRACKED_COMMAND_LENGTH,
  POSTHOG_INGEST_HOST,
  POSTHOG_LOADER_SCRIPT,
  POSTHOG_PROXY_PATH,
  POSTHOG_UI_HOST,
  analyticsAttributes,
  isAnalyticsEvent,
  parseAnalyticsAttributes,
  posthogApiHost,
  posthogConfig,
  siteEnvironment,
  terminalCommandProperties,
} from '@lib/analytics'
import { interpretCommand } from '@lib/terminalCommands'

describe('siteEnvironment', () => {
  it.each([
    ['charbelfayad.com', 'production'],
    ['deploy-preview-6--murfy.netlify.app', 'preview'],
    ['murfy.netlify.app', 'preview'],
    ['www.charbelfayad.com', 'preview'],
    ['localhost', 'local'],
    ['127.0.0.1', 'local'],
    ['[::1]', 'local'],
  ])('%s is %s', (hostname, expected) => {
    expect(siteEnvironment(hostname)).toBe(expected)
  })
})

describe('posthogApiHost', () => {
  it('uses the same-origin proxy only in production, where the custom domain serves it', () => {
    expect(posthogApiHost('production')).toBe(POSTHOG_PROXY_PATH)
    expect(posthogApiHost('preview'), 'netlify.app hosts break the proxy').toBe(POSTHOG_INGEST_HOST)
    expect(posthogApiHost('local')).toBe(POSTHOG_INGEST_HOST)
  })
})

describe('posthogConfig', () => {
  it('keeps visitor identity and turns on every browser capture', () => {
    const config = posthogConfig('production')
    expect(config).toMatchObject({
      api_host: POSTHOG_PROXY_PATH,
      ui_host: POSTHOG_UI_HOST,
      persistence: 'localStorage+cookie',
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
      session_recording: { maskAllInputs: false },
    })
    expect(
      config.cookieless_mode,
      'cookieless mode turns off session replay and strips the IP that location needs'
    ).toBeUndefined()
    expect(config.defaults, 'pinned to a release date, never "latest"').toMatch(
      /^\d{4}-\d{2}-\d{2}$/
    )
  })

  it('sends deploy previews straight to PostHog', () => {
    expect(posthogConfig('preview').api_host).toBe(POSTHOG_INGEST_HOST)
  })
})

describe('POSTHOG_LOADER_SCRIPT', () => {
  const runLoader = () => {
    // The snippet inserts the SDK before the first script on the page, as in a real <head>.
    document.body.append(document.createElement('script'))
    new Function(POSTHOG_LOADER_SCRIPT)()
  }

  it('defines a stub that loads nothing until init', () => {
    runLoader()
    expect(window.posthog).toBeDefined()
    expect(document.querySelectorAll('script[src]'), 'no SDK request before init').toHaveLength(0)
    delete window.posthog
  })

  it('on init, loads the SDK from api_host and queues calls until it arrives', () => {
    runLoader()
    const stub = window.posthog!
    stub.init('phc_test', { api_host: POSTHOG_PROXY_PATH })
    const sdk = document.querySelector<HTMLScriptElement>('script[src]')
    expect(sdk?.getAttribute('src')).toBe(`${POSTHOG_PROXY_PATH}/static/array.js`)
    expect(sdk?.async).toBe(true)

    stub.capture(ANALYTICS_EVENTS.TERMINAL_OPENED, {})
    const queue = stub as unknown as unknown[][]
    expect(queue.at(-1), 'the call waits in the stub queue').toEqual([
      'capture',
      ANALYTICS_EVENTS.TERMINAL_OPENED,
      {},
    ])
    delete window.posthog
  })
})

describe('isAnalyticsEvent', () => {
  it('accepts every declared event and nothing else', () => {
    for (const event of Object.values(ANALYTICS_EVENTS)) expect(isAnalyticsEvent(event)).toBe(true)
    for (const value of ['$pageview', 'Terminal_Opened', '', null, 42]) {
      expect(isAnalyticsEvent(value), String(value)).toBe(false)
    }
  })
})

describe('analyticsAttributes / parseAnalyticsAttributes', () => {
  it('round-trips an event and its properties through the markup attributes', () => {
    const properties = { project_id: 'nevo', placement: 'home', rank: 1, archived: false }
    const attributes = analyticsAttributes(ANALYTICS_EVENTS.PROJECT_LINK_CLICKED, properties)
    expect(attributes[ANALYTICS_EVENT_ATTRIBUTE]).toBe('project_link_clicked')
    expect(
      parseAnalyticsAttributes(
        attributes[ANALYTICS_EVENT_ATTRIBUTE],
        attributes[ANALYTICS_PROPERTIES_ATTRIBUTE]
      )
    ).toEqual({ event: ANALYTICS_EVENTS.PROJECT_LINK_CLICKED, properties })
  })

  it.each([
    ['an unknown event', 'clicked', '{}', /unknown event clicked/],
    ['a missing event', null, '{}', /unknown event null/],
    ['missing properties', 'paper_link_clicked', null, /has no properties/],
    ['an array', 'paper_link_clicked', '[1]', /not a flat object/],
    ['JSON null', 'paper_link_clicked', 'null', /not a flat object/],
    ['a nested value', 'paper_link_clicked', '{"a":{"b":1}}', /not a flat object/],
  ])('rejects %s', (_case, event, properties, message) => {
    expect(() => parseAnalyticsAttributes(event, properties)).toThrow(AnalyticsMarkupError)
    expect(() => parseAnalyticsAttributes(event, properties)).toThrow(message)
  })

  it('lets malformed JSON surface as the SyntaxError it is', () => {
    expect(() => parseAnalyticsAttributes('paper_link_clicked', '{oops')).toThrow(SyntaxError)
  })
})

describe('terminalCommandProperties', () => {
  const describeRun = (raw: string) => {
    const result = interpretCommand(raw, 'dark')
    if (result === null) throw new Error(`"${raw}" is blank and never tracked`)
    return terminalCommandProperties(raw, result)
  }

  it.each([
    ['help', { command: 'help', printed_error: false, action: 'none' }],
    ['  CAT About.md ', { command: 'cat about.md', printed_error: false, action: 'none' }],
    ['open resume', { command: 'open resume', printed_error: false, action: 'open' }],
    ['cd projects', { command: 'cd projects', printed_error: false, action: 'navigate' }],
    ['cd nowhere', { command: 'cd nowhere', printed_error: true, action: 'none' }],
    ['theme', { command: 'theme', printed_error: false, action: 'toggle-theme' }],
    ['exit', { command: 'exit', printed_error: false, action: 'exit' }],
    ['rm -rf ~', { command: 'rm -rf ~', printed_error: true, action: 'none' }],
  ])('"%s"', (raw, expected) => {
    expect(describeRun(raw)).toEqual(expected)
  })

  it(`cuts the command at ${MAX_TRACKED_COMMAND_LENGTH} characters`, () => {
    const { command } = describeRun(`echo ${'x'.repeat(500)}`)
    expect(String(command)).toHaveLength(MAX_TRACKED_COMMAND_LENGTH)
    expect(String(command).startsWith('echo xxx')).toBe(true)
  })
})
