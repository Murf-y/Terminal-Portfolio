import { fireEvent, screen } from '@testing-library/dom'
import { describe, expect, it } from 'vitest'
import PageHeader from '@components/PageHeader.astro'
import { initTerminalLaunchers } from '@scripts/terminal-launcher'
import { mount } from '../../tests/astro'

describe('initTerminalLaunchers', () => {
  it('loads the terminal on first click and opens it', async () => {
    await mount(PageHeader)
    initTerminalLaunchers()
    expect(screen.queryByRole('dialog')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Open terminal mode' }))
    const dialog = await screen.findByRole('dialog', { name: 'Terminal' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Close terminal' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
