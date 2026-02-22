import Router from 'next/router'
import NProgress from 'nprogress'

const DELAY_MS = 10

let timer: ReturnType<typeof setTimeout> | undefined
let state: 'idle' | 'loading' = 'idle'

function load(): void {
  if (state === 'loading') return
  state = 'loading'
  timer = setTimeout(() => NProgress.start(), DELAY_MS)
}

function stop(): void {
  state = 'idle'
  clearTimeout(timer)
  NProgress.done()
}

Router.events.on('routeChangeStart', load)
Router.events.on('routeChangeComplete', stop)
Router.events.on('routeChangeError', stop)

export default function TopProgressBar(): null {
  return null
}
