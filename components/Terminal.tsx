import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useTheme } from '@hooks/useTheme'
import projects_json from '../public/data/projects.json'
import papers_json from '../public/data/papers.json'

/* ═══════════════════════════════════════════
   Terminal Mode — macOS-style interactive terminal
   ═══════════════════════════════════════════ */

interface OutputLine {
  id: number
  type: 'command' | 'output' | 'error' | 'ascii' | 'divider' | 'link' | 'heading'
  content: string
  href?: string
}

let lineIdCounter = 0
const nextId = () => ++lineIdCounter

/* ─── ASCII art header ─── */
const ASCII_BANNER = `
 ██████╗██╗  ██╗ █████╗ ██████╗ ██████╗ ███████╗██╗
██╔════╝██║  ██║██╔══██╗██╔══██╗██╔══██╗██╔════╝██║
██║     ███████║███████║██████╔╝██████╔╝█████╗  ██║
██║     ██╔══██║██╔══██║██╔══██╗██╔══██╗██╔══╝  ██║
╚██████╗██║  ██║██║  ██║██║  ██║██████╔╝███████╗███████╗
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝`.trim()

/* ─── Command definitions ─── */
function buildHelp(): OutputLine[] {
  return [
    { id: nextId(), type: 'heading', content: '' },
    { id: nextId(), type: 'output', content: '  Available commands:' },
    { id: nextId(), type: 'output', content: '' },
    { id: nextId(), type: 'output', content: '  help                Show this help message' },
    { id: nextId(), type: 'output', content: '  cat about.md        About me' },
    { id: nextId(), type: 'output', content: '  cat projects.md     List all projects' },
    { id: nextId(), type: 'output', content: '  cat research.md     Research papers' },
    { id: nextId(), type: 'output', content: '  cat contact.md      Contact information' },
    { id: nextId(), type: 'output', content: '  cat stack.md        Tech stack' },
    { id: nextId(), type: 'output', content: '  open resume         Open resume (PDF)' },
    { id: nextId(), type: 'output', content: '  open github         Open GitHub profile' },
    { id: nextId(), type: 'output', content: '  theme               Toggle light/dark mode' },
    { id: nextId(), type: 'output', content: '  exit                Return to normal view' },
    { id: nextId(), type: 'output', content: '  clear               Clear terminal' },
    { id: nextId(), type: 'output', content: '' },
    { id: nextId(), type: 'output', content: '  Tip: Use ↑ ↓ to cycle through command history' },
    { id: nextId(), type: 'heading', content: '' },
  ]
}

function buildAbout(): OutputLine[] {
  return [
    { id: nextId(), type: 'divider', content: '' },
    { id: nextId(), type: 'heading', content: '  # about.md' },
    { id: nextId(), type: 'divider', content: '' },
    { id: nextId(), type: 'output', content: '' },
    { id: nextId(), type: 'output', content: '  Charbel Fayad' },
    { id: nextId(), type: 'output', content: '  Software Engineer & Researcher' },
    { id: nextId(), type: 'output', content: '' },
    { id: nextId(), type: 'output', content: '  Currently an Integration Engineer at Murex,' },
    { id: nextId(), type: 'output', content: '  orchestrating 80+ internal and external systems' },
    { id: nextId(), type: 'output', content: '  across on-prem and cloud infrastructure.' },
    { id: nextId(), type: 'output', content: '' },
    { id: nextId(), type: 'output', content: '  Previously interned at NinjaCO and Ajjerni,' },
    { id: nextId(), type: 'output', content: '  building full-stack products from the ground up.' },
    { id: nextId(), type: 'output', content: '' },
    { id: nextId(), type: 'output', content: '  Graduated from the honors program with a' },
    { id: nextId(), type: 'output', content: '  3.97 CGPA, High Distinction, and the Honors' },
    { id: nextId(), type: 'output', content: '  Award in Computer Science.' },
    { id: nextId(), type: 'output', content: '' },
    { id: nextId(), type: 'output', content: '  I publish research in ML and adaptive systems.' },
    { id: nextId(), type: 'output', content: '' },
  ]
}

function buildProjects(): OutputLine[] {
  const lines: OutputLine[] = [
    { id: nextId(), type: 'divider', content: '' },
    { id: nextId(), type: 'heading', content: '  # projects.md' },
    { id: nextId(), type: 'divider', content: '' },
    { id: nextId(), type: 'output', content: '' },
    { id: nextId(), type: 'output', content: `  ${projects_json.projects.length} projects` },
    { id: nextId(), type: 'output', content: '' },
  ]
  projects_json.projects.forEach((p, i) => {
    const tags = p.tags.join(', ')
    lines.push({
      id: nextId(),
      type: 'output',
      content: `  ${String(i + 1).padStart(2, '0')}. ${p.title}`,
    })
    lines.push({
      id: nextId(),
      type: 'output',
      content: `      [${tags}]`,
    })
    lines.push({
      id: nextId(),
      type: 'link',
      content: `      → ${p.link}`,
      href: p.link,
    })
    lines.push({ id: nextId(), type: 'output', content: '' })
  })
  return lines
}

function buildResearch(): OutputLine[] {
  const lines: OutputLine[] = [
    { id: nextId(), type: 'divider', content: '' },
    { id: nextId(), type: 'heading', content: '  # research.md' },
    { id: nextId(), type: 'divider', content: '' },
    { id: nextId(), type: 'output', content: '' },
    { id: nextId(), type: 'output', content: `  ${papers_json.papers.length} publications` },
    { id: nextId(), type: 'output', content: '' },
  ]
  papers_json.papers.forEach((p) => {
    lines.push({
      id: nextId(),
      type: 'heading',
      content: `  ● ${p.title}`,
    })
    lines.push({
      id: nextId(),
      type: 'output',
      content: `    Year: ${p.year}   Tags: ${p.tags.join(', ')}`,
    })
    // Wrap abstract nicely at ~60 chars
    const words = p.abstract.split(' ')
    let line = '    '
    words.forEach((w) => {
      if ((line + w).length > 68) {
        lines.push({ id: nextId(), type: 'output', content: line })
        line = '    ' + w + ' '
      } else {
        line += w + ' '
      }
    })
    if (line.trim()) lines.push({ id: nextId(), type: 'output', content: line })

    lines.push({
      id: nextId(),
      type: 'link',
      content: `    📄 Paper → ${p.paper_link}`,
      href: p.paper_link,
    })
    if (p.github_link) {
      lines.push({
        id: nextId(),
        type: 'link',
        content: `    💻 Code  → ${p.github_link}`,
        href: p.github_link,
      })
    }
    lines.push({ id: nextId(), type: 'output', content: '' })
  })
  return lines
}

function buildContact(): OutputLine[] {
  return [
    { id: nextId(), type: 'divider', content: '' },
    { id: nextId(), type: 'heading', content: '  # contact.md' },
    { id: nextId(), type: 'divider', content: '' },
    { id: nextId(), type: 'output', content: '' },
    {
      id: nextId(),
      type: 'link',
      content: '  ✉  Email         charbelfayad64@gmail.com',
      href: 'mailto:charbelfayad64@gmail.com',
    },
    {
      id: nextId(),
      type: 'link',
      content: '  🐙 GitHub        github.com/Murf-y',
      href: 'https://github.com/Murf-y',
    },
    {
      id: nextId(),
      type: 'link',
      content: '  🔬 ResearchGate  researchgate.net/profile/Charbel-Fayad',
      href: 'https://www.researchgate.net/profile/Charbel-Fayad',
    },
    {
      id: nextId(),
      type: 'link',
      content: '  🆔 ORCID         orcid.org/0009-0007-0529-5003',
      href: 'https://orcid.org/my-orcid?orcid=0009-0007-0529-5003',
    },
    { id: nextId(), type: 'output', content: '' },
  ]
}

function buildStack(): OutputLine[] {
  const techs = [
    'TypeScript',
    'React / Next.js',
    'Node.js / NestJs',
    'Flutter',
    'MuleSoft / Anypoint',
    'MongoDB',
    'Docker',
    'C# / Unity',
    'Python',
    'Strapi',
    'SolidJS',
    'PostgreSQL',
  ]
  return [
    { id: nextId(), type: 'divider', content: '' },
    { id: nextId(), type: 'heading', content: '  # stack.md' },
    { id: nextId(), type: 'divider', content: '' },
    { id: nextId(), type: 'output', content: '' },
    ...techs.map((t) => ({
      id: nextId(),
      type: 'output' as const,
      content: `  ▸ ${t}`,
    })),
    { id: nextId(), type: 'output', content: '' },
  ]
}

/* ═══════════ Terminal Component ═══════════ */

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

  /* Auto-run help on mount */
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

  /* Scroll to bottom on new output */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history])

  /* Focus input on click anywhere */
  const focusInput = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  const runCommand = useCallback(
    (raw: string) => {
      const cmd = raw.trim().toLowerCase()
      const commandLine: OutputLine = {
        id: nextId(),
        type: 'command',
        content: raw,
      }

      let output: OutputLine[] = []

      switch (cmd) {
        case 'help':
          output = buildHelp()
          break
        case 'cat about.md':
          output = buildAbout()
          break
        case 'cat projects.md':
          output = buildProjects()
          break
        case 'cat research.md':
          output = buildResearch()
          break
        case 'cat contact.md':
          output = buildContact()
          break
        case 'cat stack.md':
          output = buildStack()
          break
        case 'open resume':
          window.open('/data/resume.pdf', '_blank')
          output = [{ id: nextId(), type: 'output', content: '  Opening resume.pdf...' }]
          break
        case 'open github':
          window.open('https://github.com/Murf-y', '_blank')
          output = [{ id: nextId(), type: 'output', content: '  Opening github.com/Murf-y...' }]
          break
        case 'theme':
          toggle()
          output = [
            {
              id: nextId(),
              type: 'output',
              content: `  Switched to ${theme === 'dark' ? 'light' : 'dark'} mode.`,
            },
          ]
          break
        case 'clear':
          setHistory([])
          setInput('')
          return
        case 'exit':
          onExit()
          return
        default:
          if (cmd.startsWith('cd ')) {
            const dir = cmd.replace('cd ', '')
            if (['about', 'projects', 'research'].includes(dir)) {
              onExit()
              setTimeout(() => router.push(`/${dir}`), 100)
              output = [{ id: nextId(), type: 'output', content: `  Navigating to /${dir}...` }]
            } else {
              output = [
                { id: nextId(), type: 'error', content: `  cd: no such directory: ${dir}` },
                {
                  id: nextId(),
                  type: 'output',
                  content: '  Try: cd about, cd projects, cd research',
                },
              ]
            }
          } else if (cmd === 'ls') {
            output = [
              { id: nextId(), type: 'output', content: '  about.md    projects.md    research.md' },
              { id: nextId(), type: 'output', content: '  contact.md  stack.md       resume.pdf' },
            ]
          } else if (cmd === 'pwd') {
            output = [{ id: nextId(), type: 'output', content: '  /home/charbel' }]
          } else if (cmd === 'whoami') {
            output = [
              {
                id: nextId(),
                type: 'output',
                content: '  charbel — Software Engineer & Researcher',
              },
            ]
          } else if (cmd === 'date') {
            output = [{ id: nextId(), type: 'output', content: `  ${new Date().toLocaleString()}` }]
          } else if (cmd === 'echo hello' || cmd === 'echo "hello"') {
            output = [{ id: nextId(), type: 'output', content: '  hello' }]
          } else if (cmd.startsWith('echo ')) {
            output = [{ id: nextId(), type: 'output', content: `  ${raw.slice(5)}` }]
          } else if (cmd === 'sudo rm -rf /') {
            output = [
              { id: nextId(), type: 'error', content: '  Nice try. 🙂' },
              { id: nextId(), type: 'output', content: '  But this portfolio is read-only.' },
            ]
          } else if (cmd === 'vim' || cmd === 'nano' || cmd === 'vi') {
            output = [
              { id: nextId(), type: 'output', content: '  Sorry, this is a read-only terminal.' },
              { id: nextId(), type: 'output', content: '  Use "cat <file>.md" to read files.' },
            ]
          } else if (cmd === '') {
            setHistory((h) => [...h, commandLine])
            setInput('')
            return
          } else {
            output = [
              { id: nextId(), type: 'error', content: `  command not found: ${cmd}` },
              { id: nextId(), type: 'output', content: '  Type "help" for available commands.' },
            ]
          }
      }

      setHistory((h) => [...h, commandLine, ...output])
      setCmdHistory((h) => [raw, ...h])
      setHistoryIndex(-1)
      setInput('')
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
          <div key={line.id} className="text-red-400 whitespace-pre">
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
              className="text-accent/80 hover:text-accent hover:underline transition-colors duration-150 cursor-pointer"
            >
              {line.content}
            </a>
          </div>
        )
      case 'divider':
        return (
          <div key={line.id} className="text-border select-none my-1">
            {'  ' + '─'.repeat(52)}
          </div>
        )
      default:
        return (
          <div key={line.id} className="text-bone whitespace-pre">
            {line.content}
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 md:p-10 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-4xl h-full max-h-[85vh] sm:max-h-[80vh] flex flex-col rounded-xl overflow-hidden shadow-2xl border border-border border-opacity-30"
        style={{ background: theme === 'dark' ? '#0d0d0f' : '#f4f4f5' }}
      >
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b select-none flex-shrink-0"
          style={{
            background: theme === 'dark' ? '#1c1c1e' : '#e8e8ea',
            borderColor: theme === 'dark' ? '#2a2a2d' : '#d4d4d8',
          }}
        >
          <div className="flex items-center gap-2">
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
            <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>

          <div className="flex items-center gap-2">
            <img src={logoSrc} alt="" className="w-4 h-4 opacity-60" />
            <span
              className="font-mono text-[11px] tracking-wide"
              style={{ color: theme === 'dark' ? '#8e8e93' : '#6b6b70' }}
            >
              charbel@portfolio: ~
            </span>
          </div>

          <div className="w-[52px]" />
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-5 py-4 font-mono text-[12px] sm:text-[13px] leading-[1.7] cursor-text terminal-scrollbar"
          onClick={focusInput}
        >
          {history.map(renderLine)}

          <div className="flex items-center gap-2 mt-1">
            <span className="text-accent font-semibold select-none">❯</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-text outline-none border-none font-mono text-[12px] sm:text-[13px] caret-accent placeholder:text-muted/40"
              placeholder="type a command..."
              autoFocus
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
