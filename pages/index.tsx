import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useCallback } from 'react'
import projects_json from '../public/data/projects.json'
import papers_json from '../public/data/papers.json'
import type { Project } from '@models/project'
import type { Paper } from '@models/paper'
import Reveal from '@components/Reveal'

/* bundle-dynamic-imports: Particles + tsparticles is ~200KB — lazy-load, skip SSR */
const Particles = dynamic(() => import('react-particles'), { ssr: false })

/* rendering-hoist-jsx: derive static data outside the component */
const featured: Project[] = projects_json.projects.slice(0, 3).map((p) => ({
  title: p.title,
  image_path: p.image_path.length === 0 ? projects_json.default_image_path : p.image_path,
  tags: p.tags,
  link: p.link.length === 0 ? projects_json.default_link : p.link,
}))

const raw = papers_json.papers[0]
const latestPaper: Paper | null = raw
  ? {
      title: raw.title,
      abstract: raw.abstract,
      image_path: raw.image_path || papers_json.default_image_path,
      tags: raw.tags,
      paper_link: raw.paper_link,
      github_link: raw.github_link,
      year: raw.year,
    }
  : null

const Home: NextPage = () => {
  const particlesInit = useCallback(async (engine: any) => {
    const { loadFull } = await import('tsparticles')
    await loadFull(engine)
  }, [])

  return (
    <>
      <Head>
        <title>Charbel Fayad - Software Engineer</title>
        <meta
          name="description"
          content="Software Engineer building things that live on the internet."
        />
      </Head>

      {/* ═══════════ Hero ═══════════ */}
      <section className="relative min-h-screen flex flex-col justify-center px-4 sm:px-6 md:px-12 lg:px-24 pt-20 overflow-hidden">
        {/* Particles — subtle, hero-only, behind content */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <Particles
            id="hero-particles"
            url="/data/particles-hero.json"
            init={particlesInit}
            className="!absolute !inset-0 !w-full !h-full"
          />
        </div>

        {/* Decorative grid line */}
        <div className="absolute top-0 left-1/2 w-px h-32 bg-gradient-to-b from-transparent to-border/60 hidden lg:block" />

        <div className="relative z-10 stagger-children max-w-6xl">
          <h1 className="font-display text-[clamp(3rem,10vw,9rem)] leading-[0.85] tracking-tight text-text">
            Charbel Fayad
          </h1>
          <p className="font-display text-[clamp(1.4rem,3.5vw,3.2rem)] text-muted italic mt-2 md:mt-3 ml-[2px]">
            is a software engineer &amp; researcher who builds
            <br className="hidden sm:block" />{' '}
            <span className="text-accent">things that live on the internet</span>.
          </p>

          <div className="mt-8 sm:mt-12 flex items-start gap-4 sm:gap-8 md:gap-12">
            <div className="w-12 h-px bg-accent mt-3 hidden md:block flex-shrink-0 origin-left animate-line-grow" />
            <p className="font-mono text-[12px] sm:text-[13px] text-muted max-w-lg leading-[1.8]">
              Currently engineering integrations at{' '}
              <a
                href="https://www.murex.com/en"
                className="text-accent link-hover"
                target="_blank"
                rel="noreferrer"
              >
                Murex
              </a>{' '}
              orchestrating 80+ internal and external systems across on-prem and cloud.
            </p>
          </div>

          {/* CTA row */}
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              href="/projects"
              className="inline-block font-mono text-[11px] text-void bg-accent px-5 sm:px-6 py-2.5 tracking-[0.15em] uppercase font-semibold hover:opacity-80 transition-opacity duration-200"
            >
              View Projects
            </Link>
            <a
              href="/data/resume.pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-block font-mono text-[11px] text-accent border border-accent/40 px-5 sm:px-6 py-2.5 tracking-[0.15em] uppercase font-semibold hover:bg-accent-dim transition-all duration-200"
            >
              Resume &#8599;
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-10 left-6 md:left-12 flex items-center gap-3 opacity-0 animate-fade-in z-10"
          style={{ animationDelay: '1.8s' }}
        >
          <div className="w-px h-14 bg-gradient-to-b from-transparent via-accent/40 to-accent" />
          <span className="font-mono text-[9px] text-muted tracking-[0.3em] uppercase">Scroll</span>
        </div>

        {/* Decorative corner accent */}
        <div
          className="absolute bottom-10 right-6 md:right-12 hidden md:block opacity-0 animate-fade-in z-10"
          style={{ animationDelay: '2s' }}
        >
          <div className="w-6 h-6 border-r border-b border-border/50" />
        </div>
      </section>

      {/* ═══════════ Selected Research ═══════════ */}
      {latestPaper && (
        <section className="px-4 sm:px-6 md:px-12 lg:px-24 py-16 sm:py-24 border-t border-border/40">
          <Reveal>
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 sm:mb-14 gap-4">
              <div>
                <p className="font-mono text-[11px] text-muted tracking-[0.35em] uppercase mb-3">
                  Research
                </p>
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-text italic">
                  Latest Paper
                </h2>
              </div>
              <Link
                href="/research"
                className="font-mono text-[11px] text-muted hover:text-accent transition-colors duration-200 tracking-[0.2em] uppercase"
              >
                All Research &rarr;
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <a
              href={latestPaper.paper_link}
              target="_blank"
              rel="noreferrer"
              className="group block"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-8">
                {latestPaper.image_path && (
                  <div className="md:col-span-5">
                    <div className="relative aspect-[4/3] overflow-hidden bg-surface border border-border/60 group-hover:border-accent/20 transition-all duration-500">
                      <img
                        src={latestPaper.image_path}
                        alt={latestPaper.title}
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500"
                      />
                    </div>
                  </div>
                )}
                <div
                  className={
                    latestPaper.image_path
                      ? 'md:col-span-7 flex flex-col justify-center'
                      : 'md:col-span-12'
                  }
                >
                  {latestPaper.year && (
                    <span className="font-mono text-[10px] text-accent tracking-[0.3em] uppercase">
                      {latestPaper.year}
                    </span>
                  )}
                  <h3 className="font-display text-xl sm:text-2xl md:text-3xl text-text italic leading-[1.15] mt-1 mb-3 sm:mb-4 group-hover:text-accent transition-colors duration-300">
                    {latestPaper.title}
                  </h3>
                  <p className="font-mono text-[11px] sm:text-[12px] text-muted leading-[1.8] line-clamp-2 sm:line-clamp-3 mb-4 sm:mb-5">
                    {latestPaper.abstract}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {latestPaper.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[10px] text-bone/70 border border-border/50 px-2.5 py-1 uppercase tracking-wider"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </a>
          </Reveal>
        </section>
      )}

      {/* ═══════════ Selected Work ═══════════ */}
      <section className="px-4 sm:px-6 md:px-12 lg:px-24 py-16 sm:py-24 border-t border-border/40">
        <Reveal>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 sm:mb-16 gap-4">
            <div>
              <p className="font-mono text-[11px] text-muted tracking-[0.35em] uppercase mb-3">
                Featured
              </p>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-text italic">
                Selected Work
              </h2>
            </div>
            <Link
              href="/projects"
              className="font-mono text-[11px] text-muted hover:text-accent transition-colors duration-200 tracking-[0.2em] uppercase"
            >
              View All &rarr;
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {featured.map((project, i) => (
            <Reveal key={project.title} delay={0.1 + i * 0.12}>
              <a href={project.link} target="_blank" rel="noreferrer" className="group block">
                <div className="relative aspect-[4/3] overflow-hidden bg-surface border border-border/60 mb-5 group-hover:border-accent/30 transition-all duration-500">
                  <img
                    src={project.image_path}
                    alt={project.title}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-[1.04] transition-all duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-void/70 via-transparent to-transparent" />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-mono text-sm text-text group-hover:text-accent transition-colors duration-200">
                      {project.title}
                    </h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                      {project.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="font-mono text-[10px] text-muted uppercase tracking-wider"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="font-mono text-sm text-muted group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 flex-shrink-0">
                    &#8599;
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  )
}

export default Home
