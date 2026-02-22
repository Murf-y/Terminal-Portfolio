import '../styles/globals.css'
import type { AppProps } from 'next/app'
import 'nprogress/nprogress.css'
import dynamic from 'next/dynamic'
import Layout from '@components/Layout'
import { ThemeProvider } from '@hooks/useTheme'

/* bundle-dynamic-imports: progress bar uses window — skip SSR */
const TopProgressBar = dynamic(() => import('@components/TopProgressBar'), {
  ssr: false,
})

/* bundle-defer-third-party: analytics is non-critical — lazy-load it */
const GoogleAnalytics = dynamic(
  () => import('nextjs-google-analytics').then((mod) => mod.GoogleAnalytics),
  { ssr: false }
)

function MyApp({ Component, pageProps, router }: AppProps) {
  return (
    <ThemeProvider>
      <TopProgressBar />
      <Layout>
        <Component {...pageProps} key={router.route} />
      </Layout>
      <GoogleAnalytics trackPageViews />
    </ThemeProvider>
  )
}

export default MyApp
