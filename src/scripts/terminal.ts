/* Terminal mode: a macOS-style modal terminal, draggable, resizable and theme-aware.
   Loaded on first open by src/scripts/terminal-launcher.ts. */
import {
  ANALYTICS_EVENTS,
  type TerminalCloseMethod,
  terminalCommandProperties,
} from '@lib/analytics'
import { interpretCommand } from '@lib/terminalCommands'
import type { OutputLine } from '@lib/terminalContent'
import {
  EDGES,
  type Edge,
  type Point,
  type Size,
  centeredPos,
  defaultSize,
  resizeWindow,
} from '@lib/terminalWindow'
import type { Theme } from '@lib/theme'
import { track } from '@scripts/analytics'
import { currentTheme, toggleTheme } from '@scripts/theme'

/** Opened pages get no handle back to this tab. */
const NEW_WINDOW_FEATURES = 'noopener,noreferrer'
const FOCUSABLE_SELECTOR = 'button, input, a[href]'
const WINDOW_TRANSITION = 'left 0.25s ease, top 0.25s ease, width 0.25s ease, height 0.25s ease'
const NO_TRANSITION = 'none'
const DIVIDER_WIDTH = 52
const PROMPT_SYMBOL = '❯'
/* Shared by the live prompt and echoed command lines, so both always look the same. */
const PROMPT_ROW_CLASS = 'mt-1 flex items-center gap-2'
const PROMPT_SYMBOL_CLASS = 'select-none font-semibold text-accent'

const LOGO_FOR_THEME: Record<Theme, string> = {
  dark: '/images/Logo.png',
  light: '/images/Logo_dark.png',
}

const MAXIMIZE_LABEL = 'Maximize terminal'
const RESTORE_LABEL = 'Restore terminal size'

/* Edges are 6px strips inset 8px from the corners; corners are 10px squares above them. */
const RESIZE_HANDLE_CLASS: Record<Edge, string> = {
  n: 'top-0 left-[8px] right-[8px] h-[6px] cursor-n-resize z-20',
  s: 'bottom-0 left-[8px] right-[8px] h-[6px] cursor-s-resize z-20',
  w: 'top-[8px] bottom-[8px] left-0 w-[6px] cursor-w-resize z-20',
  e: 'top-[8px] bottom-[8px] right-0 w-[6px] cursor-e-resize z-20',
  nw: 'top-0 left-0 w-[10px] h-[10px] cursor-nw-resize z-30',
  ne: 'top-0 right-0 w-[10px] h-[10px] cursor-ne-resize z-30',
  sw: 'bottom-0 left-0 w-[10px] h-[10px] cursor-sw-resize z-30',
  se: 'bottom-0 right-0 w-[10px] h-[10px] cursor-se-resize z-30',
}

const ASCII_BANNER = `
 ██████╗██╗  ██╗ █████╗ ██████╗ ██████╗ ███████╗██╗
██╔════╝██║  ██║██╔══██╗██╔══██╗██╔══██╗██╔════╝██║
██║     ███████║███████║██████╔╝██████╔╝█████╗  ██║
██║     ██╔══██║██╔══██║██╔══██╗██╔══██╗██╔══╝  ██║
╚██████╗██║  ██║██║  ██║██║  ██║██████╔╝███████╗███████╗
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝`.trim()

const WELCOME: OutputLine[] = [
  ...ASCII_BANNER.split('\n').map((content): OutputLine => ({ type: 'ascii', content })),
  { type: 'output', content: '' },
  { type: 'output', content: "  Welcome to Charbel Fayad's terminal." },
  { type: 'output', content: '  Type "help" to see available commands.' },
  { type: 'output', content: '' },
]

/* Static markup only: every piece of text that varies is set through textContent below. */
const WINDOW_MARKUP = `
  <div role="dialog" aria-modal="true" aria-label="Terminal"
    class="absolute flex flex-col overflow-hidden rounded-xl border border-rule bg-terminal-bg shadow-2xl">
    ${EDGES.map((edge) => `<div data-edge="${edge}" class="absolute ${RESIZE_HANDLE_CLASS[edge]}"></div>`).join('')}
    <div data-title-bar
      class="flex flex-shrink-0 cursor-grab select-none items-center justify-between border-b border-terminal-border bg-terminal-bar px-4 py-2.5 active:cursor-grabbing">
      <div data-traffic-lights class="flex items-center gap-2">
        <button type="button" data-close aria-label="Close terminal"
          class="group relative h-3 w-3 rounded-full bg-[#ff5f57] transition-all duration-150 hover:brightness-110">
          <svg aria-hidden="true" class="absolute inset-0 h-3 w-3 text-[#4a0002] opacity-0 transition-opacity group-hover:opacity-100" viewBox="0 0 12 12">
            <path d="M3.5 3.5l5 5M8.5 3.5l-5 5" stroke="currentColor" stroke-width="1.2" fill="none" />
          </svg>
        </button>
        <span aria-hidden="true" class="h-3 w-3 rounded-full bg-[#febc2e]"></span>
        <button type="button" data-maximize aria-label="${MAXIMIZE_LABEL}"
          class="group relative h-3 w-3 rounded-full bg-[#28c840] transition-all duration-150 hover:brightness-110">
          <svg aria-hidden="true" class="absolute inset-0 h-3 w-3 text-[#0b5515] opacity-0 transition-opacity group-hover:opacity-100" viewBox="0 0 12 12">
            <path d="M3 6h6M6 3v6" stroke="currentColor" stroke-width="1.2" fill="none" />
          </svg>
        </button>
      </div>
      <div class="flex items-center gap-2">
        <img data-logo alt="" width="16" height="16" class="h-4 w-4 opacity-60" />
        <span class="font-mono text-[11px] tracking-wide text-terminal-title">charbel@portfolio: ~</span>
      </div>
      <div class="w-[52px]"></div>
    </div>
    <div data-terminal-body
      class="terminal-scrollbar flex-1 cursor-text overflow-y-auto overflow-x-hidden px-4 py-4 font-mono text-[12px] leading-[1.7] sm:px-5 sm:text-[13px]">
      <div data-output></div>
      <div class="${PROMPT_ROW_CLASS}">
        <span class="${PROMPT_SYMBOL_CLASS}">${PROMPT_SYMBOL}</span>
        <input type="text" aria-label="Terminal command" placeholder="type a command..."
          spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"
          class="flex-1 border-none bg-transparent font-mono text-[12px] text-text caret-accent outline-none placeholder:text-muted sm:text-[13px]" />
      </div>
    </div>
  </div>`

class TerminalMarkupError extends Error {
  constructor(selector: string) {
    super(`Terminal markup is missing ${selector}`)
    this.name = 'TerminalMarkupError'
  }
}

function part<T extends Element>(root: Element, selector: string): T {
  const element = root.querySelector<T>(selector)
  if (element === null) throw new TerminalMarkupError(selector)
  return element
}

function div(className: string, content: string): HTMLDivElement {
  const element = document.createElement('div')
  element.className = className
  element.textContent = content
  return element
}

function lineElement(line: OutputLine): HTMLElement {
  switch (line.type) {
    case 'command': {
      const row = div(PROMPT_ROW_CLASS, '')
      row.append(
        Object.assign(document.createElement('span'), {
          className: PROMPT_SYMBOL_CLASS,
          textContent: PROMPT_SYMBOL,
        }),
        Object.assign(document.createElement('span'), {
          className: 'text-text',
          textContent: line.content,
        })
      )
      return row
    }
    case 'ascii':
      return div(
        'select-none whitespace-pre text-[9px] leading-[1.15] text-accent sm:text-[11px]',
        line.content
      )
    case 'heading':
      return div('whitespace-pre font-semibold text-accent', line.content)
    case 'error':
      return div('whitespace-pre text-error', line.content)
    case 'link': {
      const row = div('whitespace-pre', '')
      row.append(
        Object.assign(document.createElement('a'), {
          href: line.href,
          target: '_blank',
          rel: 'noreferrer',
          className: 'cursor-pointer text-accent hover:underline',
          textContent: line.content,
        })
      )
      return row
    }
    case 'divider':
      return div('my-1 select-none text-rule', `  ${'─'.repeat(DIVIDER_WIDTH)}`)
    case 'output':
      return div('min-h-[1.7em] whitespace-pre text-text', line.content)
  }
}

/** One printed line, tagged with its kind in data-line. */
function renderLine(line: OutputLine): HTMLElement {
  const element = lineElement(line)
  element.dataset.line = line.type
  return element
}

const viewport = (): Size => ({ w: window.innerWidth, h: window.innerHeight })

let isOpen = false

/** Opens terminal mode over the page. Does nothing if it is already open. */
export function openTerminal(): void {
  if (isOpen) return

  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
  /** For the session length reported when the terminal closes. */
  const openedAt = performance.now()
  const backdrop = document.createElement('div')
  backdrop.className = 'fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm'
  backdrop.innerHTML = WINDOW_MARKUP

  const dialog = part<HTMLElement>(backdrop, '[role="dialog"]')
  const titleBar = part<HTMLElement>(backdrop, '[data-title-bar]')
  const body = part<HTMLElement>(backdrop, '[data-terminal-body]')
  const output = part<HTMLElement>(backdrop, '[data-output]')
  const input = part<HTMLInputElement>(backdrop, 'input')
  const logo = part<HTMLImageElement>(backdrop, '[data-logo]')
  const maximize = part<HTMLButtonElement>(backdrop, '[data-maximize]')
  const handles = EDGES.map((edge) => ({
    edge,
    element: part<HTMLElement>(backdrop, `[data-edge="${edge}"]`),
  }))

  /* ─── Window geometry: null position and size mean centred at the default size ─── */
  let pos: Point | null = null
  let size: Size | null = null
  let isMaximized = false
  let isDragging = false

  const currentSize = (): Size => (isMaximized ? viewport() : (size ?? defaultSize(viewport())))
  const currentPos = (): Point =>
    isMaximized ? { x: 0, y: 0 } : (pos ?? centeredPos(currentSize(), viewport()))

  const layout = () => {
    const { w, h } = currentSize()
    const { x, y } = currentPos()
    Object.assign(dialog.style, {
      left: `${x}px`,
      top: `${y}px`,
      width: `${w}px`,
      height: `${h}px`,
      transition: isMaximized || isDragging ? NO_TRANSITION : WINDOW_TRANSITION,
    })
    dialog.classList.toggle('rounded-xl', !isMaximized)
    for (const { element } of handles) element.hidden = isMaximized
    maximize.setAttribute('aria-label', isMaximized ? RESTORE_LABEL : MAXIMIZE_LABEL)
  }

  const toggleMaximized = () => {
    isMaximized = !isMaximized
    layout()
    track(ANALYTICS_EVENTS.TERMINAL_MAXIMIZE_TOGGLED, { maximized: isMaximized })
  }

  /** Removes the window listeners of the drag or resize in progress, if any. */
  let detachPointer: (() => void) | null = null

  /* Follows the pointer until mouseup; a drag still running at close is detached there. */
  const trackPointer = (start: Point, onMove: (dx: number, dy: number) => void) => {
    detachPointer?.()
    const handleMove = (event: MouseEvent) => {
      onMove(event.clientX - start.x, event.clientY - start.y)
      layout()
    }
    const handleUp = () => {
      detachPointer?.()
      isDragging = false
      layout()
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    detachPointer = () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      detachPointer = null
    }
    isDragging = true
    layout()
  }

  titleBar.addEventListener('mousedown', (event) => {
    if (isMaximized) return
    event.preventDefault()
    const origin = currentPos()
    trackPointer({ x: event.clientX, y: event.clientY }, (dx, dy) => {
      pos = { x: origin.x + dx, y: origin.y + dy }
    })
  })
  titleBar.addEventListener('dblclick', toggleMaximized)
  // The traffic lights are buttons, not a drag handle.
  part(backdrop, '[data-traffic-lights]').addEventListener('mousedown', (event) =>
    event.stopPropagation()
  )

  for (const { edge, element } of handles) {
    element.addEventListener('mousedown', (event) => {
      if (isMaximized) return
      event.preventDefault()
      event.stopPropagation()
      const origin = currentPos()
      const originSize = currentSize()
      trackPointer({ x: event.clientX, y: event.clientY }, (dx, dy) => {
        const next = resizeWindow(edge, origin, originSize, dx, dy, viewport())
        size = next.size
        pos = next.pos
      })
    })
  }

  /* ─── Output ─── */
  const print = (lines: OutputLine[]) => {
    output.append(...lines.map(renderLine))
    body.scrollTop = body.scrollHeight
  }
  const clearScreen = () => output.replaceChildren()

  /* ─── Commands ─── */
  /** Newest first. */
  const commandHistory: string[] = []
  /** Position in commandHistory while walking it with the arrow keys; -1 is the empty prompt. */
  let historyIndex = -1

  const runCommand = (raw: string) => {
    input.value = ''
    historyIndex = -1
    const result = interpretCommand(raw, currentTheme())
    if (result === null) {
      print([{ type: 'command', content: raw }])
      return
    }
    commandHistory.unshift(raw)
    track(ANALYTICS_EVENTS.TERMINAL_COMMAND_RUN, terminalCommandProperties(raw, result))
    const action = result.action
    if (action?.type === 'exit') {
      close('exit_command')
      return
    }
    if (action?.type === 'clear') {
      clearScreen()
      return
    }
    print([{ type: 'command', content: raw }, ...result.output])
    if (action?.type === 'navigate') {
      close('navigate_command')
      window.location.assign(action.route)
    } else if (action?.type === 'open') {
      window.open(action.url, '_blank', NEW_WINDOW_FEATURES)
    } else if (action?.type === 'toggle-theme') {
      logo.src = LOGO_FOR_THEME[toggleTheme('terminal')]
    }
  }

  const recall = (index: number) => {
    historyIndex = index
    input.value = index === -1 ? '' : commandHistory[index]
  }

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      runCommand(input.value)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (commandHistory.length > 0) recall(Math.min(historyIndex + 1, commandHistory.length - 1))
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      recall(Math.max(historyIndex - 1, -1))
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault()
      clearScreen()
    }
  })

  /* Escape closes; Tab and Shift+Tab cycle inside the dialog instead of reaching the page. */
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      close('escape_key')
      return
    }
    if (event.key !== 'Tab') return
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  })

  /* Close only on a click that both starts and ends on the backdrop. A resize released past the
     window's edge also produces a click on the backdrop, its nearest common ancestor. */
  let pressStartedOnBackdrop = false
  backdrop.addEventListener('mousedown', (event) => {
    pressStartedOnBackdrop = event.target === backdrop
  })
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop && pressStartedOnBackdrop) close('backdrop')
  })
  body.addEventListener('click', () => input.focus())
  part(backdrop, '[data-close]').addEventListener('click', () => close('close_button'))
  maximize.addEventListener('click', toggleMaximized)

  /* The page's listeners all live on the backdrop's subtree, which close() discards. */
  function close(method: TerminalCloseMethod): void {
    detachPointer?.()
    backdrop.remove()
    document.body.style.overflow = ''
    isOpen = false
    opener?.focus()
    track(ANALYTICS_EVENTS.TERMINAL_CLOSED, {
      close_method: method,
      duration_ms: Math.round(performance.now() - openedAt),
      commands_run: commandHistory.length,
    })
  }

  logo.src = LOGO_FOR_THEME[currentTheme()]
  print(WELCOME)
  layout()
  document.body.append(backdrop)
  // The terminal is a modal overlay; stop the page behind it from scrolling.
  document.body.style.overflow = 'hidden'
  isOpen = true
  input.focus()
  track(ANALYTICS_EVENTS.TERMINAL_OPENED)
}
