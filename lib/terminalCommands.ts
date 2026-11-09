import { HEADLINE, LINKS, RESUME_PATH } from '@content/profile'
import { type Theme, oppositeTheme } from '@lib/theme'
import {
  LS_OUTPUT,
  type OutputLine,
  TERMINAL_ROUTES,
  buildAbout,
  buildContact,
  buildHelp,
  buildProjects,
  buildResearch,
  resolveRoute,
} from '@lib/terminalContent'

/** Side effect the terminal performs after printing a command's output. */
export type TerminalAction =
  | { type: 'clear' }
  | { type: 'exit' }
  | { type: 'navigate'; route: string }
  | { type: 'open'; url: string }
  | { type: 'toggle-theme' }

export interface CommandResult {
  /** Lines printed after the echoed command line. */
  output: OutputLine[]
  action?: TerminalAction
}

const CD_PREFIX = 'cd '
const ECHO_PREFIX = 'echo '
const HOME_DIRECTORY = '/home/charbel'

const say = (content: string): OutputLine => ({ type: 'output', content: `  ${content}` })
const fail = (content: string): OutputLine => ({ type: 'error', content: `  ${content}` })

type ExactCommand = (theme: Theme) => CommandResult

const READ_ONLY_EDITOR: ExactCommand = () => ({
  output: [say('Sorry, this is a read-only terminal.'), say('Use "cat <file>.md" to read files.')],
})

/** A Map, not an object literal, so inherited names like "constructor" are not commands. */
const EXACT_COMMANDS = new Map<string, ExactCommand>([
  ['help', () => ({ output: buildHelp() })],
  ['cat about.md', () => ({ output: buildAbout() })],
  ['cat projects.md', () => ({ output: buildProjects() })],
  ['cat research.md', () => ({ output: buildResearch() })],
  ['cat contact.md', () => ({ output: buildContact() })],
  [
    'open resume',
    () => ({ output: [say('Opening resume.pdf...')], action: { type: 'open', url: RESUME_PATH } }),
  ],
  [
    'open github',
    () => ({
      output: [say(`Opening ${LINKS.github.replace(/^https:\/\//, '')}...`)],
      action: { type: 'open', url: LINKS.github },
    }),
  ],
  [
    'theme',
    (theme) => ({
      output: [say(`Switched to ${oppositeTheme(theme)} mode.`)],
      action: { type: 'toggle-theme' },
    }),
  ],
  ['clear', () => ({ output: [], action: { type: 'clear' } })],
  ['exit', () => ({ output: [], action: { type: 'exit' } })],
  ['ls', () => ({ output: LS_OUTPUT.map(say) })],
  ['pwd', () => ({ output: [say(HOME_DIRECTORY)] })],
  ['whoami', () => ({ output: [say(`charbel — ${HEADLINE}`)] })],
  ['date', () => ({ output: [say(new Date().toLocaleString())] })],
  [
    'sudo rm -rf /',
    () => ({ output: [fail('Nice try. 🙂'), say('But this portfolio is read-only.')] }),
  ],
  ['vim', READ_ONLY_EDITOR],
  ['nano', READ_ONLY_EDITOR],
  ['vi', READ_ONLY_EDITOR],
])

function changeDirectory(directory: string): CommandResult {
  const route = resolveRoute(directory)
  if (route === undefined) {
    return {
      output: [
        fail(`cd: no such directory: ${directory}`),
        say(`Try: ${Object.keys(TERMINAL_ROUTES).map((name) => `cd ${name}`).join(', ')}`),
      ],
    }
  }
  return { output: [say(`Navigating to ${route}...`)], action: { type: 'navigate', route } }
}

/**
 * Maps one line of terminal input to what to print and do. Matching ignores case and padding.
 * Returns null for blank input, which only echoes an empty prompt.
 */
export function interpretCommand(raw: string, theme: Theme): CommandResult | null {
  const command = raw.trim().toLowerCase()
  if (command === '') return null

  const exact = EXACT_COMMANDS.get(command)
  if (exact !== undefined) return exact(theme)

  if (command.startsWith(CD_PREFIX)) return changeDirectory(command.slice(CD_PREFIX.length).trim())

  if (command.startsWith(ECHO_PREFIX)) {
    // Echo what was typed, case intact.
    return { output: [say(raw.trim().slice(ECHO_PREFIX.length))] }
  }

  return {
    output: [fail(`command not found: ${command}`), say('Type "help" for available commands.')],
  }
}
