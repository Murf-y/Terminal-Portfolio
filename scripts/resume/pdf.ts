/* Reads facts straight from a PDF's bytes. Word writes the page tree, page boxes, fonts, link
   actions and document info as plain (uncompressed) dictionaries, so no PDF library is needed. */

export interface PdfFont {
  /** The font's PostScript name without the subset prefix, such as "Inter-Bold". */
  name: string
  embedded: boolean
}

export interface PdfFacts {
  pages: number
  /** Each page's [x0, y0, x1, y1] in points. */
  mediaBoxes: number[][]
  fonts: PdfFont[]
  /** Link targets in order of first appearance. */
  links: string[]
  /** The document info's Keywords, or undefined when there are none. */
  keywords: string | undefined
}

export class PdfInspectionError extends Error {
  constructor(missing: string) {
    super(`The PDF has no ${missing}`)
    this.name = 'PdfInspectionError'
  }
}

const PAGE_TREE = /\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)/
const MEDIA_BOX = /\/MediaBox\s*\[([^\]]*)\]/g
const FONT_DESCRIPTOR = /<<[^<>]*\/Type\s*\/FontDescriptor[^<>]*>>/g
/** Subset fonts carry a six-letter tag, such as "BCDEEE+Inter-Bold". */
const FONT_NAME = /\/FontName\s*\/(?:[A-Z]{6}\+)?([^\s/<>[\]()]+)/
const BASE_FONT = /\/BaseFont\s*\/(?:[A-Z]{6}\+)?([^\s/<>[\]()]+)/g
const FONT_FILE = /\/FontFile[23]?\b/
/** A literal string: parentheses with backslash escapes inside. */
const LITERAL = String.raw`\(((?:\\[\s\S]|[^\\)])*)\)`
const LINK = new RegExp(String.raw`/URI\s*` + LITERAL, 'g')
const KEYWORDS = new RegExp(String.raw`/Keywords\s*` + LITERAL)
const ESCAPE = /\\([0-7]{1,3}|[\s\S])/g
const ESCAPED_CHARACTERS: Record<string, string> = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' }
const OCTAL = 8
/** PDF text strings in UTF-16 start with a big-endian byte order mark. */
const UTF16_BOM = '\xFE\xFF'

/** Decodes a literal string's escapes, then its UTF-16 text when it has a byte order mark. */
function decodeLiteral(raw: string): string {
  const bytes = raw.replace(ESCAPE, (_, escaped: string) =>
    /^[0-7]/.test(escaped)
      ? String.fromCharCode(parseInt(escaped, OCTAL))
      : (ESCAPED_CHARACTERS[escaped] ?? escaped)
  )
  if (!bytes.startsWith(UTF16_BOM)) return bytes
  return Buffer.from(bytes.slice(UTF16_BOM.length), 'latin1').swap16().toString('utf16le')
}

function readFonts(text: string): PdfFont[] {
  const fonts = new Map<string, boolean>()
  for (const [descriptor] of text.matchAll(FONT_DESCRIPTOR)) {
    const name = FONT_NAME.exec(descriptor)
    if (name === null) throw new PdfInspectionError(`/FontName in ${descriptor}`)
    fonts.set(name[1], (fonts.get(name[1]) ?? false) || FONT_FILE.test(descriptor))
  }
  // Standard fonts such as Helvetica have no descriptor, so they are never embedded.
  for (const [, name] of text.matchAll(BASE_FONT)) {
    if (!fonts.has(name)) fonts.set(name, false)
  }
  return [...fonts].map(([name, embedded]) => ({ name, embedded }))
}

export function inspectPdf(bytes: Uint8Array): PdfFacts {
  const text = Buffer.from(bytes).toString('latin1')
  const pageTree = PAGE_TREE.exec(text)
  if (pageTree === null) throw new PdfInspectionError('page tree with a /Count')
  const keywords = KEYWORDS.exec(text)
  return {
    pages: Number(pageTree[1]),
    mediaBoxes: [...text.matchAll(MEDIA_BOX)].map(([, box]) => box.trim().split(/\s+/).map(Number)),
    fonts: readFonts(text),
    links: [...new Set([...text.matchAll(LINK)].map(([, uri]) => decodeLiteral(uri)))],
    keywords: keywords === null ? undefined : decodeLiteral(keywords[1]),
  }
}
