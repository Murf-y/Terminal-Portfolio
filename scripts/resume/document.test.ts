import { Packer } from 'docx'
import JSZip from 'jszip'
import { beforeAll, describe, expect, it } from 'vitest'
import { bulletLine, resumeLinks } from '../../tests/resume.ts'
import { RESUME, type Citation, type Entry } from './content.ts'
import { FONT, buildResume, contentFingerprint } from './document.ts'

const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
const RELATIONSHIP_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const PACKAGE_RELATIONSHIP_NS = 'http://schemas.openxmlformats.org/package/2006/relationships'
const CORE_PROPERTIES_NS = 'http://schemas.openxmlformats.org/package/2006/metadata/core-properties'
const HEX_FINGERPRINT = /^[0-9a-f]{16}$/

/** Word's own A4 size, in twentieths of a point. */
const A4_TWIPS = { width: '11906', height: '16838' }
const SECTION_TITLES = ['Experience', 'Projects', 'Research', 'Education']
const PUBLICATIONS_TITLE = 'Publications'
const CONTACT_SEPARATOR = '  ·  '

interface Parts {
  document: XMLDocument
  styles: XMLDocument
  numbering: XMLDocument
  relationships: XMLDocument
  core: XMLDocument
}

async function unpack(): Promise<Parts> {
  const zip = await JSZip.loadAsync(await Packer.toBuffer(buildResume(RESUME)))
  const part = async (path: string) => {
    const file = zip.file(path)
    if (file === null) throw new Error(`The .docx has no ${path}`)
    return new DOMParser().parseFromString(await file.async('string'), 'application/xml')
  }
  return {
    document: await part('word/document.xml'),
    styles: await part('word/styles.xml'),
    numbering: await part('word/numbering.xml'),
    relationships: await part('word/_rels/document.xml.rels'),
    core: await part('docProps/core.xml'),
  }
}

const elements = (root: Document | Element, name: string) => [
  ...root.getElementsByTagNameNS(WORD_NS, name),
]
const attribute = (element: Element, name: string) => element.getAttributeNS(WORD_NS, name)
const textOf = (element: Element) =>
  elements(element, 't')
    .map((text) => text.textContent)
    .join('')
const paragraphs = (parts: Parts) => elements(parts.document, 'p')

/** Each run's text with its color, for checking what is muted. */
const runColors = (parts: Parts) =>
  elements(parts.document, 'r').map((run) => ({
    text: textOf(run),
    color: attribute(elements(run, 'color')[0], 'val'),
  }))

const entryLines = (entry: Entry) => [
  `${entry.title}${entry.context === undefined ? '' : `, ${entry.context}`}\t${entry.period}`,
  ...(entry.note === undefined ? [] : [entry.note]),
  ...entry.bullets.map(bulletLine),
]

const citationLine = (citation: Citation) =>
  `${citation.authors} (${citation.year}). ${citation.title}. ${citation.venue}.`

describe('buildResume', () => {
  let parts: Parts
  beforeAll(async () => {
    parts = await unpack()
  })

  it('lays out the header, then every section in order, one paragraph per line', () => {
    expect(paragraphs(parts).map(textOf)).toEqual([
      RESUME.name,
      RESUME.headline,
      RESUME.contacts.map((contact) => contact.label).join(CONTACT_SEPARATOR),
      SECTION_TITLES[0],
      ...RESUME.experience.flatMap(entryLines),
      SECTION_TITLES[1],
      ...RESUME.projects.flatMap(entryLines),
      SECTION_TITLES[2],
      ...RESUME.research.flatMap(entryLines),
      PUBLICATIONS_TITLE,
      ...RESUME.publications.map(citationLine),
      SECTION_TITLES[3],
      ...RESUME.education.flatMap(entryLines),
    ])
  })

  it('sets every run in Inter, with no capitals transform or letter spacing', () => {
    const fontAttributes = ['ascii', 'hAnsi', 'cs', 'eastAsia']
    const fonts = new Set(
      [
        ...elements(parts.document, 'rFonts'),
        ...elements(parts.styles, 'docDefaults').flatMap((defaults) =>
          elements(defaults, 'rFonts')
        ),
      ].flatMap((rFonts) => fontAttributes.map((name) => attribute(rFonts, name)))
    )
    expect(fonts).toEqual(new Set([FONT]))
    expect(elements(parts.document, 'caps')).toHaveLength(0)
    expect(elements(parts.document, 'smallCaps')).toHaveLength(0)
    const runSpacing = elements(parts.document, 'rPr').filter(
      (properties) => elements(properties, 'spacing').length > 0
    )
    expect(runSpacing.map((properties) => properties.outerHTML)).toEqual([])
  })

  it('uses an A4 page', () => {
    const [size] = elements(parts.document, 'pgSz')
    expect({ width: attribute(size, 'w'), height: attribute(size, 'h') }).toEqual(A4_TWIPS)
  })

  it('links each contact, project, app and paper from its own label, and nothing else', () => {
    const targets = new Map(
      [...parts.relationships.getElementsByTagNameNS(PACKAGE_RELATIONSHIP_NS, 'Relationship')]
        .filter((relationship) => relationship.getAttribute('TargetMode') === 'External')
        .map((relationship) => [
          relationship.getAttribute('Id'),
          relationship.getAttribute('Target'),
        ])
    )
    const links = elements(parts.document, 'hyperlink').map((link) => [
      textOf(link),
      targets.get(link.getAttributeNS(RELATIONSHIP_NS, 'id')),
    ])

    expect(links).toEqual(resumeLinks(RESUME).map((link) => [link.label, link.href]))
    expect(links.length).toBeGreaterThan(0)
  })

  it('marks every bullet and citation with the same Inter "•" list level', () => {
    const listed = paragraphs(parts).filter((paragraph) => elements(paragraph, 'numPr').length > 0)
    const bulletCount = [
      ...RESUME.experience,
      ...RESUME.projects,
      ...RESUME.research,
      ...RESUME.education,
    ].reduce((count, entry) => count + entry.bullets.length, RESUME.publications.length)
    expect(listed).toHaveLength(bulletCount)

    const numIds = new Set(
      listed.map((paragraph) => attribute(elements(paragraph, 'numId')[0], 'val'))
    )
    expect(numIds.size).toBe(1)
    const [numId] = numIds
    const num = elements(parts.numbering, 'num').find(
      (candidate) => attribute(candidate, 'numId') === numId
    )
    if (num === undefined) throw new Error(`numbering.xml has no w:num ${numId}`)
    const abstractId = attribute(elements(num, 'abstractNumId')[0], 'val')
    const abstract = elements(parts.numbering, 'abstractNum').find(
      (candidate) => attribute(candidate, 'abstractNumId') === abstractId
    )
    if (abstract === undefined) throw new Error(`numbering.xml has no w:abstractNum ${abstractId}`)
    const [level] = elements(abstract, 'lvl')
    expect(attribute(elements(level, 'lvlText')[0], 'val')).toBe('•')
    expect(attribute(elements(level, 'rFonts')[0], 'ascii')).toBe(FONT)
  })

  it('mutes periods, tool notes, the headline and venues in one color, apart from body text', () => {
    const colors = runColors(parts)
    const colorOf = (text: string) => {
      const run = colors.find((candidate) => candidate.text === text)
      if (run === undefined) throw new Error(`No run with text ${JSON.stringify(text)}`)
      return run.color
    }
    const [job] = RESUME.experience
    const [research] = RESUME.research
    const [citation] = RESUME.publications
    const muted = colorOf(RESUME.headline)
    expect({
      period: colorOf(`\t${job.period}`),
      note: colorOf(research.note ?? ''),
      venue: colorOf(`. ${citation.venue}.`),
    }).toEqual({ period: muted, note: muted, venue: muted })
    expect(colorOf(RESUME.name)).not.toBe(muted)
    const plainBullet = job.bullets.find((bullet): bullet is string => typeof bullet === 'string')
    expect(colorOf(plainBullet ?? '')).not.toBe(muted)
  })

  it('sets the name, section titles, entry titles and bullet labels in bold', () => {
    const boldTexts = elements(parts.document, 'r')
      .filter((run) => elements(run, 'b').length > 0)
      .map(textOf)
    const labels = [
      ...RESUME.experience,
      ...RESUME.projects,
      ...RESUME.research,
      ...RESUME.education,
    ].flatMap((entry) => [
      entry.title,
      ...entry.bullets.flatMap((bullet) => (typeof bullet === 'string' ? [] : [bullet.label])),
    ])
    expect(new Set(boldTexts)).toEqual(
      new Set([RESUME.name, ...SECTION_TITLES, PUBLICATIONS_TITLE, ...labels])
    )
  })

  it('stores the content fingerprint as the document keywords, for Word to copy into the PDF', () => {
    const [keywords] = [...parts.core.getElementsByTagNameNS(CORE_PROPERTIES_NS, 'keywords')]
    expect(keywords?.textContent).toBe(contentFingerprint(RESUME))
  })
})

describe('contentFingerprint', () => {
  it('is a short hex hash that stays the same for the same content', () => {
    expect(contentFingerprint(RESUME)).toMatch(HEX_FINGERPRINT)
    expect(contentFingerprint(structuredClone(RESUME))).toBe(contentFingerprint(RESUME))
  })

  it('changes when any wording changes', () => {
    const [job] = RESUME.experience
    const reworded = { ...RESUME, experience: [{ ...job, period: `${job.period}.` }] }
    expect(contentFingerprint(reworded)).not.toBe(contentFingerprint(RESUME))
  })
})
