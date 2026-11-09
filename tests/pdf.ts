/* Reads the facts a test needs straight from a PDF's bytes. Word writes the page tree, page boxes,
   font descriptors and link actions as plain (uncompressed) dictionaries, so no PDF library is
   needed. */

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
const FONT_NAME = /\/FontName\s*\/(?:[A-Z]{6}\+)?([^\s/<>[\]()]+)/
const FONT_FILE = /\/FontFile[23]?\b/
const LINK = /\/URI\s*\(([^)]*)\)/g

export function inspectPdf(bytes: Uint8Array): PdfFacts {
  const text = Buffer.from(bytes).toString('latin1')
  const pageTree = PAGE_TREE.exec(text)
  if (pageTree === null) throw new PdfInspectionError('page tree with a /Count')

  const fonts = new Map<string, boolean>()
  for (const [descriptor] of text.matchAll(FONT_DESCRIPTOR)) {
    const name = FONT_NAME.exec(descriptor)
    if (name === null) throw new PdfInspectionError(`/FontName in ${descriptor}`)
    fonts.set(name[1], (fonts.get(name[1]) ?? false) || FONT_FILE.test(descriptor))
  }

  return {
    pages: Number(pageTree[1]),
    mediaBoxes: [...text.matchAll(MEDIA_BOX)].map(([, box]) => box.trim().split(/\s+/).map(Number)),
    fonts: [...fonts].map(([name, embedded]) => ({ name, embedded })),
    links: [...new Set([...text.matchAll(LINK)].map(([, uri]) => uri))],
  }
}
