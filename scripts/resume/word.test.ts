import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { Packer } from 'docx'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { inspectPdf } from '../../tests/pdf.ts'
import { RESUME } from './content.ts'
import { buildResume } from './document.ts'
import { PdfExportError, exportPdf, parsePageCount } from './word.ts'

/** Word starts in a few seconds; a cold start on a busy machine can take far longer. */
const WORD_TIMEOUT_MS = 120_000
const HAS_WORD = process.platform === 'win32'

describe('parsePageCount', () => {
  it('reads the count from the exporter’s "pages: N" line', () => {
    expect(parsePageCount('pages: 1\r\n')).toBe(1)
  })

  it('finds the line among other output', () => {
    expect(parsePageCount('Loading Word...\r\npages: 12\r\ndone\r\n')).toBe(12)
  })

  it('throws PdfExportError carrying the output when there is no count', () => {
    expect(() => parsePageCount('Exception calling "SaveAs"')).toThrow(PdfExportError)
    expect(() => parsePageCount('Exception calling "SaveAs"')).toThrow(
      'Word did not report a page count. Exporter output:\nException calling "SaveAs"'
    )
  })

  it('rejects a count that is not a whole number on its own line', () => {
    expect(() => parsePageCount('pages: one')).toThrow(PdfExportError)
    expect(() => parsePageCount('total pages: 2 of 3')).toThrow(PdfExportError)
  })
})

describe.runIf(HAS_WORD)('exportPdf', () => {
  let workDir: string
  let docx: string
  beforeAll(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'resume-word-test-'))
    docx = join(workDir, 'resume.docx')
    await writeFile(docx, await Packer.toBuffer(buildResume(RESUME)))
  })
  afterAll(async () => {
    await rm(workDir, { recursive: true, force: true })
  })

  it(
    'saves the PDF and returns the page count Word reports',
    async () => {
      const pdf = join(workDir, 'resume.pdf')
      const pages = await exportPdf(docx, pdf)
      const facts = inspectPdf(await readFile(pdf))
      expect({ returned: pages, inPdf: facts.pages }).toEqual({ returned: 1, inPdf: 1 })
    },
    WORD_TIMEOUT_MS
  )

  it(
    'accepts relative paths and forward slashes, which Word rejects on its own',
    async () => {
      const toPosix = (path: string) => path.replaceAll('\\', '/')
      const pdf = join(workDir, 'relative.pdf')
      const pages = await exportPdf(toPosix(relative(process.cwd(), docx)), toPosix(pdf))
      expect(pages).toBe(1)
      expect(inspectPdf(await readFile(pdf)).pages).toBe(1)
    },
    WORD_TIMEOUT_MS
  )
})
