/* npm run resume: lays out scripts/resume/content.ts and writes public/data/resume.pdf.
   The PDF is replaced only if the layout still fits on one page. */
import { copyFile, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Packer } from 'docx'
import { RESUME, type Resume } from './content.ts'
import { buildResume } from './document.ts'
import { exportPdf } from './word.ts'

const OUTPUT = fileURLToPath(new URL('../../public/data/resume.pdf', import.meta.url))
export const MAX_PAGES = 1

export class ResumeOverflowError extends Error {
  constructor(pages: number, output: string) {
    super(
      `The résumé runs to ${pages} pages; the limit is ${MAX_PAGES}. ${output} was left unchanged.`
    )
    this.name = 'ResumeOverflowError'
  }
}

/** Exports resume to a PDF at output and returns its page count. Leaves output untouched, and
    throws ResumeOverflowError, when the layout runs past MAX_PAGES. */
export async function publishResume(resume: Resume, output: string): Promise<number> {
  const workDir = await mkdtemp(join(tmpdir(), 'resume-'))
  try {
    const docx = join(workDir, 'resume.docx')
    const pdf = join(workDir, 'resume.pdf')
    await writeFile(docx, await Packer.toBuffer(buildResume(resume)))
    const pages = await exportPdf(docx, pdf)
    if (pages > MAX_PAGES) throw new ResumeOverflowError(pages, output)
    await copyFile(pdf, output)
    return pages
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}

if (import.meta.main) {
  const pages = await publishResume(RESUME, OUTPUT)
  console.log(`Wrote ${OUTPUT} (${pages} page).`)
}
