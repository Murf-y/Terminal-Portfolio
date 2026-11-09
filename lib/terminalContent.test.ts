import { describe, expect, it } from 'vitest'
import {
  type OutputLine,
  TERMINAL_ROUTES,
  WRAP_WIDTH,
  buildAbout,
  buildContact,
  buildHelp,
  buildProjects,
  buildResearch,
  resolveRoute,
  wrapText,
} from '@lib/terminalContent'
import { ABOUT_PARAGRAPHS, CONTACT_LINKS } from '@content/profile'
import { ARCHIVED_PROJECTS, FEATURED_PROJECTS } from '@content/projects'
import { PAPERS, paperUrl } from '@content/papers'

const text = (lines: OutputLine[]) => lines.map((line) => line.content).join('\n')
const hrefs = (lines: OutputLine[]) => lines.flatMap((l) => (l.type === 'link' ? [l.href] : []))

describe('wrapText', () => {
  it('keeps every line within the width, indent included', () => {
    const lines = wrapText(ABOUT_PARAGRAPHS[0], WRAP_WIDTH, '  ')
    for (const line of lines) {
      expect(line.length, `"${line}"`).toBeLessThanOrEqual(WRAP_WIDTH)
      expect(line.startsWith('  ')).toBe(true)
    }
  })

  it('loses no words', () => {
    const source = 'one two three four five six seven eight nine ten'
    const lines = wrapText(source, 12, '')
    expect(lines.join(' ')).toBe(source)
    expect(lines).toEqual(['one two', 'three four', 'five six', 'seven eight', 'nine ten'])
  })

  it('puts a word longer than the width on its own line instead of splitting it', () => {
    expect(wrapText('a supercalifragilistic b', 10, '')).toEqual(['a', 'supercalifragilistic', 'b'])
  })

  it('returns nothing for blank input', () => {
    expect(wrapText('   ', 20, '  ')).toEqual([])
  })
})

describe('resolveRoute', () => {
  it('maps research to the section on Home, since the page was removed', () => {
    expect(resolveRoute('research')).toBe('/#research')
  })

  it.each(Object.entries(TERMINAL_ROUTES))('cd %s -> %s', (name, route) => {
    expect(resolveRoute(name)).toBe(route)
  })

  it('returns undefined for unknown directories', () => {
    expect(resolveRoute('etc')).toBeUndefined()
    expect(resolveRoute('')).toBeUndefined()
  })

  it.each(['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf'])(
    'does not resolve the inherited object member "%s"',
    (name) => {
      expect(resolveRoute(name), `cd ${name}`).toBeUndefined()
    }
  )
})

describe('terminal files', () => {
  it('help lists cd targets and no longer mentions stack.md', () => {
    const lines = buildHelp().map((line) => line.content)
    expect(lines, 'the cd row, padded to the help column').toContain(
      '  cd <page>           Go to home, about, projects, research'
    )
    expect(text(buildHelp())).not.toContain('stack.md')
  })

  it('about.md prints every About paragraph word for word', () => {
    const about = text(buildAbout()).replace(/\s+/g, ' ')
    for (const paragraph of ABOUT_PARAGRAPHS) {
      expect(about).toContain(paragraph)
    }
    expect(about).not.toMatch(/NinjaCO|Ajjerni|80\+/)
  })

  it('projects.md lists every project and links each public one', () => {
    const lines = buildProjects()
    const body = text(lines)
    for (const project of [...FEATURED_PROJECTS, ...ARCHIVED_PROJECTS]) {
      expect(body, project.title).toContain(project.title)
    }
    const links = hrefs(lines)
    const publicLinks = [
      ...FEATURED_PROJECTS.flatMap((p) => (p.link ? [p.link] : [])),
      ...ARCHIVED_PROJECTS.map((p) => p.link),
    ]
    expect(links).toEqual(publicLinks)
  })

  it('research.md links each paper through its DOI', () => {
    const links = hrefs(buildResearch())
    for (const paper of PAPERS) {
      expect(links, paper.title).toContain(paperUrl(paper))
    }
  })

  it('contact.md links every contact channel', () => {
    expect(hrefs(buildContact())).toEqual(CONTACT_LINKS.map((link) => link.href))
  })
})
