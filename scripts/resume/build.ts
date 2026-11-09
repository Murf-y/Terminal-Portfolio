/* npm run resume: lays out scripts/resume/content.ts and writes public/data/resume.pdf.
   The PDF is replaced only if it still fits on one page and Word set it in Inter. */
import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Packer } from 'docx'
import { RESUME_PATH } from '../../content/profile.ts'
import { RESUME, type Resume } from './content.ts'
import { FONT, buildResume } from './document.ts'
import { inspectPdf, type PdfFont } from './pdf.ts'
import { exportPdf } from './word.ts'

/** Where the site serves the résumé from. */
export const RESUME_PDF = fileURLToPath(new URL(`../../public${RESUME_PATH}`, import.meta.url))
export const MAX_PAGES = 1
/** Word sets the spaces after list bullets in Arial; they draw nothing. */
export const WORD_LIST_SPACE_FONT = 'ArialMT'

export class ResumeOverflowError extends Error {
  constructor(pages: number, output: string) {
    super(
      `The résumé runs to ${pages} pages; the limit is ${MAX_PAGES}. ${output} was left unchanged.`
    )
    this.name = 'ResumeOverflowError'
  }
}

export class ResumeFontError extends Error {
  constructor(fonts: PdfFont[], output: string) {
    const listed = fonts.map((font) => `${font.name}${font.embedded ? '' : ' (not embedded)'}`)
    super(
      `Word set the résumé in ${listed.join(', ')} instead of an embedded ${FONT}; install ${FONT} ` +
        `(see README). ${output} was left unchanged.`
    )
    this.name = 'ResumeFontError'
  }
}

/** Fonts other than embedded Inter, which Word falls back to when Inter is not installed. */
export function unexpectedFonts(fonts: PdfFont[]): PdfFont[] {
  return fonts.filter(
    (font) =>
      !font.embedded || !(font.name.startsWith(`${FONT}-`) || font.name === WORD_LIST_SPACE_FONT)
  )
}

/** Exports resume to a PDF at output and returns its page count. Leaves output untouched, and
    throws, when the layout runs past MAX_PAGES or Word did not use Inter. */
export async function publishResume(resume: Resume, output: string): Promise<number> {
  const workDir = await mkdtemp(join(tmpdir(), 'resume-'))
  try {
    const docx = join(workDir, 'resume.docx')
    const pdf = join(workDir, 'resume.pdf')
    await writeFile(docx, await Packer.toBuffer(buildResume(resume)))
    const pages = await exportPdf(docx, pdf)
    if (pages > MAX_PAGES) throw new ResumeOverflowError(pages, output)
    const wrongFonts = unexpectedFonts(inspectPdf(await readFile(pdf)).fonts)
    if (wrongFonts.length > 0) throw new ResumeFontError(wrongFonts, output)
    await copyFile(pdf, output)
    return pages
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}

if (import.meta.main) {
  const pages = await publishResume(RESUME, RESUME_PDF)
  console.log(`Wrote ${RESUME_PDF} (${pages} page).`)
}
