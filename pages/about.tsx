import type { NextPage } from 'next'
import Head from 'next/head'
import Reveal from '@components/Reveal'

const technologies = [
  'TypeScript',
  'React / Next.js',
  'Node.js / NestJs',
  'Flutter',
  'MuleSoft / Anypoint',
  'MongoDB',
  'Docker',
  'C# / Unity',
  'Python',
  'Strapi',
  'SolidJS',
  'PostgreSQL',
]

const AboutPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Charbel Fayad - About</title>
      </Head>

      <section className="min-h-screen px-4 sm:px-6 md:px-12 lg:px-24 pt-24 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-5xl">
          {/* ─── Header ─── */}
          <Reveal>
            <div className="mb-12 sm:mb-20">
              <p className="font-mono text-[11px] text-muted tracking-[0.35em] uppercase mb-4">
                About
              </p>
              <h1 className="font-display text-4xl sm:text-5xl md:text-7xl text-text italic leading-[0.9]">
                Engineer, builder,
                <br />
                problem solver<span className="text-accent">.</span>
              </h1>
            </div>
          </Reveal>

          {/* ─── Content grid ─── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12 md:gap-16">
            {/* Photo */}
            <Reveal className="md:col-span-4" delay={0.15}>
              <div className="relative">
                <div className="aspect-[3/4] overflow-hidden border border-border/60">
                  <img
                    src="/images/profile2.jpeg"
                    alt="Charbel Fayad"
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  />
                </div>
                {/* Offset border accent */}
                <div className="absolute -bottom-3 -right-3 w-full h-full border border-accent/15 -z-10" />
              </div>
            </Reveal>

            {/* Bio */}
            <Reveal className="md:col-span-8 space-y-8" delay={0.3}>
              <div className="space-y-6 font-mono text-[13px] text-bone leading-[1.85]">
                <p>
                  <span className="text-accent font-semibold">Charbel Fayad</span> is a software
                  engineer who ships products. Ensuring clean architecture, thoughtful interfaces,
                  and systems that scale.
                </p>

                <p>
                  Right now I work at{' '}
                  <a
                    href="https://www.murex.com/en"
                    className="text-accent link-hover"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Murex
                  </a>{' '}
                  as an Integration Engineer, where I orchestrate 80+ internal and external systems
                  across on-prem and cloud infrastructure using MuleSoft and Anypoint. Before that,
                  I finished two internships at{' '}
                  <a
                    href="https://ninjaco.vercel.app/"
                    className="text-accent link-hover"
                    target="_blank"
                    rel="noreferrer"
                  >
                    NinjaCO
                  </a>{' '}
                  and{' '}
                  <a
                    href="https://www.ajjerni.com/"
                    className="text-accent link-hover"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ajjerni
                  </a>
                  , building full-stack products from the ground up.
                </p>

                <p>
                  Academically, I graduated from the honors program with a{' '}
                  <span className="text-text font-semibold">3.97 CGPA</span>, High Distinction, and
                  the Honors Award in Computer Science. Beyond engineering, I publish{' '}
                  <a href="/research" className="text-accent link-hover">
                    research
                  </a>{' '}
                  in machine learning and adaptive systems. I approach every project with the same
                  rigor and passion.
                </p>
              </div>

              {/* Resume link */}
              <a
                href="/data/resume.pdf"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 font-mono text-[12px] text-accent border border-accent/30 px-5 py-2.5 hover:bg-accent-dim transition-all duration-200 tracking-wide"
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                View Resume
              </a>

              {/* Divider */}
              <div className="w-full h-px bg-border/50" />

              {/* Technologies */}
              <div>
                <h3 className="font-mono text-[11px] text-muted tracking-[0.35em] uppercase mb-6">
                  Stack
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {technologies.map((tech) => (
                    <span
                      key={tech}
                      className="font-mono text-[11px] text-bone border border-border/60 px-3 py-1.5 hover:border-accent/40 hover:text-accent transition-all duration-200 cursor-default"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}

export default AboutPage
