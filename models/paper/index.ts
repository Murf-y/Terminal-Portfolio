export interface Paper {
  title: string
  /** Citation form, in order, such as "Fayad, C.". */
  authors: string[]
  year: number
  venue: string
  doi: string
  abstract: string
  tags: string[]
  githubLink?: string
}
