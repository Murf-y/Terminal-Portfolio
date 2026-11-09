import { describe, expect, it } from 'vitest'
import { PdfInspectionError, inspectPdf } from './pdf'

/** The shape Word writes: catalog, page tree, a page, font descriptors and link annotations. */
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
  '<</Type/FontDescriptor/FontName/BCDEEE+Inter-Bold/Flags 32/FontFile2 6 0 R>>',
  '7 0 obj',
  '<</Type/FontDescriptor/FontName/BCDFEE+Inter-Regular/Flags 32/FontFile2 8 0 R>>',
  '9 0 obj',
  '<</Type/FontDescriptor/FontName/BCDGEE+Inter-Regular/Flags 32/FontFile2 10 0 R>>',
  '11 0 obj',
  '<</Type/FontDescriptor/FontName/Helvetica/Flags 32>>',
  '12 0 obj',
  '<</Type/Annot/Subtype/Link/A<</S/URI/URI(https://example.com/)>> >>',
  '13 0 obj',
  '<</Type/Annot/Subtype/Link/A<</S/URI/URI(https://doi.org/10.1/x)>> >>',
  '14 0 obj',
  '<</Type/Annot/Subtype/Link/A<</S/URI/URI(https://doi.org/10.1/x)>> >>',
].join('\n')

const bytes = (text: string) => new TextEncoder().encode(text)

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
      { name: 'Helvetica', embedded: false },
    ])
  })

  it('lists each link target once, in order of first appearance', () => {
    expect(facts.links).toEqual(['https://example.com/', 'https://doi.org/10.1/x'])
  })

  it('throws PdfInspectionError when there is no page tree', () => {
    expect(() => inspectPdf(bytes('%PDF-1.7\n<</Type/Catalog>>'))).toThrow(PdfInspectionError)
    expect(() => inspectPdf(bytes('%PDF-1.7\n<</Type/Catalog>>'))).toThrow(
      'The PDF has no page tree with a /Count'
    )
  })

  it('throws PdfInspectionError for a font descriptor without a name', () => {
    const nameless = WORD_LIKE_PDF.replace('/FontName/Helvetica', '')
    expect(() => inspectPdf(bytes(nameless))).toThrow(PdfInspectionError)
  })
})
