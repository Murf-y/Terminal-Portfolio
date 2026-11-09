import { act, fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Terminal, { NEW_WINDOW_FEATURES, resizeWindow } from '@components/Terminal'
import { LINKS, RESUME_PATH } from '@content/profile'
import { trackTerminalCommand } from '@hooks/useAnalytics'
import { THEME_ATTRIBUTE } from '@lib/theme'
import { renderWithProviders } from '../tests/render'

const push = vi.fn()
vi.mock('next/router', () => ({ useRouter: () => ({ push }) }))

const dialog = () => screen.getByRole('dialog', { name: 'Terminal' })
const prompt = () => screen.getByRole('textbox', { name: 'Terminal command' })
const geometry = () => {
  const { left, top, width, height } = dialog().style
  return { left, top, width, height }
}

function renderTerminal() {
  const onExit = vi.fn()
  const view = renderWithProviders(<Terminal onExit={onExit} />)
  return { onExit, ...view }
}

async function run(command: string) {
  const user = userEvent.setup()
  await user.type(prompt(), `${command}{Enter}`)
  return user
}

describe('Terminal', () => {
  beforeEach(() => {
    // Default window = min(860, 85% of 1024) x min(80% of 800, 680) = 860x640, centred at (82, 80).
    window.innerWidth = 1024
    window.innerHeight = 800
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('is a labelled modal dialog that takes focus and greets the visitor', () => {
    renderTerminal()
    expect(dialog()).toHaveAttribute('aria-modal', 'true')
    expect(prompt()).toHaveFocus()
    expect(within(dialog()).getByText("Welcome to Charbel Fayad's terminal.")).toBeInTheDocument()
  })

  it('gives focus back to the element that opened it', () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const { unmount } = renderTerminal()
    expect(prompt()).toHaveFocus()
    unmount()
    expect(opener, 'focus returns to the opener after close').toHaveFocus()
    opener.remove()
  })

  it('runs help and reports only the command name to analytics', async () => {
    renderTerminal()
    await run('help')
    expect(screen.getByText('cd <page>', { exact: false })).toBeInTheDocument()
    expect(trackTerminalCommand).toHaveBeenCalledWith('help')
    expect(prompt()).toHaveValue('')
  })

  it('never sends free text to analytics', async () => {
    renderTerminal()
    await run('my email is me@example.com')
    expect(screen.getByText('command not found: my email is me@example.com', { exact: false })).toBeInTheDocument()
    expect(trackTerminalCommand).toHaveBeenCalledTimes(1)
    expect(trackTerminalCommand).toHaveBeenCalledWith('unknown')
  })

  it('cd to a known page closes the terminal and navigates', async () => {
    const { onExit } = renderTerminal()
    await run('cd about')
    expect(onExit).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith('/about')
    expect(trackTerminalCommand).toHaveBeenCalledWith('cd about')
  })

  it.each(['constructor', '__proto__'])('cd %s prints an error and does not navigate', async (name) => {
    const { onExit } = renderTerminal()
    await run(`cd ${name}`)
    expect(screen.getByText(`cd: no such directory: ${name}`, { exact: false })).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
    expect(onExit).not.toHaveBeenCalled()
    expect(trackTerminalCommand).toHaveBeenCalledWith('cd')
  })

  it('opens the résumé and GitHub without giving them a handle on this tab', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    renderTerminal()
    await run('open resume')
    await run('open github')
    expect(open).toHaveBeenNthCalledWith(1, RESUME_PATH, '_blank', NEW_WINDOW_FEATURES)
    expect(open).toHaveBeenNthCalledWith(2, LINKS.github, '_blank', NEW_WINDOW_FEATURES)
    expect(NEW_WINDOW_FEATURES).toBe('noopener,noreferrer')
  })

  it('theme toggles the page theme', async () => {
    renderTerminal()
    await run('theme')
    expect(document.documentElement).toHaveAttribute(THEME_ATTRIBUTE, 'light')
    expect(screen.getByText('Switched to light mode.', { exact: false })).toBeInTheDocument()
  })

  it('clear empties the screen and exit closes', async () => {
    const { onExit } = renderTerminal()
    await run('clear')
    expect(within(dialog()).queryByText("Welcome to Charbel Fayad's terminal.", { exact: false })).toBeNull()
    await run('exit')
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('an empty Enter prints a bare prompt and records nothing', async () => {
    renderTerminal()
    await run('')
    expect(trackTerminalCommand).not.toHaveBeenCalled()
  })

  it('walks command history with the arrow keys', async () => {
    renderTerminal()
    const user = await run('pwd')
    await run('whoami')
    await user.keyboard('{ArrowUp}')
    expect(prompt()).toHaveValue('whoami')
    await user.keyboard('{ArrowUp}')
    expect(prompt()).toHaveValue('pwd')
    await user.keyboard('{ArrowUp}')
    expect(prompt(), 'stops at the oldest entry').toHaveValue('pwd')
    await user.keyboard('{ArrowDown}')
    expect(prompt()).toHaveValue('whoami')
    await user.keyboard('{ArrowDown}')
    expect(prompt()).toHaveValue('')
  })

  it('Ctrl+L clears the screen', async () => {
    renderTerminal()
    const user = userEvent.setup()
    prompt().focus()
    await user.keyboard('{Control>}l{/Control}')
    expect(within(dialog()).queryByText("Welcome to Charbel Fayad's terminal.", { exact: false })).toBeNull()
  })

  it('Escape closes', async () => {
    const { onExit } = renderTerminal()
    await userEvent.setup().keyboard('{Escape}')
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('clicking the backdrop closes, clicking the window does not', () => {
    const { onExit } = renderTerminal()
    fireEvent.click(dialog())
    expect(onExit).not.toHaveBeenCalled()
    fireEvent.click(dialog().parentElement!)
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('traps Tab inside the dialog', async () => {
    renderTerminal()
    const user = userEvent.setup()
    const close = screen.getByRole('button', { name: 'Close terminal' })
    expect(prompt()).toHaveFocus()
    await user.tab()
    expect(close, 'Tab from the last element wraps to the first').toHaveFocus()
    await user.tab({ shift: true })
    expect(prompt(), 'Shift+Tab from the first element wraps to the last').toHaveFocus()
  })

  it('maximizes and restores from the green button', () => {
    renderTerminal()
    const before = geometry()
    fireEvent.click(screen.getByRole('button', { name: 'Maximize terminal' }))
    expect(geometry()).toEqual({ left: '0px', top: '0px', width: '1024px', height: '800px' })
    fireEvent.click(screen.getByRole('button', { name: 'Restore terminal size' }))
    expect(geometry()).toEqual(before)
  })

  it('drags by the title bar', () => {
    renderTerminal()
    expect(geometry()).toEqual({ left: '82px', top: '80px', width: '860px', height: '640px' })
    fireEvent.mouseDown(screen.getByTestId('terminal-title-bar'), { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(window, { clientX: 150, clientY: 130 })
    expect(geometry()).toMatchObject({ left: '132px', top: '110px' })
    expect(dialog().style.transition, 'no easing while dragging').toBe('none')
    fireEvent.mouseUp(window)
    fireEvent.mouseMove(window, { clientX: 400, clientY: 400 })
    expect(geometry(), 'stops following after mouseup').toMatchObject({ left: '132px', top: '110px' })
  })

  it('resizes from a corner handle', () => {
    const { container } = renderTerminal()
    const corner = container.querySelector('[data-edge="se"]')!
    fireEvent.mouseDown(corner, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 40, clientY: 20 })
    expect(geometry()).toEqual({ left: '82px', top: '80px', width: '900px', height: '660px' })
    fireEvent.mouseUp(window)
  })

  it('removes its window listeners if it closes mid-drag', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderTerminal()
    fireEvent.mouseDown(screen.getByTestId('terminal-title-bar'), { clientX: 0, clientY: 0 })
    const added = add.mock.calls.filter(([type]) => type === 'mousemove' || type === 'mouseup')
    expect(added.map(([type]) => type)).toEqual(['mousemove', 'mouseup'])
    act(() => unmount())
    for (const [type, listener] of added) {
      expect(remove, `${type} listener removed on unmount`).toHaveBeenCalledWith(type, listener)
    }
  })
})

describe('resizeWindow', () => {
  beforeEach(() => {
    window.innerWidth = 1000
    window.innerHeight = 1000
  })

  const origin = { x: 100, y: 100 }
  const size = { w: 600, h: 500 }

  it('grows east and south without moving the window', () => {
    expect(resizeWindow('se', origin, size, 50, 40)).toEqual({ size: { w: 650, h: 540 }, pos: origin })
  })

  it('growing west or north moves the opposite edge', () => {
    expect(resizeWindow('nw', origin, size, -50, -40)).toEqual({
      size: { w: 650, h: 540 },
      pos: { x: 50, y: 60 },
    })
  })

  it('clamps to the minimum size and keeps the far edge fixed', () => {
    // MIN 400x300: shrinking west by 500 stops at 400 wide, so x moves by only 200.
    expect(resizeWindow('w', origin, size, 500, 0)).toEqual({ size: { w: 400, h: 500 }, pos: { x: 300, y: 100 } })
  })

  it('clamps to 95% x 92% of the viewport', () => {
    expect(resizeWindow('se', origin, size, 5000, 5000).size).toEqual({ w: 950, h: 920 })
  })
})
