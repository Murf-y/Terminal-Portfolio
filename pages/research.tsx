import type { NextPage } from 'next'
import Head from 'next/head'
import React, { useState } from 'react'
import Reveal from '@components/Reveal'
import type { Paper } from '@models/paper'
import papers_json from '../public/data/papers.json'
import { trackPaperClick, trackSocialClick, trackAbstractExpand } from '@hooks/useAnalytics'

/* rendering-hoist-jsx: derive static data outside the component */
const papers: Paper[] = papers_json.papers.map((p) => ({
  title: p.title,
  abstract: p.abstract,
  image_path: p.image_path || papers_json.default_image_path,
  tags: p.tags,
  paper_link: p.paper_link,
  github_link: p.github_link,
  year: p.year,
}))

/* ─── Expandable abstract ─── */
const AbstractText: React.FC<{ text: string; title: string }> = ({ text, title }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mb-6">
      <p
        className={`font-mono text-[12px] text-muted leading-[1.8] transition-all duration-300 ${
          expanded ? '' : 'line-clamp-3 sm:line-clamp-4'
        }`}
      >
        {text}
      </p>
      <button
        onClick={() => {
          if (!expanded) trackAbstractExpand(title)
          setExpanded((v) => !v)
        }}
        className="mt-2 font-mono text-[10px] text-accent/80 hover:text-accent tracking-[0.15em] uppercase transition-colors duration-200"
      >
        {expanded ? '— Show less' : '+ Show more'}
      </button>
    </div>
  )
}

const ResearchPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Charbel Fayad - Research</title>
      </Head>

      <section className="min-h-screen px-4 sm:px-6 md:px-12 lg:px-24 pt-24 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-5xl">
          {/* ─── Header ─── */}
          <Reveal>
            <div className="mb-8 sm:mb-12">
              <p className="font-mono text-[11px] text-muted tracking-[0.35em] uppercase mb-4">
                {papers.length} {papers.length === 1 ? 'Publication' : 'Publications'}
              </p>
              <h1 className="font-display text-4xl sm:text-5xl md:text-7xl text-text italic leading-[0.9]">
                Research<span className="text-accent">.</span>
              </h1>
            </div>
          </Reveal>

          {/* ─── Profile Links ─── */}
          <Reveal delay={0.1}>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-14 sm:mb-20">
              <a
                href={papers_json.researchgate}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-mono text-[11px] text-muted border border-border/60 px-3 sm:px-4 py-2 hover:border-accent/40 hover:text-accent transition-all duration-200"
                onClick={() => trackSocialClick('researchgate', 'research_page')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                ResearchGate
              </a>
              <a
                href={papers_json.orcid}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-mono text-[11px] text-muted border border-border/60 px-3 sm:px-4 py-2 hover:border-accent/40 hover:text-accent transition-all duration-200"
                onClick={() => trackSocialClick('orcid', 'research_page')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                  <path d="M9 8h1v8H9z" />
                  <path d="M13 8h2a3 3 0 0 1 0 6h-2" />
                  <path d="M13 14v2" />
                </svg>
                ORCID
              </a>
            </div>
          </Reveal>

          {/* ─── Papers ─── */}
          <div className="space-y-12 sm:space-y-16">
            {papers.map((paper, i) => (
              <Reveal key={paper.title} delay={0.08 * i}>
                <article className="group">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-8">
                    {/* Image */}
                    {paper.image_path && (
                      <div className="md:col-span-4">
                        <div className="relative aspect-[4/3] overflow-hidden bg-surface border border-border/60 group-hover:border-accent/20 transition-all duration-500">
                          <img
                            src={paper.image_path}
                            alt={paper.title}
                            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className={paper.image_path ? 'md:col-span-8' : 'md:col-span-12'}>
                      {/* Year tag */}
                      {paper.year && (
                        <span className="font-mono text-[10px] text-accent tracking-[0.3em] uppercase">
                          {paper.year}
                        </span>
                      )}

                      <h2 className="font-display text-lg sm:text-xl md:text-2xl text-text italic leading-[1.2] mt-1 mb-4">
                        {paper.title}
                      </h2>

                      <AbstractText text={paper.abstract} title={paper.title} />

                      {/* Tags */}
                      {paper.tags && paper.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-5">
                          {paper.tags.map((tag) => (
                            <span
                              key={tag}
                              className="font-mono text-[10px] text-bone/70 border border-border/50 px-2 sm:px-2.5 py-1 uppercase tracking-wider"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Links */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {paper.paper_link && (
                          <a
                            href={paper.paper_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 font-mono text-[11px] text-accent border border-accent/30 px-3 sm:px-4 py-2 hover:bg-accent-dim transition-all duration-200 tracking-wide"
                            onClick={() => trackPaperClick(paper.title, paper.paper_link || '')}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            Read Paper
                          </a>
                        )}
                        {paper.github_link && (
                          <a
                            href={paper.github_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 font-mono text-[11px] text-muted border border-border/60 px-3 sm:px-4 py-2 hover:border-accent/40 hover:text-accent transition-all duration-200 tracking-wide"
                            onClick={() => trackSocialClick('github', `paper_${paper.title}`)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                            </svg>
                            Source Code
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="w-full h-px bg-border/30 mt-8 sm:mt-12" />
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default ResearchPage
