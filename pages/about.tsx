import React from 'react'
import ContactLinks from '@components/ContactLinks'
import PageHeader from '@components/PageHeader'
import PageMeta from '@components/PageMeta'
import Section from '@components/Section'
import { ABOUT_PARAGRAPHS, NAME } from '@content/profile'

export default function About() {
  return (
    <>
      <PageMeta title={`About · ${NAME}`} description={ABOUT_PARAGRAPHS[0]} path="/about" />

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
