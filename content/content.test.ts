import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ARCHIVED_PROJECTS, FEATURED_PROJECTS } from '@content/projects'
import { PAPERS, paperUrl } from '@content/papers'
import { CONTACT_LINKS, RESUME_PATH } from '@content/profile'

const PUBLIC_DIR = path.resolve(__dirname, '..', 'public')
const publicFile = (src: string) => path.join(PUBLIC_DIR, src)

/** Reads width/height from a PNG's IHDR chunk, to check the dimensions declared in content. */
function pngSize(file: string): { width: number; height: number } {
  const header = fs.readFileSync(file).subarray(0, 24)
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) }
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
      expect(pngSize(file)).toEqual({ width: image.width, height: image.height })
    }
  )

  it('show a preview only for projects people can open', () => {
    for (const project of FEATURED_PROJECTS) {
      if (project.image) expect(project.link, `${project.id} has an image but no link`).toBeDefined()
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
