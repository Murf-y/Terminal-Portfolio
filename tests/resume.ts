/* Helpers the résumé tests share: what the content links and says, and whether Word can run. */
import { spawnSync } from 'node:child_process'
import type { Bullet, Entry, Resume } from '../scripts/resume/content'

/** `reg query` exits 0 when the key exists. */
const REG_KEY_FOUND = 0
/** Word registers this COM class when it is installed. */
const WORD_COM_KEY = String.raw`HKCR\Word.Application`

/** True on Windows with Word installed, the only place the PDF export can run. */
export const WORD_INSTALLED =
  process.platform === 'win32' &&
  spawnSync('reg', ['query', WORD_COM_KEY], { stdio: 'ignore' }).status === REG_KEY_FOUND

/** Word starts in a few seconds; a cold start on a busy machine can take far longer. */
export const WORD_TIMEOUT_MS = 120_000

export interface ResumeLink {
  label: string
  href: string
}

/** A bullet as its paragraph reads: the text, or "Label: text". */
export function bulletLine(bullet: Bullet): string {
  return typeof bullet === 'string' ? bullet : `${bullet.label}: ${bullet.text}`
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
