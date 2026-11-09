import { describe, expect, it } from 'vitest'
import { PdfInspectionError, inspectPdf } from './pdf.ts'

/** UTF-16BE with a byte order mark, as Word writes document info text. */
const utf16Literal = (text: string) =>
  '\xFE\xFF' + Buffer.from(text, 'utf16le').swap16().toString('latin1')

/** The shape Word writes: catalog, page tree, pages, fonts, link annotations and document info. */
const WORD_LIKE_PDF = [
  '%PDF-1.7',
  '1 0 obj',
  '<</Type/Catalog/Pages 2 0 R/Lang(en) >>',
  '2 0 obj',
  '<</Type/Pages/Count 2/Kids[ 3 0 R 4 0 R] >>',
  '3 0 obj',
  '<</Type/Page/Parent 2 0 R/MediaBox[ 0 0 595.32 841.92] >>',
  '4 0 obj',
  '<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>',
  '5 0 obj',
  '<</Type/Font/Subtype/Type0/BaseFont/BCDEEE+Inter-Bold/DescendantFonts 6 0 R>>',
  '7 0 obj',
  '<</Type/FontDescriptor/FontName/BCDEEE+Inter-Bold/Flags 32/FontFile2 8 0 R>>',
  '9 0 obj',
  '<</Type/FontDescriptor/FontName/BCDFEE+Inter-Regular/Flags 32/FontFile2 10 0 R>>',
  '11 0 obj',
  '<</Type/FontDescriptor/FontName/BCDGEE+Inter-Regular/Flags 32/FontFile2 12 0 R>>',
  '13 0 obj',
  '<</Type/FontDescriptor/FontName/Calibri/Flags 32>>',
  '14 0 obj',
  '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
  '15 0 obj',
  '<</Type/Annot/Subtype/Link/A<</S/URI/URI(https://example.com/)>> >>',
  '16 0 obj',
  '<</Type/Annot/Subtype/Link/A<</S/URI/URI(https://doi.org/10.1/x\\(1\\))>> >>',
  '17 0 obj',
  '<</Type/Annot/Subtype/Link/A<</S/URI/URI(https://doi.org/10.1/x\\(1\\))>> >>',
  '18 0 obj',
  `<</Title(${utf16Literal('Charbel Fayad — Résumé')})/Keywords(${utf16Literal('3f2a9c')})>>`,
].join('\n')

const bytes = (text: string) => Buffer.from(text, 'latin1')

describe('inspectPdf', () => {
  const facts = inspectPdf(bytes(WORD_LIKE_PDF))

  it('reads the page count from the page tree, not by counting page objects', () => {
    expect(facts.pages).toBe(2)
  })

  it('reads every page’s media box as numbers', () => {
    expect(facts.mediaBoxes).toEqual([
      [0, 0, 595.32, 841.92],
      [0, 0, 612, 792],
    ])
  })

  it('names each font once, without the subset prefix, and says whether it is embedded', () => {
    expect(facts.fonts).toEqual([
      { name: 'Inter-Bold', embedded: true },
      { name: 'Inter-Regular', embedded: true },
      { name: 'Calibri', embedded: false },
      { name: 'Helvetica', embedded: false },
    ])
  })

  it('lists each link target once, in order of first appearance, with escapes decoded', () => {
    expect(facts.links).toEqual(['https://example.com/', 'https://doi.org/10.1/x(1)'])
  })

  it('decodes UTF-16 keywords', () => {
    expect(facts.keywords).toBe('3f2a9c')
  })

  it('decodes plain keywords with octal and named escapes', () => {
    const plain = inspectPdf(bytes('<</Type/Pages/Count 1>>\n<</Keywords(a\\051b\\nc\\\\d)>>'))
    expect(plain.keywords).toBe('a)b\nc\\d')
  })

  it('reports no keywords when the document info has none', () => {
    expect(inspectPdf(bytes('<</Type/Pages/Count 1>>')).keywords).toBeUndefined()
  })

  it('throws PdfInspectionError when there is no page tree', () => {
    expect(() => inspectPdf(bytes('%PDF-1.7\n<</Type/Catalog>>'))).toThrow(PdfInspectionError)
    expect(() => inspectPdf(bytes('%PDF-1.7\n<</Type/Catalog>>'))).toThrow(
      'The PDF has no page tree with a /Count'
    )
  })

  it('throws PdfInspectionError for a font descriptor without a name', () => {
    const nameless = WORD_LIKE_PDF.replace('/FontName/Calibri', '')
    expect(() => inspectPdf(bytes(nameless))).toThrow(PdfInspectionError)
  })
})
