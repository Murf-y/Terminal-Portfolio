import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useTheme } from '@hooks/useTheme'
import { trackTerminalCommand } from '@hooks/useAnalytics'
import { OutputLine, nextId } from '@lib/terminalContent'
import { interpretCommand } from '@lib/terminalCommands'

/* ═══════════════════════════════════════════
   Terminal Mode — macOS-style interactive terminal
   Draggable, resizable, theme-aware modal dialog
   ═══════════════════════════════════════════ */

/* ─── Size constraints ─── */
const MIN_W = 400
const MIN_H = 300
const MAX_W_RATIO = 0.95 // of viewport
const MAX_H_RATIO = 0.92

/* ─── Default window size ─── */
const MOBILE_BREAKPOINT = 640
const MOBILE_INSET = 24
const DEFAULT_MAX_W = 860
const DEFAULT_W_RATIO = 0.85
const DEFAULT_MAX_H = 680
const DEFAULT_H_RATIO = 0.8

const WINDOW_TRANSITION = 'left 0.25s ease, top 0.25s ease, width 0.25s ease, height 0.25s ease'
const DIVIDER_WIDTH = 52

/** Opened pages get no handle back to this tab. */
export const NEW_WINDOW_FEATURES = 'noopener,noreferrer'
const FOCUSABLE_SELECTOR = 'button, input, a[href]'

type Edge = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se'

/* Edges are 6px strips inset 8px from the corners; corners are 10px squares above them. */
const RESIZE_HANDLES: Array<{ edge: Edge; className: string }> = [
  { edge: 'n', className: 'top-0 left-[8px] right-[8px] h-[6px] cursor-n-resize z-20' },
  { edge: 's', className: 'bottom-0 left-[8px] right-[8px] h-[6px] cursor-s-resize z-20' },
  { edge: 'w', className: 'top-[8px] bottom-[8px] left-0 w-[6px] cursor-w-resize z-20' },
  { edge: 'e', className: 'top-[8px] bottom-[8px] right-0 w-[6px] cursor-e-resize z-20' },
  { edge: 'nw', className: 'top-0 left-0 w-[10px] h-[10px] cursor-nw-resize z-30' },
  { edge: 'ne', className: 'top-0 right-0 w-[10px] h-[10px] cursor-ne-resize z-30' },
  { edge: 'sw', className: 'bottom-0 left-0 w-[10px] h-[10px] cursor-sw-resize z-30' },
  { edge: 'se', className: 'bottom-0 right-0 w-[10px] h-[10px] cursor-se-resize z-30' },
]

/* ─── ASCII art header ─── */
const ASCII_BANNER = `
 ██████╗██╗  ██╗ █████╗ ██████╗ ██████╗ ███████╗██╗
██╔════╝██║  ██║██╔══██╗██╔══██╗██╔══██╗██╔════╝██║
██║     ███████║███████║██████╔╝██████╔╝█████╗  ██║
██║     ██╔══██║██╔══██║██╔══██╗██╔══██╗██╔══╝  ██║
╚██████╗██║  ██║██║  ██║██║  ██║██████╔╝███████╗███████╗
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝`.trim()

interface Size {
  w: number
  h: number
}
interface Point {
  x: number
  y: number
}

function defaultSize(): Size {
  const vw = window.innerWidth
  const vh = window.innerHeight
  if (vw < MOBILE_BREAKPOINT) return { w: vw - MOBILE_INSET, h: vh - MOBILE_INSET }
  return {
    w: Math.min(DEFAULT_MAX_W, vw * DEFAULT_W_RATIO),
    h: Math.min(vh * DEFAULT_H_RATIO, DEFAULT_MAX_H),
  }
}

function centeredPos(size: Size): Point {
  return { x: (window.innerWidth - size.w) / 2, y: (window.innerHeight - size.h) / 2 }
}

/** New window geometry after dragging `edge` by (dx, dy), clamped to the size limits. */
export function resizeWindow(edge: Edge, origin: Point, size: Size, dx: number, dy: number) {
  const maxW = window.innerWidth * MAX_W_RATIO
  const maxH = window.innerHeight * MAX_H_RATIO
  const clampW = (w: number) => Math.max(MIN_W, Math.min(maxW, w))
  const clampH = (h: number) => Math.max(MIN_H, Math.min(maxH, h))
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

interface TerminalProps {
  onExit: () => void
}

const Terminal: React.FC<TerminalProps> = ({ onExit }) => {
  const router = useRouter()
  const { theme, toggle } = useTheme()
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<OutputLine[]>([])
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const logoSrc = theme === 'light' ? '/images/Logo_dark.png' : '/images/Logo.png'

  /* ─── Window geometry ─── */
  const [pos, setPos] = useState<Point | null>(null) // null = centered
  const [size, setSize] = useState<Size | null>(null) // null = default
  const [isMaximized, setIsMaximized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  /** Removes the window listeners of the drag or resize in progress, if any. */
  const detachPointerRef = useRef<(() => void) | null>(null)

  const currentSize: Size = isMaximized
    ? { w: window.innerWidth, h: window.innerHeight }
    : size ?? defaultSize()
  const currentPos: Point = isMaximized ? { x: 0, y: 0 } : pos ?? centeredPos(currentSize)

  /* Follows the pointer until mouseup; a drag still running at unmount is detached below. */
  const trackPointer = useCallback((start: Point, onMove: (dx: number, dy: number) => void) => {
    detachPointerRef.current?.()
    const handleMove = (ev: MouseEvent) => onMove(ev.clientX - start.x, ev.clientY - start.y)
    const detach = () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      detachPointerRef.current = null
    }
    const handleUp = () => {
      detach()
      setIsDragging(false)
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    detachPointerRef.current = detach
    setIsDragging(true)
  }, [])

  useEffect(() => () => detachPointerRef.current?.(), [])

  const onTitleBarMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return
    e.preventDefault()
    const origin = currentPos
    trackPointer({ x: e.clientX, y: e.clientY }, (dx, dy) =>
      setPos({ x: origin.x + dx, y: origin.y + dy })
    )
  }

  const startResize = (edge: Edge, e: React.MouseEvent) => {
    if (isMaximized) return
    e.preventDefault()
    e.stopPropagation()
    const origin = currentPos
    const originSize = currentSize
    trackPointer({ x: e.clientX, y: e.clientY }, (dx, dy) => {
      const next = resizeWindow(edge, origin, originSize, dx, dy)
      setSize(next.size)
      setPos(next.pos)
    })
  }

  const toggleMaximized = useCallback(() => setIsMaximized((m) => !m), [])

  /* Welcome banner on mount */
  useEffect(() => {
    const welcome: OutputLine[] = [
      ...ASCII_BANNER.split('\n').map((line) => ({
        id: nextId(),
        type: 'ascii' as const,
        content: line,
      })),
      { id: nextId(), type: 'output', content: '' },
      { id: nextId(), type: 'output', content: "  Welcome to Charbel Fayad's terminal." },
      { id: nextId(), type: 'output', content: '  Type "help" to see available commands.' },
      { id: nextId(), type: 'output', content: '' },
    ]
    setHistory(welcome)
  }, [])

  /* Modal focus: move focus into the prompt, and hand it back to the opener on close. */
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    inputRef.current?.focus()
    return () => opener?.focus()
  }, [])

  /* Scroll to bottom on new output */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history])

  const focusInput = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  const runCommand = useCallback(
    (raw: string) => {
      const result = interpretCommand(raw, theme)
      const action = result.action
      setInput('')
      if (action?.type === 'exit') {
        onExit()
        return
      }
      if (action?.type === 'clear') {
        setHistory([])
        return
      }

      const commandLine: OutputLine = { id: nextId(), type: 'command', content: raw }
      setHistory((h) => [...h, commandLine, ...result.output])
      if (result.label === null) return

      setCmdHistory((h) => [raw, ...h])
      setHistoryIndex(-1)
      trackTerminalCommand(result.label)

      if (action?.type === 'navigate') {
        onExit()
        router.push(action.route)
      } else if (action?.type === 'open') {
        window.open(action.url, '_blank', NEW_WINDOW_FEATURES)
      } else if (action?.type === 'toggle-theme') {
        toggle()
      }
    },
    [onExit, router, theme, toggle]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      runCommand(input)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (cmdHistory.length > 0) {
        const newIdx = Math.min(historyIndex + 1, cmdHistory.length - 1)
        setHistoryIndex(newIdx)
        setInput(cmdHistory[newIdx])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIdx = historyIndex - 1
        setHistoryIndex(newIdx)
        setInput(cmdHistory[newIdx])
      } else {
        setHistoryIndex(-1)
        setInput('')
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setHistory([])
    }
  }

  /* Escape closes; Tab and Shift+Tab cycle inside the dialog instead of reaching the page. */
  const handleDialogKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onExit()
      return
    }
    if (e.key !== 'Tab') return
    const focusable = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const renderLine = (line: OutputLine) => {
    switch (line.type) {
      case 'command':
        return (
          <div key={line.id} className="flex items-center gap-2 mt-1">
            <span className="text-accent font-semibold select-none">❯</span>
            <span className="text-text">{line.content}</span>
          </div>
        )
      case 'ascii':
        return (
          <div
            key={line.id}
            className="text-accent text-[9px] sm:text-[11px] leading-[1.15] whitespace-pre select-none"
          >
            {line.content}
          </div>
        )
      case 'heading':
        return (
          <div key={line.id} className="text-accent font-semibold whitespace-pre">
            {line.content}
          </div>
        )
      case 'error':
        return (
          <div key={line.id} className="text-error whitespace-pre">
            {line.content}
          </div>
        )
      case 'link':
        return (
          <div key={line.id} className="whitespace-pre">
            <a
              href={line.href}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline cursor-pointer"
            >
              {line.content}
            </a>
          </div>
        )
      case 'divider':
        return (
          <div key={line.id} className="text-rule select-none my-1">
            {'  ' + '─'.repeat(DIVIDER_WIDTH)}
          </div>
        )
      default:
        return (
          <div key={line.id} className="min-h-[1.7em] text-text whitespace-pre">
            {line.content}
          </div>
        )
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        // Click on backdrop (not terminal) = close
        if (e.target === e.currentTarget) onExit()
      }}
    >
      {/* Terminal Window */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Terminal"
        onKeyDown={handleDialogKeyDown}
        className={`absolute flex flex-col overflow-hidden shadow-2xl border border-rule bg-terminal-bg ${
          isMaximized ? 'rounded-none' : 'rounded-xl'
        }`}
        style={{
          left: currentPos.x,
          top: currentPos.y,
          width: currentSize.w,
          height: currentSize.h,
          transition: isMaximized || isDragging ? 'none' : WINDOW_TRANSITION,
        }}
      >
        {/* ─── Resize handles (8 edges) ─── */}
        {!isMaximized &&
          RESIZE_HANDLES.map(({ edge, className }) => (
            <div
              key={edge}
              data-edge={edge}
              className={`absolute ${className}`}
              onMouseDown={(e) => startResize(edge, e)}
            />
          ))}

        {/* ─── Title Bar (macOS-style) — draggable ─── */}
        <div
          data-testid="terminal-title-bar"
          className="flex items-center justify-between px-4 py-2.5 border-b border-terminal-border bg-terminal-bar select-none flex-shrink-0 cursor-grab active:cursor-grabbing"
          onMouseDown={onTitleBarMouseDown}
          onDoubleClick={toggleMaximized}
        >
          {/* Traffic lights */}
          <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
            <button
              onClick={onExit}
              className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 transition-all duration-150 group relative"
              aria-label="Close terminal"
            >
              <svg
                className="absolute inset-0 w-3 h-3 text-[#4a0002] opacity-0 group-hover:opacity-100 transition-opacity"
                viewBox="0 0 12 12"
              >
                <path
                  d="M3.5 3.5l5 5M8.5 3.5l-5 5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  fill="none"
                />
              </svg>
            </button>
            <span aria-hidden="true" className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <button
              onClick={toggleMaximized}
              className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-110 transition-all duration-150 group relative"
              aria-label={isMaximized ? 'Restore terminal size' : 'Maximize terminal'}
            >
              <svg
                className="absolute inset-0 w-3 h-3 text-[#0b5515] opacity-0 group-hover:opacity-100 transition-opacity"
                viewBox="0 0 12 12"
              >
                <path d="M3 6h6M6 3v6" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>
            </button>
          </div>

          {/* Tab */}
          <div className="flex items-center gap-2">
            <img src={logoSrc} alt="" className="w-4 h-4 opacity-60" />
            <span className="font-mono text-[11px] tracking-wide text-terminal-title">
              charbel@portfolio: ~
            </span>
          </div>

          {/* Spacer to balance layout */}
          <div className="w-[52px]" />
        </div>

        {/* ─── Terminal Body ─── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-5 py-4 font-mono text-[12px] sm:text-[13px] leading-[1.7] cursor-text terminal-scrollbar"
          onClick={focusInput}
        >
          {history.map(renderLine)}

          {/* Input line */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-accent font-semibold select-none">❯</span>
            <input
              ref={inputRef}
              type="text"
              aria-label="Terminal command"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-text outline-none border-none font-mono text-[12px] sm:text-[13px] caret-accent placeholder:text-muted"
              placeholder="type a command..."
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Terminal
