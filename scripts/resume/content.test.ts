import { describe, expect, it } from 'vitest'
import { PAPERS, paperUrl } from '../../content/papers.ts'
import { LINKS, SITE_URL } from '../../content/profile.ts'
import { FEATURED_PROJECTS } from '../../content/projects.ts'
import {
  RESUME,
  UnknownProjectError,
  formatAuthors,
  projectById,
  yearSpan,
  type Bullet,
} from './content.ts'

const SASE_ID = 'sase'
const APP_IDS = ['bishara', 'muleprep', 'petale', 'rukhsa', 'socrat']

const bulletText = (bullet: Bullet) =>
  typeof bullet === 'string' ? bullet : `${bullet.label}: ${bullet.text}`

describe('projectById', () => {
  it('returns the featured project with that id', () => {
    const project = projectById('bishara')
    expect(project).toBe(FEATURED_PROJECTS.find((candidate) => candidate.id === 'bishara'))
    expect(project.title).toBe('Bishara')
  })

  it('throws UnknownProjectError naming the missing id', () => {
    expect(() => projectById('no-such-project')).toThrow(UnknownProjectError)
    expect(() => projectById('no-such-project')).toThrow(
      'No featured project with id "no-such-project" in content/projects.ts'
    )
  })
})

describe('formatAuthors', () => {
  it('prints a single author as is', () => {
    expect(formatAuthors(['Fayad, C.'])).toBe('Fayad, C.')
  })

  it('joins two authors with a comma and an ampersand, as APA does', () => {
    expect(formatAuthors(['Hoblos, Y.', 'Fayad, C.'])).toBe('Hoblos, Y., & Fayad, C.')
  })

  it('puts the ampersand only before the last of three or more authors', () => {
    expect(formatAuthors(['Fayad, C.', 'Eid, C.', 'Hoblos, Y.'])).toBe(
      'Fayad, C., Eid, C., & Hoblos, Y.'
    )
  })
})

describe('yearSpan', () => {
  it('prints one year when every year is the same', () => {
    expect(yearSpan([2026])).toBe('2026')
    expect(yearSpan([2025, 2025])).toBe('2025')
  })

  it('spans the earliest to the latest year, in any input order', () => {
    expect(yearSpan([2026, 2024, 2025])).toBe('2024 – 2026')
  })
})

describe('RESUME', () => {
  it('links every contact from content/profile.ts, with the bare address as the email label', () => {
    expect(RESUME.contacts).toEqual([
      { label: 'Byblos, Lebanon' },
      { label: '+961 70 353 574' },
      { label: 'charbelfayad64@gmail.com', href: LINKS.email },
      { label: 'charbelfayad.com', href: SITE_URL },
      { label: 'LinkedIn', href: LINKS.linkedin },
      { label: 'GitHub', href: LINKS.github },
      { label: 'ORCID', href: LINKS.orcid },
    ])
  })

  it('cites every paper, newest first, with APA authors and a doi.org link', () => {
    expect(RESUME.publications).toEqual(
      PAPERS.map((paper) => ({
        authors: formatAuthors(paper.authors),
        title: paper.title,
        href: paperUrl(paper),
        venue: paper.venue,
        year: paper.year,
      }))
    )
    expect(RESUME.publications.map((citation) => citation.href)).toEqual([
      'https://doi.org/10.22541/au.177187903.32641814/v1',
      'https://doi.org/10.36227/techrxiv.176240389.96859753/v1',
      'https://doi.org/10.31224/5690',
    ])
  })

  it('takes the SASE entry’s name, year and stack from its project', () => {
    const project = projectById(SASE_ID)
    const [sase] = RESUME.projects
    expect(sase).toMatchObject({
      title: project.title,
      href: project.link,
      period: String(project.year),
      note: project.stack.join(' · '),
    })
    expect(sase.bullets).toHaveLength(3)
  })

  it('never calls the SASE project private or ties it to a founder', () => {
    const [sase] = RESUME.projects
    const text = [sase.title, sase.note ?? '', ...sase.bullets.map(bulletText)].join('\n')
    expect(text).not.toMatch(/private|founder/i)
  })

  it('names and links each app from its project, and spans the earlier work through the latest app', () => {
    const apps = RESUME.projects[1]
    const projects = APP_IDS.map(projectById)
    expect(apps.title).toBe('Apps')
    expect(apps.period).toBe('2022 – 2026')
    expect(apps.bullets.slice(0, APP_IDS.length)).toEqual(
      projects.map((project) => ({
        label: project.title,
        href: project.link,
        text: expect.any(String),
      }))
    )
    expect(apps.bullets.at(-1)).toMatchObject({ label: 'Earlier' })
  })

  it('lists the degree first under education, then the activities at the school', () => {
    const [school] = RESUME.education
    expect(school.title).toBe('Lebanese American University')
    expect(school.bullets.map(bulletText)).toEqual([
      'BS Computer Science, Honors Program. CGPA 3.97, Major GPA 4.0, High Distinction.',
      'Founder: Software Engineering Club (workshops and technical seminars) and Computer Science Club.',
      'Lab Instructor: Operating Systems and Computer Programming labs.',
    ])
  })
})
