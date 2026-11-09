import '../styles/globals.css'
import type { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import { Inter, JetBrains_Mono } from 'next/font/google'
import Layout from '@components/Layout'
import { TerminalProvider } from '@hooks/useTerminal'
import { ThemeProvider } from '@hooks/useTheme'

const sans = Inter({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-sans' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-mono' })

/* Analytics is non-critical: load it after hydration. */
const GoogleAnalytics = dynamic(
  () => import('nextjs-google-analytics').then((mod) => mod.GoogleAnalytics),
  { ssr: false }
)

function App({ Component, pageProps, router }: AppProps) {
  return (
    <div className={`${sans.variable} ${mono.variable} font-sans`}>
      <ThemeProvider>
        <TerminalProvider>
          <Layout>
            <Component {...pageProps} key={router.route} />
          </Layout>
        </TerminalProvider>
      </ThemeProvider>
      <GoogleAnalytics trackPageViews />
    </div>
  )
}

export default App
