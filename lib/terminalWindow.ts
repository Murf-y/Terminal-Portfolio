/* Geometry of the draggable, resizable terminal window. Pure: callers pass the viewport. */

export interface Size {
  w: number
  h: number
}
export interface Point {
  x: number
  y: number
}

export type Edge = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se'
export const EDGES: Edge[] = ['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se']

export const MIN_SIZE: Size = { w: 400, h: 300 }
/** Largest window as a share of the viewport. */
const MAX_W_RATIO = 0.95
const MAX_H_RATIO = 0.92

const MOBILE_BREAKPOINT = 640
const MOBILE_INSET = 24
const DEFAULT_MAX: Size = { w: 860, h: 680 }
const DEFAULT_W_RATIO = 0.85
const DEFAULT_H_RATIO = 0.8

/** Opening size: nearly full screen on phones, a comfortable window elsewhere. */
export function defaultSize(viewport: Size): Size {
  if (viewport.w < MOBILE_BREAKPOINT) {
    return { w: viewport.w - MOBILE_INSET, h: viewport.h - MOBILE_INSET }
  }
  return {
    w: Math.min(DEFAULT_MAX.w, viewport.w * DEFAULT_W_RATIO),
    h: Math.min(viewport.h * DEFAULT_H_RATIO, DEFAULT_MAX.h),
  }
}

export function centeredPos(size: Size, viewport: Size): Point {
  return { x: (viewport.w - size.w) / 2, y: (viewport.h - size.h) / 2 }
}

/** Window geometry after dragging `edge` by (dx, dy), clamped between MIN_SIZE and the viewport cap. */
export function resizeWindow(
  edge: Edge,
  origin: Point,
  size: Size,
  dx: number,
  dy: number,
  viewport: Size
): { size: Size; pos: Point } {
  const clampW = (w: number) => Math.max(MIN_SIZE.w, Math.min(viewport.w * MAX_W_RATIO, w))
  const clampH = (h: number) => Math.max(MIN_SIZE.h, Math.min(viewport.h * MAX_H_RATIO, h))
  let { w, h } = size
  let { x, y } = origin
  if (edge.includes('e')) w = clampW(size.w + dx)
  if (edge.includes('w')) {
    w = clampW(size.w - dx)
    x = origin.x + (size.w - w)
  }
  if (edge.includes('s')) h = clampH(size.h + dy)
  if (edge.includes('n')) {
    h = clampH(size.h - dy)
    y = origin.y + (size.h - h)
  }
  return { size: { w, h }, pos: { x, y } }
}
