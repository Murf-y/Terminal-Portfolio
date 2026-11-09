import Head from 'next/head'
import React from 'react'
import ContactLinks from '@components/ContactLinks'
import PageHeader from '@components/PageHeader'
import Section from '@components/Section'
import { ABOUT_PARAGRAPHS, NAME } from '@content/profile'

export default function About() {
  return (
    <>
      <Head>
        <title>{`About · ${NAME}`}</title>
        <meta name="description" content={ABOUT_PARAGRAPHS[0]} />
      </Head>

      <PageHeader title="About" />

      <section className="flex flex-col gap-4">
        {ABOUT_PARAGRAPHS.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>

      <Section id="contact" title="Contact">
        <ContactLinks source="about" />
      </Section>
    </>
  )
}
