/* Microsoft Word does the PDF export: it lays the page out exactly as an editor would and embeds
   the fonts. Windows only, with Word and the Inter font installed. */
import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const EXPORTER = fileURLToPath(new URL('./export-pdf.ps1', import.meta.url))
const PAGES_LINE = /^pages: (\d+)$/m

export class PdfExportError extends Error {
  constructor(output: string) {
    super(`Word did not report a page count. Exporter output:\n${output}`)
    this.name = 'PdfExportError'
  }
}

/** Reads the "pages: N" line the exporter prints. */
export function parsePageCount(output: string): number {
  const match = PAGES_LINE.exec(output)
  if (match === null) throw new PdfExportError(output)
  return Number(match[1])
}

/** Saves docxPath as a PDF at pdfPath and returns its page count. */
export async function exportPdf(docxPath: string, pdfPath: string): Promise<number> {
  const { stdout } = await promisify(execFile)('powershell', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    EXPORTER,
    '-In',
    docxPath,
    '-Out',
    pdfPath,
  ])
  return parsePageCount(stdout)
}
