import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

afterEach(() => {
  document.body.replaceChildren()
  document.body.removeAttribute('style')
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})
