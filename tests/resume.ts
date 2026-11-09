/* Facts about a résumé's content that more than one test checks the output against. */
import type { Entry, Resume } from '../scripts/resume/content'

export interface ResumeLink {
  label: string
  href: string
}

function entryLinks(entry: Entry): ResumeLink[] {
  return [
    ...(entry.href === undefined ? [] : [{ label: entry.title, href: entry.href }]),
    ...entry.bullets.flatMap((bullet) =>
      typeof bullet !== 'string' && bullet.href !== undefined
        ? [{ label: bullet.label, href: bullet.href }]
        : []
    ),
  ]
}

/** Every linked label, in the order the page shows them. */
export function resumeLinks(resume: Resume): ResumeLink[] {
  return [
    ...resume.contacts.flatMap((contact) =>
      contact.href === undefined ? [] : [{ label: contact.label, href: contact.href }]
    ),
    ...resume.experience.flatMap(entryLinks),
    ...resume.projects.flatMap(entryLinks),
    ...resume.research.flatMap(entryLinks),
    ...resume.publications.map((citation) => ({ label: citation.title, href: citation.href })),
    ...resume.education.flatMap(entryLinks),
  ]
}
