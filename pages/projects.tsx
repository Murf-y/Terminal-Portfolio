import type { Project } from '@models/project'
import projects_json from '../public/data/projects.json'
import type { NextPage } from 'next'
import Head from 'next/head'
import Reveal from '@components/Reveal'

/* rendering-hoist-jsx: derive static data outside the component */
const projects: Project[] = projects_json.projects.map((project) => ({
  title: project.title,
  image_path:
    project.image_path.length === 0 ? projects_json.default_image_path : project.image_path,
  tags: project.tags,
  link: project.link.length === 0 ? projects_json.default_link : project.link,
}))

const ProjectsPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Charbel Fayad - Projects</title>
      </Head>

      <section className="min-h-screen px-4 sm:px-6 md:px-12 lg:px-24 pt-24 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-6xl">
          {/* ─── Header ─── */}
          <Reveal>
            <div className="mb-12 sm:mb-20">
              <p className="font-mono text-[11px] text-muted tracking-[0.35em] uppercase mb-4">
                {projects.length} Projects
              </p>
              <h1 className="font-display text-4xl sm:text-5xl md:text-7xl text-text italic leading-[0.9]">
                Things I&apos;ve
                <br />
                built<span className="text-accent">.</span>
              </h1>
            </div>
          </Reveal>

          {/* ─── Project Grid ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-10 sm:gap-y-14">
            {projects.map((project, i) => (
              <Reveal key={project.title + i} delay={0.04 + (i % 3) * 0.08}>
                <a href={project.link} target="_blank" rel="noreferrer" className="group block">
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface border border-border/60 mb-4 group-hover:border-accent/30 transition-all duration-500">
                    <img
                      src={project.image_path}
                      alt={project.title}
                      className="w-full h-full object-cover opacity-50 group-hover:opacity-100 group-hover:scale-[1.04] transition-all duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-void/80 via-void/20 to-transparent" />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="font-mono text-[10px] text-accent border border-accent/40 px-4 py-2 backdrop-blur-sm bg-void/60 tracking-widest uppercase">
                        View Project &#8599;
                      </span>
                    </div>
                  </div>

                  {/* Meta */}
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
                    <span className="font-mono text-sm text-muted group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 flex-shrink-0 mt-0.5">
                      &#8599;
                    </span>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default ProjectsPage
