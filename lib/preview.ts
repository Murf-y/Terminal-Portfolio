import type { ProjectImage } from '@models/project'

/**
 * Width of the floating screenshot preview beside the project list, in px.
 * With PREVIEW_GAP it fits a 1280px laptop: the 560px column is centred, so the preview's
 * right edge sits at 640 + 280 + 40 + 288 = 1248px, clear of a 15px scrollbar.
 * Keep the `preview` breakpoint in tailwind.config.cjs in step with these two values.
 */
export const PREVIEW_WIDTH = 288

/** Horizontal gap between the project list and the preview, in px. */
export const PREVIEW_GAP = 40

/** Matches the row's top padding (py-2), so the preview's top edge lines up with the title. */
export const PREVIEW_ROW_OFFSET = 8

/* Durations follow the emil-design-eng guidance: UI motion under 300ms, ease-out for entering. */
const MORPH_MS = 260
const FADE_MS = 160
const EASE_OUT_STRONG = 'cubic-bezier(0.23, 1, 0.32, 1)'

/**
 * A row entered this soon after the preview hid still morphs from where it was. This covers
 * Tab (blur then focus in the same tick) and crossing a row without a screenshot.
 */
export const MORPH_GRACE_MS = MORPH_MS

/** Frame transform while hidden and shown: it scales in slightly as it fades in. */
export const PREVIEW_SCALE = { hidden: 'scale(0.96)', shown: 'scale(1)' } as const

/** Screenshot filter: the outgoing one softens as the next crossfades in. */
export const IMAGE_FILTER = { active: 'blur(0px)', inactive: 'blur(2px)' } as const

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
 * Whether moving to a new row should slide the preview from its last position.
 * @param isVisible the preview is showing right now
 * @param msSinceHidden time since it last hid, or null if it has never been shown
 */
export function shouldMorph(isVisible: boolean, msSinceHidden: number | null): boolean {
  if (isVisible) return true
  return msSinceHidden !== null && msSinceHidden < MORPH_GRACE_MS
}

/**
 * When morphing, moving to another row slides and reshapes the preview.
 * When appearing from hidden, it only fades and scales in at the new row.
 */
export function previewTransition(isMorphing: boolean): string {
  return isMorphing ? MORPH_TRANSITION : FADE_TRANSITION
}
