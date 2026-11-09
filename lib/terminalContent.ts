import { ABOUT_PARAGRAPHS, CONTACT_LINKS, HEADLINE, NAME } from '@content/profile'
import { ARCHIVED_PROJECTS, FEATURED_PROJECTS } from '@content/projects'
import { PAPERS, paperUrl } from '@content/papers'

export interface OutputLine {
  id: number
  type: 'command' | 'output' | 'error' | 'ascii' | 'divider' | 'link' | 'heading'
  content: string
  href?: string
}

let lineIdCounter = 0
export const nextId = (): number => ++lineIdCounter

/** Column width the terminal wraps prose to, indent included. */
export const WRAP_WIDTH = 68
const INDENT = '  '
const NESTED_INDENT = '    '

export const TERMINAL_ROUTES: Record<string, string> = {
  home: '/',
  about: '/about',
  projects: '/projects',
  research: '/#research',
}

export function resolveRoute(directory: string): string | undefined {
  return TERMINAL_ROUTES[directory]
}

/** Greedy word wrap. A single word longer than the width stays on its own line. */
export function wrapText(text: string, width: number, indent: string): string[] {
  const lines: string[] = []
  let current = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = current === '' ? word : `${current} ${word}`
    if (current !== '' && indent.length + candidate.length > width) {
      lines.push(indent + current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current !== '') lines.push(indent + current)
  return lines
}

const output = (content: string): OutputLine => ({ id: nextId(), type: 'output', content })
const link = (content: string, href: string): OutputLine => ({
  id: nextId(),
  type: 'link',
  content,
  href,
})
const heading = (content: string): OutputLine => ({ id: nextId(), type: 'heading', content })
const blank = (): OutputLine => output('')

function fileHeader(fileName: string): OutputLine[] {
  return [
    { id: nextId(), type: 'divider', content: '' },
    heading(`${INDENT}# ${fileName}`),
    { id: nextId(), type: 'divider', content: '' },
    blank(),
  ]
}

const wrapped = (text: string, indent: string): OutputLine[] =>
  wrapText(text, WRAP_WIDTH, indent).map(output)

export const HELP_COMMANDS: Array<[string, string]> = [
  ['help', 'Show this help message'],
  ['cat about.md', 'About me'],
  ['cat projects.md', 'List all projects'],
  ['cat research.md', 'Research papers'],
  ['cat contact.md', 'Contact information'],
  ['cd <page>', `Go to ${Object.keys(TERMINAL_ROUTES).join(', ')}`],
  ['open resume', 'Open résumé (PDF)'],
  ['open github', 'Open GitHub profile'],
  ['theme', 'Toggle light/dark mode'],
  ['clear', 'Clear terminal'],
  ['exit', 'Return to normal view'],
]

const HELP_COLUMN = 20

export function buildHelp(): OutputLine[] {
  return [
    blank(),
    output(`${INDENT}Available commands:`),
    blank(),
    ...HELP_COMMANDS.map(([command, description]) =>
      output(`${INDENT}${command.padEnd(HELP_COLUMN)}${description}`)
    ),
    blank(),
    output(`${INDENT}Tip: Use ↑ ↓ to cycle through command history`),
    blank(),
  ]
}

export function buildAbout(): OutputLine[] {
  return [
    ...fileHeader('about.md'),
    output(`${INDENT}${NAME}`),
    output(`${INDENT}${HEADLINE}`),
    blank(),
    ...ABOUT_PARAGRAPHS.flatMap((paragraph) => [...wrapped(paragraph, INDENT), blank()]),
  ]
}

export function buildProjects(): OutputLine[] {
  const total = FEATURED_PROJECTS.length + ARCHIVED_PROJECTS.length
  const lines: OutputLine[] = [...fileHeader('projects.md'), output(`${INDENT}${total} projects`), blank()]

  FEATURED_PROJECTS.forEach((project, index) => {
    lines.push(output(`${INDENT}${String(index + 1).padStart(2, '0')}. ${project.title} (${project.year})`))
    lines.push(...wrapped(project.description, NESTED_INDENT))
    lines.push(output(`${NESTED_INDENT}[${project.stack.join(', ')}]`))
    if (project.link !== undefined) {
      lines.push(link(`${NESTED_INDENT}→ ${project.link}`, project.link))
    }
    lines.push(blank())
  })

  lines.push(heading(`${INDENT}Earlier`))
  ARCHIVED_PROJECTS.forEach((project) => {
    lines.push(output(`${INDENT}${project.title} [${project.stack.join(', ')}]`))
    lines.push(link(`${NESTED_INDENT}→ ${project.link}`, project.link))
  })
  lines.push(blank())
  return lines
}

export function buildResearch(): OutputLine[] {
  const lines: OutputLine[] = [
    ...fileHeader('research.md'),
    output(`${INDENT}${PAPERS.length} publications`),
    blank(),
  ]
  PAPERS.forEach((paper) => {
    lines.push(heading(`${INDENT}● ${paper.title}`))
    lines.push(output(`${NESTED_INDENT}${paper.venue}, ${paper.year}. Tags: ${paper.tags.join(', ')}`))
    lines.push(...wrapped(paper.abstract, NESTED_INDENT))
    lines.push(link(`${NESTED_INDENT}Paper → ${paperUrl(paper)}`, paperUrl(paper)))
    if (paper.githubLink !== undefined) {
      lines.push(link(`${NESTED_INDENT}Code  → ${paper.githubLink}`, paper.githubLink))
    }
    lines.push(blank())
  })
  return lines
}

const CONTACT_LABEL_COLUMN = 14

export function buildContact(): OutputLine[] {
  return [
    ...fileHeader('contact.md'),
    ...CONTACT_LINKS.map((contact) =>
      link(
        `${INDENT}${contact.label.padEnd(CONTACT_LABEL_COLUMN)}${contact.href.replace(/^mailto:|^https:\/\//, '')}`,
        contact.href
      )
    ),
    blank(),
  ]
}

export const LS_OUTPUT = ['about.md    projects.md    research.md', 'contact.md  resume.pdf']
