/* Floating screenshot beside the project list: follows the hovered or focused row, morphing
   between rows and fading in from hidden. Markup comes from src/components/ProjectList.astro. */
import {
  IMAGE_FILTER,
  PREVIEW_ROW_OFFSET,
  PREVIEW_SCALE,
  previewTransition,
  shouldMorph,
} from '@lib/preview'

const LIST_SELECTOR = '[data-project-list]'
const ROW_SELECTOR = '[data-preview-row]'
const FRAME_SELECTOR = '[data-project-preview]'
const IMAGE_SELECTOR = 'img[data-project]'

function initProjectPreview(list: HTMLElement): void {
  const frame = list.querySelector<HTMLElement>(FRAME_SELECTOR)
  // No project in this list has a screenshot.
  if (frame === null) return
  const images = Array.from(frame.querySelectorAll<HTMLImageElement>(IMAGE_SELECTOR))

  let isVisible = false
  /** When the preview last stopped showing, in ms since epoch; null until it has been shown. */
  let hiddenAt: number | null = null

  const hide = () => {
    if (isVisible) hiddenAt = Date.now()
    isVisible = false
    frame.style.opacity = '0'
    frame.style.transform = PREVIEW_SCALE.hidden
  }

  const show = (row: HTMLElement, projectId: string) => {
    const msSinceHidden = hiddenAt === null ? null : Date.now() - hiddenAt
    frame.style.transition = previewTransition(shouldMorph(isVisible, msSinceHidden))
    isVisible = true
    frame.style.top = `${row.offsetTop + PREVIEW_ROW_OFFSET}px`
    frame.style.opacity = '1'
    frame.style.transform = PREVIEW_SCALE.shown
    for (const image of images) {
      const isActive = image.dataset.project === projectId
      image.style.opacity = isActive ? '1' : '0'
      image.style.filter = isActive ? IMAGE_FILTER.active : IMAGE_FILTER.inactive
      // Each screenshot is rendered at its full height; the frame takes the active one's.
      if (isActive) frame.style.height = image.style.height
    }
  }

  /* Rows without a screenshot (no link, or no image) hide the preview. */
  const enter = (row: HTMLElement) => {
    const projectId = row.dataset.projectId
    if (projectId === undefined) hide()
    else show(row, projectId)
  }

  for (const row of list.querySelectorAll<HTMLElement>(ROW_SELECTOR)) {
    row.addEventListener('mouseenter', () => enter(row))
    row.addEventListener('focus', () => enter(row))
    row.addEventListener('blur', hide)
  }
  list.addEventListener('mouseleave', hide)
}

/** Wires every project list on the page. Listeners live on the list's own elements. */
export function initProjectPreviews(): void {
  for (const list of document.querySelectorAll<HTMLElement>(LIST_SELECTOR)) initProjectPreview(list)
}
