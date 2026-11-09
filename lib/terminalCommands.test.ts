import { describe, expect, it, vi } from 'vitest'
import { type CommandResult, interpretCommand } from '@lib/terminalCommands'
import { HELP_COMMANDS, type OutputLine, TERMINAL_ROUTES } from '@lib/terminalContent'
import { HEADLINE, LINKS, RESUME_PATH } from '@content/profile'

const printed = (lines: OutputLine[]) => lines.map((line) => line.content)

/** interpretCommand for input that must not be blank. */
function run(input: string, theme: 'dark' | 'light' = 'dark'): CommandResult {
  const result = interpretCommand(input, theme)
  if (result === null) throw new Error(`"${input}" was treated as blank input`)
  return result
}

const isUnknown = (result: CommandResult) =>
  result.output[0]?.type === 'error' && result.output[0].content.startsWith('  command not found:')

describe('interpretCommand', () => {
  it('returns null for blank input, so the terminal only echoes an empty prompt', () => {
    expect(interpretCommand('   ', 'dark')).toBeNull()
    expect(interpretCommand('', 'light')).toBeNull()
  })

  it('matches commands regardless of case and padding', () => {
    expect(printed(run('  WhoAmI ').output)).toEqual([`  charbel — ${HEADLINE}`])
  })

  it.each(HELP_COMMANDS.map(([command]) => command).filter((command) => command !== 'cd <page>'))(
    'every command listed in help is implemented: %s',
    (command) => {
      expect(isUnknown(run(command)), `${command} fell through to "command not found"`).toBe(false)
    }
  )

  it('opens the résumé and GitHub as actions', () => {
    expect(run('open resume').action).toEqual({ type: 'open', url: RESUME_PATH })
    const github = run('open github')
    expect(github.action).toEqual({ type: 'open', url: LINKS.github })
    expect(printed(github.output)).toEqual(['  Opening github.com/Murf-y...'])
  })

  it('names the theme it switches to', () => {
    expect(printed(run('theme', 'dark').output)).toEqual(['  Switched to light mode.'])
    expect(printed(run('theme', 'light').output)).toEqual(['  Switched to dark mode.'])
    expect(run('theme', 'light').action).toEqual({ type: 'toggle-theme' })
  })

  it('clear and exit are actions with no output', () => {
    expect(run('clear')).toEqual({ output: [], action: { type: 'clear' } })
    expect(run('exit')).toEqual({ output: [], action: { type: 'exit' } })
  })

  it.each(Object.entries(TERMINAL_ROUTES))('cd %s navigates to %s', (name, route) => {
    const result = run(`cd ${name}`)
    expect(result.action).toEqual({ type: 'navigate', route })
    expect(printed(result.output)).toEqual([`  Navigating to ${route}...`])
  })

  it.each(['constructor', '__proto__', 'tostring', 'etc'])(
    'cd %s is an unknown directory, not an inherited object member',
    (directory) => {
      const result = run(`cd ${directory}`)
      expect(result.action, `cd ${directory}`).toBeUndefined()
      expect(result.output[0]).toMatchObject({ type: 'error', content: `  cd: no such directory: ${directory}` })
      expect(result.output[1].content).toBe('  Try: cd home, cd about, cd projects, cd research')
    }
  )

  it.each(['constructor', '__proto__', 'hasownproperty'])('"%s" alone is not a command', (name) => {
    expect(isUnknown(run(name))).toBe(true)
  })

  it('echoes text with its case intact', () => {
    expect(printed(run('  echo Hello, World ').output)).toEqual(['  Hello, World'])
  })

  it('reports unknown input with a hint', () => {
    const result = run('rm -rf ~')
    expect(result.output[0]).toMatchObject({ type: 'error', content: '  command not found: rm -rf ~' })
    expect(printed(result.output)[1]).toBe('  Type "help" for available commands.')
    expect(result.action).toBeUndefined()
  })

  it('prints the read-only notices', () => {
    for (const editor of ['vim', 'nano', 'vi']) {
      expect(printed(run(editor).output), editor).toEqual([
        '  Sorry, this is a read-only terminal.',
        '  Use "cat <file>.md" to read files.',
      ])
    }
    expect(run('sudo rm -rf /').output.map((line) => line.type)).toEqual(['error', 'output'])
  })

  it('ls lists the files the cat and open commands use; pwd prints home', () => {
    expect(printed(run('ls').output)).toEqual([
      '  about.md    projects.md    research.md',
      '  contact.md  resume.pdf',
    ])
    expect(printed(run('pwd').output)).toEqual(['  /home/charbel'])
  })

  it('date prints the current local time', () => {
    const now = new Date('2026-11-09T10:30:00Z')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)
    try {
      expect(printed(run('date').output)).toEqual([`  ${now.toLocaleString()}`])
    } finally {
      vi.useRealTimers()
    }
  })
})
