import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ARCHIVED_PROJECTS, FEATURED_PROJECTS } from '@content/projects'
import { PAPERS, paperUrl } from '@content/papers'
import { CONTACT_LINKS, RESUME_PATH } from '@content/profile'
import { PREVIEW_WIDTH } from '@lib/preview'

const PUBLIC_DIR = path.resolve(__dirname, '..', 'public')
const publicFile = (src: string) => path.join(PUBLIC_DIR, src)

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47])
const JPEG_SOI = 0xffd8
/** JPEG start-of-frame markers that carry the image size (baseline, extended, progressive). */
const JPEG_SOF_MARKERS = new Set([0xffc0, 0xffc1, 0xffc2])

/**
 * Reads width/height from a PNG's IHDR chunk or a JPEG's start-of-frame segment, to check the
 * dimensions declared in content. Screenshots ship pre-sized because the site serves them as-is.
 */
function imageSize(file: string): { width: number; height: number } {
  const bytes = fs.readFileSync(file)
  if (bytes.subarray(0, 4).equals(PNG_SIGNATURE)) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
  }
  if (bytes.readUInt16BE(0) !== JPEG_SOI) throw new Error(`${file} is neither PNG nor JPEG`)
  let offset = 2
  while (offset < bytes.length) {
    const marker = bytes.readUInt16BE(offset)
    const segmentLength = bytes.readUInt16BE(offset + 2)
    if (JPEG_SOF_MARKERS.has(marker)) {
      return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) }
    }
    offset += 2 + segmentLength
  }
  throw new Error(`${file} has no JPEG start-of-frame segment`)
}

describe('featured projects', () => {
  it('have unique ids', () => {
    const ids = FEATURED_PROJECTS.map((p) => p.id)
    expect(new Set(ids).size, ids.join(', ')).toBe(ids.length)
  })

  it.each(FEATURED_PROJECTS.filter((p) => p.image).map((p) => [p.id, p.image!]))(
    '%s screenshot exists with the declared dimensions',
    (_id, image) => {
      const file = publicFile(image.src)
      expect(fs.existsSync(file), file).toBe(true)
      expect(imageSize(file)).toEqual({ width: image.width, height: image.height })
      // Served unoptimized, so they must already be small: 2x the preview width at most.
      expect(image.width, `${image.src} width`).toBeLessThanOrEqual(PREVIEW_WIDTH * 2)
    }
  )

  it('show a preview only for projects people can open', () => {
    for (const project of FEATURED_PROJECTS) {
      if (project.image)
        expect(project.link, `${project.id} has an image but no link`).toBeDefined()
    }
  })

  it('use https links', () => {
    const links = [
      ...FEATURED_PROJECTS.flatMap((p) => (p.link ? [p.link] : [])),
      ...ARCHIVED_PROJECTS.map((p) => p.link),
    ]
    for (const link of links) expect(link, link).toMatch(/^https:\/\//)
  })
})

describe('papers', () => {
  it('are ordered newest first', () => {
    const years = PAPERS.map((p) => p.year)
    expect(years).toEqual([...years].sort((a, b) => b - a))
  })

  it('resolve through doi.org', () => {
    for (const paper of PAPERS) {
      expect(paper.doi, paper.title).toMatch(/^10\.\d{4,}\//)
      expect(paperUrl(paper)).toBe(`https://doi.org/${paper.doi}`)
    }
  })
})

describe('profile', () => {
  it('ships the résumé the site links to', () => {
    expect(fs.existsSync(publicFile(RESUME_PATH)), RESUME_PATH).toBe(true)
    expect(CONTACT_LINKS.find((l) => l.id === 'resume')?.href).toBe(RESUME_PATH)
  })
})
