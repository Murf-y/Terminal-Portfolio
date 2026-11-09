import { describe, expect, it } from 'vitest'
import { UNKNOWN_COMMAND_LABEL, interpretCommand } from '@lib/terminalCommands'
import { HELP_COMMANDS, OutputLine, TERMINAL_ROUTES } from '@lib/terminalContent'
import { HEADLINE, LINKS, RESUME_PATH } from '@content/profile'

const printed = (lines: OutputLine[]) => lines.map((line) => line.content)

describe('interpretCommand', () => {
  it('does nothing and records nothing for blank input', () => {
    expect(interpretCommand('   ', 'dark')).toEqual({ output: [], label: null })
  })

  it('matches commands regardless of case and padding', () => {
    const result = interpretCommand('  WhoAmI ', 'dark')
    expect(printed(result.output)).toEqual([`  charbel — ${HEADLINE}`])
    expect(result.label).toBe('whoami')
  })

  it.each(HELP_COMMANDS.map(([command]) => command).filter((command) => command !== 'cd <page>'))(
    'every command listed in help is implemented: %s',
    (command) => {
      const result = interpretCommand(command, 'dark')
      expect(result.label, `${command} should not fall through to "unknown"`).toBe(command)
    }
  )

  it('opens the résumé and GitHub as actions, not by printing their URLs only', () => {
    expect(interpretCommand('open resume', 'dark').action).toEqual({ type: 'open', url: RESUME_PATH })
    const github = interpretCommand('open github', 'dark')
    expect(github.action).toEqual({ type: 'open', url: LINKS.github })
    expect(printed(github.output)).toEqual(['  Opening github.com/Murf-y...'])
  })

  it('names the theme it switches to', () => {
    expect(printed(interpretCommand('theme', 'dark').output)).toEqual(['  Switched to light mode.'])
    expect(printed(interpretCommand('theme', 'light').output)).toEqual(['  Switched to dark mode.'])
    expect(interpretCommand('theme', 'light').action).toEqual({ type: 'toggle-theme' })
  })

  it('clear and exit are actions with no output', () => {
    expect(interpretCommand('clear', 'dark')).toEqual({ output: [], action: { type: 'clear' }, label: 'clear' })
    expect(interpretCommand('exit', 'dark')).toEqual({ output: [], action: { type: 'exit' }, label: 'exit' })
  })

  it.each(Object.entries(TERMINAL_ROUTES))('cd %s navigates to %s', (name, route) => {
    const result = interpretCommand(`cd ${name}`, 'dark')
    expect(result.action).toEqual({ type: 'navigate', route })
    expect(printed(result.output)).toEqual([`  Navigating to ${route}...`])
    expect(result.label).toBe(`cd ${name}`)
  })

  it.each(['constructor', '__proto__', 'tostring', 'etc'])(
    'cd %s is an unknown directory, not an inherited object member',
    (directory) => {
      const result = interpretCommand(`cd ${directory}`, 'dark')
      expect(result.action, `cd ${directory}`).toBeUndefined()
      expect(result.output[0]).toMatchObject({ type: 'error', content: `  cd: no such directory: ${directory}` })
      expect(result.output[1].content).toBe('  Try: cd home, cd about, cd projects, cd research')
      expect(result.label, 'the typed directory never reaches analytics').toBe('cd')
    }
  )

  it.each(['constructor', '__proto__', 'hasownproperty'])(
    '"%s" alone is not a command',
    (name) => {
      expect(interpretCommand(name, 'dark').label).toBe(UNKNOWN_COMMAND_LABEL)
    }
  )

  it('echoes text with its case intact but reports only "echo"', () => {
    const result = interpretCommand('  echo Hello, my email is me@example.com ', 'dark')
    expect(printed(result.output)).toEqual(['  Hello, my email is me@example.com'])
    expect(result.label).toBe('echo')
  })

  it('reports unknown input as "unknown", never the typed text', () => {
    const result = interpretCommand('my password is hunter2', 'dark')
    expect(result.output[0]).toMatchObject({ type: 'error', content: '  command not found: my password is hunter2' })
    expect(result.label).toBe(UNKNOWN_COMMAND_LABEL)
  })

  it('every label is either null, a known command, "cd", a known cd target or "unknown"', () => {
    const inputs = ['help', 'ls', 'pwd', 'date', 'vim', 'nano', 'vi', 'sudo rm -rf /', 'cd about', 'cd nowhere', 'echo hi', 'rm -rf ~', '']
    const allowed = new Set<string | null>([
      null,
      'cd',
      UNKNOWN_COMMAND_LABEL,
      'echo',
      ...HELP_COMMANDS.map(([command]) => command),
      ...Object.keys(TERMINAL_ROUTES).map((name) => `cd ${name}`),
      'ls', 'pwd', 'date', 'vim', 'nano', 'vi', 'sudo rm -rf /', 'whoami',
    ])
    for (const input of inputs) {
      const { label } = interpretCommand(input, 'dark')
      expect(allowed.has(label), `label for "${input}" was "${label}"`).toBe(true)
    }
  })

  it('prints the read-only notices', () => {
    expect(printed(interpretCommand('vim', 'dark').output)).toEqual([
      '  Sorry, this is a read-only terminal.',
      '  Use "cat <file>.md" to read files.',
    ])
    const sudo = interpretCommand('sudo rm -rf /', 'dark')
    expect(sudo.output.map((line) => line.type)).toEqual(['error', 'output'])
  })

  it('ls lists the files the cat and open commands use', () => {
    expect(printed(interpretCommand('ls', 'dark').output)).toEqual([
      '  about.md    projects.md    research.md',
      '  contact.md  resume.pdf',
    ])
    expect(printed(interpretCommand('pwd', 'dark').output)).toEqual(['  /home/charbel'])
  })
})
