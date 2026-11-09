import Head from 'next/head'
import Link from 'next/link'
import React from 'react'
import PageHeader from '@components/PageHeader'
import { NAME } from '@content/profile'

export default function NotFound() {
  return (
    <>
      <Head>
        <title>{`Page not found · ${NAME}`}</title>
      </Head>

      <PageHeader title="Page not found" />

      <section className="flex flex-col gap-4">
        <p>This page doesn’t exist. It may have moved during the redesign.</p>
        <p>
          <Link href="/" className="text-link">
            Go to the home page
          </Link>
        </p>
      </section>
    </>
  )
}
