import Link from 'next/link'
import React from 'react'
import PageHeader from '@components/PageHeader'
import PageMeta from '@components/PageMeta'
import { NAME } from '@content/profile'

export default function NotFound() {
  return (
    <>
      <PageMeta title={`Page not found · ${NAME}`} />

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
