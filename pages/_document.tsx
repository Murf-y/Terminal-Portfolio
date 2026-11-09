import { Head, Html, Main, NextScript } from 'next/document'
import { DEFAULT_THEME, THEME_INIT_SCRIPT } from '@lib/theme'

export default function Document() {
  return (
    <Html lang="en" data-theme={DEFAULT_THEME}>
      <Head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
