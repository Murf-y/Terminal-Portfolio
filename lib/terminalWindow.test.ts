import { describe, expect, it } from 'vitest'
import { MIN_SIZE, centeredPos, defaultSize, resizeWindow } from '@lib/terminalWindow'

const DESKTOP = { w: 1000, h: 1000 }

describe('defaultSize', () => {
  it('caps the desktop window at 860x680', () => {
    expect(defaultSize({ w: 1920, h: 1080 })).toEqual({ w: 860, h: 680 })
  })

  it('uses 85% x 80% of a smaller desktop viewport', () => {
    expect(defaultSize({ w: 800, h: 700 })).toEqual({ w: 680, h: 560 })
  })

  it('fills a phone screen minus a 12px margin on each side', () => {
    expect(defaultSize({ w: 390, h: 844 })).toEqual({ w: 366, h: 820 })
  })
})

describe('centeredPos', () => {
  it('centres the window in the viewport', () => {
    expect(centeredPos({ w: 860, h: 640 }, { w: 1024, h: 800 })).toEqual({ x: 82, y: 80 })
  })
})

describe('resizeWindow', () => {
  const origin = { x: 100, y: 100 }
  const size = { w: 600, h: 500 }

  it('grows east and south without moving the window', () => {
    expect(resizeWindow('se', origin, size, 50, 40, DESKTOP)).toEqual({
      size: { w: 650, h: 540 },
      pos: origin,
    })
  })

  it('growing west or north moves the opposite edge', () => {
    expect(resizeWindow('nw', origin, size, -50, -40, DESKTOP)).toEqual({
      size: { w: 650, h: 540 },
      pos: { x: 50, y: 60 },
    })
  })

  it('an edge handle changes one dimension only', () => {
    expect(resizeWindow('e', origin, size, 30, 999, DESKTOP)).toEqual({
      size: { w: 630, h: 500 },
      pos: origin,
    })
    expect(resizeWindow('n', origin, size, 999, -30, DESKTOP)).toEqual({
      size: { w: 600, h: 530 },
      pos: { x: 100, y: 70 },
    })
  })

  it('clamps to the minimum size and keeps the far edge fixed', () => {
    // Shrinking west by 500 stops at MIN_SIZE.w, so x moves by only 600 - 400 = 200.
    expect(MIN_SIZE).toEqual({ w: 400, h: 300 })
    expect(resizeWindow('w', origin, size, 500, 0, DESKTOP)).toEqual({
      size: { w: 400, h: 500 },
      pos: { x: 300, y: 100 },
    })
  })

  it('clamps to 95% x 92% of the viewport', () => {
    expect(resizeWindow('se', origin, size, 5000, 5000, DESKTOP).size).toEqual({ w: 950, h: 920 })
  })
})
