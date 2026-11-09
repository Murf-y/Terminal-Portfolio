/* Microsoft Word does the PDF export: it lays the page out exactly as an editor would and embeds
   the fonts. Windows only, with Word and the Inter font installed. */
import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const EXPORTER = fileURLToPath(new URL('./export-pdf.ps1', import.meta.url))
const PAGES_LINE = /^pages: (\d+)$/m
/** A cold Word start takes seconds; a dialog Word could not suppress would otherwise hang forever. */
const EXPORT_TIMEOUT_MS = 90_000

export class PdfExportError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'PdfExportError'
  }
}

/** Reads the "pages: N" line the exporter prints. */
export function parsePageCount(output: string): number {
  const match = PAGES_LINE.exec(output)
  if (match === null) {
    throw new PdfExportError(`Word did not report a page count. Exporter output:\n${output}`)
  }
  return Number(match[1])
}

/** What PowerShell printed to stderr before it failed, when execFile captured it. */
function stderrOf(error: unknown): string {
  return error instanceof Error && 'stderr' in error && typeof error.stderr === 'string'
    ? error.stderr.trim()
    : ''
}

/** Saves docxPath as a PDF at pdfPath and returns its page count. */
export async function exportPdf(docxPath: string, pdfPath: string): Promise<number> {
  let stdout: string
  try {
    ;({ stdout } = await promisify(execFile)(
      'powershell',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        EXPORTER,
        '-In',
        docxPath,
        '-Out',
        pdfPath,
      ],
      { timeout: EXPORT_TIMEOUT_MS }
    ))
  } catch (error) {
    throw new PdfExportError(`Word could not export ${docxPath} to PDF.\n${stderrOf(error)}`, {
      cause: error,
    })
  }
  return parsePageCount(stdout)
}
