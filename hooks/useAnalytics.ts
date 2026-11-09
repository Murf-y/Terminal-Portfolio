import { event } from 'nextjs-google-analytics'

/* ═══════════════════════════════════════════
   Analytics helper — fires GA4 custom events
   for meaningful user interaction tracking.
   ═══════════════════════════════════════════ */

/** Track outbound link clicks (projects, social, resume) */
export function trackOutboundClick(label: string, url: string) {
  event('outbound_click', {
    category: 'engagement',
    label,
    link_url: url,
  })
}

/** Track project card clicks */
export function trackProjectClick(projectTitle: string, url: string) {
  event('project_click', {
    category: 'content',
    label: projectTitle,
    link_url: url,
  })
}

/** Track research paper clicks */
export function trackPaperClick(paperTitle: string, url: string) {
  event('paper_click', {
    category: 'content',
    label: paperTitle,
    link_url: url,
  })
}

/** Track resume downloads */
export function trackResumeOpen(source: string) {
  event('resume_open', {
    category: 'conversion',
    label: source,
  })
}

/** Track theme toggle */
export function trackThemeToggle(newTheme: string) {
  event('theme_toggle', {
    category: 'preference',
    label: newTheme,
  })
}

/** Track terminal mode open/close and commands */
export function trackTerminalOpen() {
  event('terminal_open', {
    category: 'feature',
    label: 'terminal_mode',
  })
}

export function trackTerminalCommand(command: string) {
  event('terminal_command', {
    category: 'feature',
    label: command,
  })
}

/** Track contact email click */
export function trackContactClick(source: string) {
  event('contact_click', {
    category: 'conversion',
    label: source,
  })
}

/** Track GitHub profile click */
export function trackSocialClick(platform: string, source: string) {
  event('social_click', {
    category: 'engagement',
    label: platform,
    source,
  })
}
