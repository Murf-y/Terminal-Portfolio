export interface ProjectImage {
  src: string
  width: number
  height: number
}

/** A current project, listed on Home and at the top of /projects. */
export interface FeaturedProject {
  id: string
  title: string
  description: string
  stack: string[]
  year: number
  /** Projects without a public link (private work) render as plain rows with no preview. */
  link?: string
  image?: ProjectImage
}

/** An older project, listed by title and stack only on /projects. */
export interface ArchivedProject {
  title: string
  stack: string[]
  link: string
}
