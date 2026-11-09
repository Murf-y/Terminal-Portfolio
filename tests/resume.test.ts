import { describe, expect, it } from 'vitest'
import type { Resume } from '../scripts/resume/content'
import { bulletLine, resumeLinks } from './resume'

const entry = (title: string, href?: string) => ({
  title,
  href,
  period: '2026',
  bullets: [
    'Plain bullet',
    { label: `${title} linked`, href: `https://example.com/${title}/bullet`, text: 'text' },
    { label: `${title} unlinked`, text: 'text' },
  ],
})

/** One of everything, so each section's links show up in order. */
const FIXTURE: Resume = {
  name: 'Name',
  headline: 'Headline',
  contacts: [{ label: 'City' }, { label: 'Site', href: 'https://example.com/' }],
  experience: [entry('job', 'https://example.com/job')],
  projects: [entry('project')],
  research: [entry('lab', 'https://example.com/lab')],
  publications: [
    { authors: 'A', title: 'Paper', href: 'https://doi.org/10.1/x', venue: 'Venue', year: 2025 },
  ],
  education: [entry('school')],
}

describe('bulletLine', () => {
  it('reads a plain bullet as its text', () => {
    expect(bulletLine('Plain bullet')).toBe('Plain bullet')
  })

  it('reads a labelled bullet as "Label: text", linked or not', () => {
    expect(bulletLine({ label: 'Founder', text: 'a club.' })).toBe('Founder: a club.')
    expect(bulletLine({ label: 'App', href: 'https://example.com/', text: 'an app.' })).toBe(
      'App: an app.'
    )
  })
})

describe('resumeLinks', () => {
  it('lists linked contacts, titles, bullet labels and papers in page order, skipping unlinked ones', () => {
    expect(resumeLinks(FIXTURE)).toEqual([
      { label: 'Site', href: 'https://example.com/' },
      { label: 'job', href: 'https://example.com/job' },
      { label: 'job linked', href: 'https://example.com/job/bullet' },
      { label: 'project linked', href: 'https://example.com/project/bullet' },
      { label: 'lab', href: 'https://example.com/lab' },
      { label: 'lab linked', href: 'https://example.com/lab/bullet' },
      { label: 'Paper', href: 'https://doi.org/10.1/x' },
      { label: 'school linked', href: 'https://example.com/school/bullet' },
    ])
  })
})
