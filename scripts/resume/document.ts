/* Lays the résumé out as a Word document: one A4 page set in Inter. Dates, tools and venues are
   muted, and space between sections and entries sets each one apart as its own block. */
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  LevelFormat,
  LineRuleType,
  Paragraph,
  TabStopType,
  TextRun,
  type IRunOptions,
} from 'docx'
import type { Bullet, Citation, Entry, Resume } from './content.ts'

export const FONT = 'Inter'

const TWIPS_PER_PT = 20
const HALF_POINTS_PER_PT = 2
const TWIPS_PER_INCH = 1440
const MM_PER_INCH = 25.4
const twips = (points: number) => Math.round(points * TWIPS_PER_PT)
const inches = (value: number) => Math.round(value * TWIPS_PER_INCH)
const millimetres = (value: number) => Math.round((value / MM_PER_INCH) * TWIPS_PER_INCH)
const fontSize = (points: number) => points * HALF_POINTS_PER_PT

/** ISO A4, 210 × 297 mm: the standard in Lebanon and Europe. */
const PAGE = { width: millimetres(210), height: millimetres(297) }
const MARGIN = { top: inches(0.5), bottom: inches(0.45), left: inches(0.65), right: inches(0.65) }
const TEXT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right

const COLOR = { ink: '1F2328', muted: '5F6368', rule: 'C9CDD2' }
/** Border widths are in eighths of a point. */
const RULE_WEIGHT = 4

/** Font sizes in points. */
const TYPE = { name: 20, headline: 10.5, contact: 8.5, section: 10.5, body: 9, note: 8 }

/** Word's "multiple" line spacing is expressed in 240ths of a line. */
const LINE_UNITS = 240
const LINE_SPACING = 1.06

/** Paragraph spacing in points. */
const SPACE = {
  afterName: 1,
  afterHeadline: 3,
  sectionBefore: 9,
  sectionAfter: 3,
  ruleGap: 2,
  entryBefore: 4,
  afterTitle: 1,
  afterNote: 1.5,
  afterBullet: 1,
}

const BULLET_REFERENCE = 'bullet'
const BULLET_INDENT = { left: inches(0.2), hanging: inches(0.14) }
const SEPARATOR = '  ·  '

const run = (text: string, options: IRunOptions = {}) =>
  new TextRun({ text, font: FONT, size: fontSize(TYPE.body), color: COLOR.ink, ...options })

/** A run that links to href when there is one. */
function linked(text: string, href: string | undefined, options: IRunOptions = {}) {
  return href === undefined
    ? run(text, options)
    : new ExternalHyperlink({ link: href, children: [run(text, options)] })
}

function sectionHeading(title: string): Paragraph {
  return new Paragraph({
    keepNext: true,
    spacing: { before: twips(SPACE.sectionBefore), after: twips(SPACE.sectionAfter) },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: RULE_WEIGHT,
        color: COLOR.rule,
        space: SPACE.ruleGap,
      },
    },
    children: [run(title, { bold: true, size: fontSize(TYPE.section) })],
  })
}

function bulletParagraph(bullet: Bullet): Paragraph {
  const children =
    typeof bullet === 'string'
      ? [run(bullet)]
      : [linked(bullet.label, bullet.href, { bold: true }), run(`: ${bullet.text}`)]
  return new Paragraph({
    numbering: { reference: BULLET_REFERENCE, level: 0 },
    spacing: { after: twips(SPACE.afterBullet) },
    children,
  })
}

function entryParagraphs(entry: Entry): Paragraph[] {
  const title = [linked(entry.title, entry.href, { bold: true })]
  if (entry.context !== undefined) title.push(run(`, ${entry.context}`))
  const paragraphs = [
    new Paragraph({
      keepNext: true,
      spacing: { before: twips(SPACE.entryBefore), after: twips(SPACE.afterTitle) },
      tabStops: [{ type: TabStopType.RIGHT, position: TEXT_WIDTH }],
      children: [...title, run(`\t${entry.period}`, { color: COLOR.muted })],
    }),
  ]
  if (entry.note !== undefined) {
    paragraphs.push(
      new Paragraph({
        keepNext: true,
        spacing: { after: twips(SPACE.afterNote) },
        children: [run(entry.note, { color: COLOR.muted, size: fontSize(TYPE.note) })],
      })
    )
  }
  return [...paragraphs, ...entry.bullets.map(bulletParagraph)]
}

function citationParagraph(citation: Citation): Paragraph {
  return new Paragraph({
    numbering: { reference: BULLET_REFERENCE, level: 0 },
    spacing: { after: twips(SPACE.afterBullet) },
    children: [
      run(`${citation.authors} (${citation.year}). `),
      linked(citation.title, citation.href, { italics: true }),
      run(`. ${citation.venue}.`, { color: COLOR.muted }),
    ],
  })
}

function headerParagraphs(resume: Resume): Paragraph[] {
  const contactRuns = resume.contacts.flatMap((contact, index) => [
    ...(index === 0 ? [] : [run(SEPARATOR, { color: COLOR.rule, size: fontSize(TYPE.contact) })]),
    linked(contact.label, contact.href, { color: COLOR.muted, size: fontSize(TYPE.contact) }),
  ])
  return [
    new Paragraph({
      spacing: { after: twips(SPACE.afterName) },
      children: [run(resume.name, { bold: true, size: fontSize(TYPE.name) })],
    }),
    new Paragraph({
      spacing: { after: twips(SPACE.afterHeadline) },
      children: [run(resume.headline, { color: COLOR.muted, size: fontSize(TYPE.headline) })],
    }),
    new Paragraph({ children: contactRuns }),
  ]
}

/** The résumé as a Word document, ready for Packer. */
export function buildResume(resume: Resume): Document {
  const publicationsHeading = new Paragraph({
    keepNext: true,
    spacing: { before: twips(SPACE.entryBefore), after: twips(SPACE.afterTitle) },
    children: [run('Publications', { bold: true })],
  })
  return new Document({
    creator: resume.name,
    title: `${resume.name} — Résumé`,
    styles: {
      default: {
        document: {
          run: { font: FONT, size: fontSize(TYPE.body), color: COLOR.ink },
          paragraph: {
            spacing: { line: Math.round(LINE_UNITS * LINE_SPACING), lineRule: LineRuleType.AUTO },
          },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: BULLET_REFERENCE,
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: BULLET_INDENT },
                run: { font: FONT, color: COLOR.muted },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: { page: { size: PAGE, margin: MARGIN } },
        children: [
          ...headerParagraphs(resume),
          sectionHeading('Experience'),
          ...resume.experience.flatMap(entryParagraphs),
          sectionHeading('Projects'),
          ...resume.projects.flatMap(entryParagraphs),
          sectionHeading('Research'),
          ...resume.research.flatMap(entryParagraphs),
          publicationsHeading,
          ...resume.publications.map(citationParagraph),
          sectionHeading('Education'),
          ...resume.education.flatMap(entryParagraphs),
        ],
      },
    ],
  })
}
