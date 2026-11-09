import { fireEvent, screen, within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LINKS, RESUME_PATH } from '@content/profile'
import { THEME_ATTRIBUTE } from '@lib/theme'
import { NEW_WINDOW_FEATURES, openTerminal } from '@scripts/terminal'

const WELCOME = "Welcome to Charbel Fayad's terminal."

const dialog = () => screen.getByRole('dialog', { name: 'Terminal' })
const queryDialog = () => screen.queryByRole('dialog', { name: 'Terminal' })
const prompt = () => screen.getByRole('textbox', { name: 'Terminal command' })
const titleBar = () => dialog().querySelector<HTMLElement>('[data-title-bar]')!
const logo = () => dialog().querySelector<HTMLImageElement>('[data-logo]')!
const geometry = () => {
  const { left, top, width, height } = dialog().style
  return { left, top, width, height }
}

async function run(command: string) {
  const user = userEvent.setup()
  await user.type(prompt(), `${command}{Enter}`)
  return user
}

describe('openTerminal', () => {
  beforeEach(() => {
    // Default window = min(860, 85% of 1024) x min(80% of 800, 680) = 860x640, centred at (82, 80).
    window.innerWidth = 1024
    window.innerHeight = 800
    document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark')
  })
  afterEach(() => {
    // Close through the UI so the module's open state resets for the next test.
    if (queryDialog() !== null) fireEvent.click(screen.getByRole('button', { name: 'Close terminal' }))
    vi.restoreAllMocks()
  })

  it('is a labelled modal dialog that takes focus and greets the visitor', () => {
    openTerminal()
    expect(dialog()).toHaveAttribute('aria-modal', 'true')
    expect(prompt()).toHaveFocus()
    expect(within(dialog()).getByText(WELCOME, { exact: false })).toBeInTheDocument()
    expect(logo()).toHaveAttribute('src', '/images/Logo.png')
  })

  it('opens once, however many times it is asked', () => {
    openTerminal()
    openTerminal()
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
  })

  it('locks page scroll while open and gives focus back to the opener on close', () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()
    openTerminal()
    expect(document.body.style.overflow).toBe('hidden')
    expect(prompt()).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Close terminal' }))
    expect(queryDialog()).toBeNull()
    expect(document.body.style.overflow).toBe('')
    expect(opener, 'focus returns to the opener after close').toHaveFocus()
  })

  it('can be opened again after closing', () => {
    openTerminal()
    fireEvent.click(screen.getByRole('button', { name: 'Close terminal' }))
    openTerminal()
    expect(dialog()).toBeInTheDocument()
  })

  it('runs help and clears the prompt', async () => {
    openTerminal()
    await run('help')
    expect(within(dialog()).getByText('cd <page>', { exact: false })).toBeInTheDocument()
    expect(within(dialog()).getByText('help', { selector: 'span' }), 'command echoed after the prompt').toBeInTheDocument()
    expect(prompt()).toHaveValue('')
  })

  it('prints errors as error lines', async () => {
    openTerminal()
    await run('rm -rf ~')
    expect(within(dialog()).getByText('command not found: rm -rf ~', { exact: false })).toHaveClass('text-error')
  })

  it('renders link lines as links that open in a new tab', async () => {
    openTerminal()
    await run('cat contact.md')
    const github = within(dialog()).getByRole('link', { name: /github\.com\/Murf-y/ })
    expect(github).toHaveAttribute('href', LINKS.github)
    expect(github).toHaveAttribute('target', '_blank')
    expect(github).toHaveAttribute('rel', 'noreferrer')
  })

  it('cd to a page closes the terminal and navigates there', async () => {
    openTerminal()
    await run('cd research')
    expect(queryDialog()).toBeNull()
    expect(window.location.hash).toBe('#research')
    window.history.replaceState(null, '', '/')
  })

  it.each(['constructor', '__proto__'])('cd %s prints an error and stays open', async (name) => {
    openTerminal()
    await run(`cd ${name}`)
    expect(within(dialog()).getByText(`cd: no such directory: ${name}`, { exact: false })).toBeInTheDocument()
    expect(window.location.hash).toBe('')
  })

  it('opens the résumé and GitHub without giving them a handle on this tab', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    openTerminal()
    await run('open resume')
    await run('open github')
    expect(open).toHaveBeenNthCalledWith(1, RESUME_PATH, '_blank', NEW_WINDOW_FEATURES)
    expect(open).toHaveBeenNthCalledWith(2, LINKS.github, '_blank', NEW_WINDOW_FEATURES)
    expect(NEW_WINDOW_FEATURES).toBe('noopener,noreferrer')
  })

  it('theme toggles the page theme and swaps the logo for contrast', async () => {
    openTerminal()
    await run('theme')
    expect(document.documentElement).toHaveAttribute(THEME_ATTRIBUTE, 'light')
    expect(within(dialog()).getByText('Switched to light mode.', { exact: false })).toBeInTheDocument()
    expect(logo()).toHaveAttribute('src', '/images/Logo_dark.png')
  })

  it('clear empties the screen and exit closes', async () => {
    openTerminal()
    await run('clear')
    expect(within(dialog()).queryByText(WELCOME, { exact: false })).toBeNull()
    await run('exit')
    expect(queryDialog()).toBeNull()
  })

  it('an empty Enter prints a bare prompt and is not added to history', async () => {
    openTerminal()
    const user = await run('')
    expect(dialog().querySelectorAll('[data-output] > .mt-1'), 'one echoed prompt line').toHaveLength(1)
    await user.keyboard('{ArrowUp}')
    expect(prompt()).toHaveValue('')
  })

  it('walks command history with the arrow keys', async () => {
    openTerminal()
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
    await user.keyboard('{ArrowDown}')
    expect(prompt(), 'stays on the empty prompt').toHaveValue('')
  })

  it('Ctrl+L clears the screen', async () => {
    openTerminal()
    await userEvent.setup().keyboard('{Control>}l{/Control}')
    expect(within(dialog()).queryByText(WELCOME, { exact: false })).toBeNull()
  })

  it('Escape closes', async () => {
    openTerminal()
    await userEvent.setup().keyboard('{Escape}')
    expect(queryDialog()).toBeNull()
  })

  it('clicking the backdrop closes, clicking the window does not', () => {
    openTerminal()
    fireEvent.click(dialog())
    expect(queryDialog()).not.toBeNull()
    fireEvent.click(dialog().parentElement!)
    expect(queryDialog()).toBeNull()
  })

  it('clicking the terminal body focuses the prompt', () => {
    openTerminal()
    prompt().blur()
    fireEvent.click(dialog().querySelector('[data-terminal-body]')!)
    expect(prompt()).toHaveFocus()
  })

  it('traps Tab inside the dialog', async () => {
    openTerminal()
    const user = userEvent.setup()
    const close = screen.getByRole('button', { name: 'Close terminal' })
    expect(prompt()).toHaveFocus()
    await user.tab()
    expect(close, 'Tab from the last element wraps to the first').toHaveFocus()
    await user.tab({ shift: true })
    expect(prompt(), 'Shift+Tab from the first element wraps to the last').toHaveFocus()
  })

  it('maximizes and restores from the green button, hiding the resize handles meanwhile', () => {
    openTerminal()
    const before = geometry()
    fireEvent.click(screen.getByRole('button', { name: 'Maximize terminal' }))
    expect(geometry()).toEqual({ left: '0px', top: '0px', width: '1024px', height: '800px' })
    expect(dialog()).not.toHaveClass('rounded-xl')
    expect(dialog().querySelector<HTMLElement>('[data-edge="se"]')!.hidden).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Restore terminal size' }))
    expect(geometry()).toEqual(before)
    expect(dialog()).toHaveClass('rounded-xl')
  })

  it('double-clicking the title bar toggles maximized, and a maximized window does not drag', () => {
    openTerminal()
    fireEvent.dblClick(titleBar())
    fireEvent.mouseDown(titleBar(), { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(window, { clientX: 150, clientY: 130 })
    expect(geometry()).toMatchObject({ left: '0px', top: '0px' })
    fireEvent.dblClick(titleBar())
    expect(geometry()).toMatchObject({ left: '82px', top: '80px' })
  })

  it('drags by the title bar', () => {
    openTerminal()
    expect(geometry()).toEqual({ left: '82px', top: '80px', width: '860px', height: '640px' })
    fireEvent.mouseDown(titleBar(), { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(window, { clientX: 150, clientY: 130 })
    expect(geometry()).toMatchObject({ left: '132px', top: '110px' })
    expect(dialog().style.transition, 'no easing while dragging').toBe('none')
    fireEvent.mouseUp(window)
    expect(dialog().style.transition, 'easing back after the drag').toContain('left 0.25s')
    fireEvent.mouseMove(window, { clientX: 400, clientY: 400 })
    expect(geometry(), 'stops following after mouseup').toMatchObject({ left: '132px', top: '110px' })
  })

  it('pressing a traffic light does not start a drag', () => {
    openTerminal()
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Maximize terminal' }), { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 50, clientY: 50 })
    expect(geometry()).toMatchObject({ left: '82px', top: '80px' })
  })

  it('resizes from a corner handle', () => {
    openTerminal()
    fireEvent.mouseDown(dialog().querySelector('[data-edge="se"]')!, { clientX: 0, clientY: 0 })
    fireEvent.mouseMove(window, { clientX: 40, clientY: 20 })
    expect(geometry()).toEqual({ left: '82px', top: '80px', width: '900px', height: '660px' })
    fireEvent.mouseUp(window)
  })

  it('removes its window listeners if it closes mid-drag', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    openTerminal()
    fireEvent.mouseDown(titleBar(), { clientX: 0, clientY: 0 })
    const added = add.mock.calls.filter(([type]) => type === 'mousemove' || type === 'mouseup')
    expect(added.map(([type]) => type)).toEqual(['mousemove', 'mouseup'])
    fireEvent.keyDown(prompt(), { key: 'Escape' })
    for (const [type, listener] of added) {
      expect(remove, `${type} listener removed on close`).toHaveBeenCalledWith(type, listener)
    }
  })
})
