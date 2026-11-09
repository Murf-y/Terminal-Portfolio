import { ProjectImage } from '@models/project'

/** Width of the floating screenshot preview beside the project list, in px. */
export const PREVIEW_WIDTH = 320

/** Matches the row's top padding (py-2), so the preview's top edge lines up with the title. */
export const PREVIEW_ROW_OFFSET = 8

/* Durations follow the emil-design-eng guidance: UI motion under 300ms, ease-out for entering. */
const MORPH_MS = 260
const FADE_MS = 160
const EASE_OUT_STRONG = 'cubic-bezier(0.23, 1, 0.32, 1)'

const FADE_TRANSITION = `opacity ${FADE_MS}ms ease-out, transform ${FADE_MS}ms ease-out`
const MORPH_TRANSITION = `top ${MORPH_MS}ms ${EASE_OUT_STRONG}, height ${MORPH_MS}ms ${EASE_OUT_STRONG}, ${FADE_TRANSITION}`

/** Height that shows the whole screenshot at PREVIEW_WIDTH, so nothing is cropped. */
export function previewHeight(image: ProjectImage, width: number = PREVIEW_WIDTH): number {
  if (image.width <= 0 || image.height <= 0) {
    throw new RangeError(
      `Project image ${image.src} has invalid dimensions ${image.width}x${image.height}`
    )
  }
  return Math.round((width * image.height) / image.width)
}

/**
 * When the preview is already visible, moving to another row slides and reshapes it (morph).
 * When it is appearing from hidden, it only fades and scales in at the new row.
 */
export function previewTransition(isMorphing: boolean): string {
  return isMorphing ? MORPH_TRANSITION : FADE_TRANSITION
}
