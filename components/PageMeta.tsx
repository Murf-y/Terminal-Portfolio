import Head from 'next/head'
import React from 'react'
import { SITE_URL } from '@content/profile'

interface PageMetaProps {
  title: string
  /** Omit on pages that should not carry a search snippet, such as 404. */
  description?: string
  /** Site-relative path of the canonical URL, such as '/about'. Omit on pages without one. */
  path?: string
}

/** Title, description and canonical/Open Graph tags shared by every page. */
const PageMeta: React.FC<PageMetaProps> = ({ title, description, path }) => {
  const url = path === undefined ? undefined : new URL(path, SITE_URL).href
  return (
    <Head>
      <title>{title}</title>
      <meta property="og:title" content={title} />
      {description !== undefined && (
        <>
          <meta name="description" content={description} />
          <meta property="og:description" content={description} />
        </>
      )}
      {url !== undefined && (
        <>
          <link rel="canonical" href={url} />
          <meta property="og:url" content={url} />
        </>
      )}
    </Head>
  )
}

export default PageMeta
