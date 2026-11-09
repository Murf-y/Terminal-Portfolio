import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { inspectPdf } from '../../tests/pdf.ts'
import { resumeLinks } from '../../tests/resume.ts'
import { MAX_PAGES, ResumeOverflowError, publishResume } from './build.ts'
import { RESUME, type Resume } from './content.ts'
import { FONT } from './document.ts'

const WORD_TIMEOUT_MS = 120_000
const HAS_WORD = process.platform === 'win32'
const COMMITTED_PDF = new URL('../../public/data/resume.pdf', import.meta.url)
/** A4 is 595.28 × 841.89 pt; Word rounds the box to twentieths of a point. */
const A4_POINTS = { width: 595.28, height: 841.89 }
const BOX_TOLERANCE_PT = 0.1
const INTER_STYLES = ['Regular', 'Bold', 'Italic']
/** Word sets the spaces after list bullets in Arial; they draw nothing. */
const WORD_LIST_SPACE_FONT = 'ArialMT'
/** The same content repeated until it cannot fit on one page. */
const OVERFLOW_COPIES = 3

/** Word normalizes link targets the way URL does, adding a slash to a bare host. */
const asPdfLink = (href: string) => new URL(href).href

function expectOnePageA4InInter(pdf: Uint8Array) {
  const facts = inspectPdf(pdf)
  expect(facts.pages).toBe(MAX_PAGES)
  for (const [x0, y0, x1, y1] of facts.mediaBoxes) {
    expect(Math.abs(x1 - x0 - A4_POINTS.width)).toBeLessThan(BOX_TOLERANCE_PT)
    expect(Math.abs(y1 - y0 - A4_POINTS.height)).toBeLessThan(BOX_TOLERANCE_PT)
  }
  expect(facts.fonts.filter((font) => !font.embedded)).toEqual([])
  const families = new Set(facts.fonts.map((font) => font.name))
  expect(families).toEqual(
    new Set([...INTER_STYLES.map((style) => `${FONT}-${style}`), WORD_LIST_SPACE_FONT])
  )
  return facts
}

describe('public/data/resume.pdf', () => {
  it('is one A4 page set in embedded Inter, linking exactly what content.ts links', async () => {
    const facts = expectOnePageA4InInter(await readFile(COMMITTED_PDF))
    expect(new Set(facts.links)).toEqual(
      new Set(resumeLinks(RESUME).map((link) => asPdfLink(link.href)))
    )
  })
})

describe.runIf(HAS_WORD)('publishResume', () => {
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
      expectOnePageA4InInter(await readFile(output))
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
      await expect(publishing).rejects.toThrow(`was left unchanged`)
      expect(await readFile(output, 'utf8')).toBe(existing)
    },
    WORD_TIMEOUT_MS
  )
})
