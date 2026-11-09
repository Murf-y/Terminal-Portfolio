import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { WORD_INSTALLED, WORD_TIMEOUT_MS, resumeLinks } from '../../tests/resume.ts'
import {
  MAX_PAGES,
  RESUME_PDF,
  ResumeFontError,
  ResumeOverflowError,
  WORD_LIST_SPACE_FONT,
  publishResume,
  unexpectedFonts,
} from './build.ts'
import { RESUME, type Resume } from './content.ts'
import { FONT, contentFingerprint } from './document.ts'
import { inspectPdf, type PdfFont } from './pdf.ts'

/** A4 is 595.28 × 841.89 pt; Word rounds the box to twentieths of a point. */
const A4_POINTS = { width: 595.28, height: 841.89 }
const BOX_TOLERANCE_PT = 0.1
const INTER_STYLES = ['Regular', 'Bold', 'Italic']
/** The same content repeated until it cannot fit on one page. */
const OVERFLOW_COPIES = 3
const STALE_HINT = 'public/data/resume.pdf is stale: run npm run resume'

/** Word normalizes link targets the way URL does, adding a slash to a bare host. */
const asPdfLink = (href: string) => new URL(href).href

function expectOnePageA4InInter(pdf: Uint8Array) {
  const facts = inspectPdf(pdf)
  expect(facts.pages).toBe(MAX_PAGES)
  expect(facts.mediaBoxes).toHaveLength(facts.pages)
  for (const [x0, y0, x1, y1] of facts.mediaBoxes) {
    expect(Math.abs(x1 - x0 - A4_POINTS.width)).toBeLessThan(BOX_TOLERANCE_PT)
    expect(Math.abs(y1 - y0 - A4_POINTS.height)).toBeLessThan(BOX_TOLERANCE_PT)
  }
  expect(unexpectedFonts(facts.fonts)).toEqual([])
  expect(new Set(facts.fonts.map((font) => font.name))).toEqual(
    new Set([...INTER_STYLES.map((style) => `${FONT}-${style}`), WORD_LIST_SPACE_FONT])
  )
  return facts
}

describe('public/data/resume.pdf', () => {
  it('is one A4 page set in embedded Inter, linking exactly what content.ts links', async () => {
    const facts = expectOnePageA4InInter(await readFile(RESUME_PDF))
    expect(new Set(facts.links)).toEqual(
      new Set(resumeLinks(RESUME).map((link) => asPdfLink(link.href)))
    )
  })

  it('was built from the current content.ts', async () => {
    const facts = inspectPdf(await readFile(RESUME_PDF))
    expect(facts.keywords, STALE_HINT).toBe(contentFingerprint(RESUME))
  })
})

describe('unexpectedFonts', () => {
  const embedded = (name: string): PdfFont => ({ name, embedded: true })

  it('accepts embedded Inter styles and Word’s list-space Arial', () => {
    const fonts = [embedded('Inter-Regular'), embedded('Inter-Bold'), embedded('ArialMT')]
    expect(unexpectedFonts(fonts)).toEqual([])
  })

  it('flags the fonts Word falls back to when Inter is missing', () => {
    const fonts = [embedded('Inter-Bold'), embedded('Calibri'), embedded('Interstate-Regular')]
    expect(unexpectedFonts(fonts)).toEqual([embedded('Calibri'), embedded('Interstate-Regular')])
  })

  it('flags Inter when it is not embedded', () => {
    const notEmbedded = { name: 'Inter-Regular', embedded: false }
    expect(unexpectedFonts([notEmbedded])).toEqual([notEmbedded])
  })
})

describe('ResumeFontError', () => {
  it('names each wrong font, marks the ones not embedded, and says the output was kept', () => {
    const error = new ResumeFontError(
      [
        { name: 'Calibri', embedded: true },
        { name: 'Helvetica', embedded: false },
      ],
      'out.pdf'
    )
    expect(error.name).toBe('ResumeFontError')
    expect(error.message).toBe(
      'Word set the résumé in Calibri, Helvetica (not embedded) instead of an embedded Inter; ' +
        'install Inter (see README). out.pdf was left unchanged.'
    )
  })
})

describe.runIf(WORD_INSTALLED)('publishResume', () => {
  let workDir: string
  beforeAll(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'resume-build-test-'))
  })
  afterAll(async () => {
    await rm(workDir, { recursive: true, force: true })
  })

  it(
    'writes the one-page PDF to the output and returns its page count',
    async () => {
      const output = join(workDir, 'resume.pdf')
      expect(await publishResume(RESUME, output)).toBe(MAX_PAGES)
      const facts = expectOnePageA4InInter(await readFile(output))
      expect(facts.keywords).toBe(contentFingerprint(RESUME))
    },
    WORD_TIMEOUT_MS
  )

  it(
    'throws ResumeOverflowError and leaves the output untouched when the layout overflows',
    async () => {
      const output = join(workDir, 'existing.pdf')
      const existing = 'the previous résumé'
      await writeFile(output, existing)
      const overflowing: Resume = {
        ...RESUME,
        experience: Array.from({ length: OVERFLOW_COPIES }, () => RESUME.experience).flat(),
      }
      const publishing = publishResume(overflowing, output)
      await expect(publishing).rejects.toThrow(ResumeOverflowError)
      await expect(publishing).rejects.toThrow('was left unchanged')
      expect(await readFile(output, 'utf8')).toBe(existing)
    },
    WORD_TIMEOUT_MS
  )
})
