/* What the résumé says. Links, projects and papers come from content/, shared with the site;
   only the résumé's own wording lives here. */
import { PAPERS, paperUrl } from '../../content/papers.ts'
import { CONTACT_LINKS, LINKS } from '../../content/profile.ts'
import { SITE_URL } from '../../content/site.ts'
import { FEATURED_PROJECTS } from '../../content/projects.ts'
import type { FeaturedProject } from '../../models/project/index.ts'

/** Text, or a labelled line such as "Scrum Master: ..." whose label is set apart. */
export type Bullet = string | { label: string; href?: string; text: string }

export interface Entry {
  title: string
  href?: string
  /** Follows the title, such as the employer. */
  context?: string
  period: string
  /** Muted line under the title, such as tools or other roles. */
  note?: string
  bullets: Bullet[]
}

export interface Citation {
  authors: string
  title: string
  href: string
  venue: string
  year: number
}

export interface Contact {
  label: string
  href?: string
}

export interface Resume {
  name: string
  headline: string
  contacts: Contact[]
  experience: Entry[]
  projects: Entry[]
  research: Entry[]
  publications: Citation[]
  /** Degrees, with the activities at each school as bullets. */
  education: Entry[]
}

export class UnknownProjectError extends Error {
  constructor(id: string) {
    super(`No featured project with id "${id}" in content/projects.ts`)
    this.name = 'UnknownProjectError'
  }
}

export function projectById(id: string): FeaturedProject {
  const project = FEATURED_PROJECTS.find((candidate) => candidate.id === id)
  if (project === undefined) throw new UnknownProjectError(id)
  return project
}

/** APA author list: "A", "A, & B", "A, B, & C". */
export function formatAuthors(authors: string[]): string {
  if (authors.length <= 1) return authors.join('')
  return `${authors.slice(0, -1).join(', ')}, & ${authors[authors.length - 1]}`
}

const SITE_LABEL = new URL(SITE_URL).host
const STACK_SEPARATOR = ' · '
/** The profiles from content/profile.ts that the résumé's contact line links. */
const PROFILE_IDS = new Set(['github', 'linkedin', 'orcid'])

/** "2024", or "2024 – 2026" when the years differ. */
export function yearSpan(years: number[]): string {
  if (years.length === 0) throw new RangeError('yearSpan needs at least one year')
  const first = Math.min(...years)
  const last = Math.max(...years)
  return first === last ? String(first) : `${first} – ${last}`
}

/** A project as its own entry: its name, year and stack come from content/projects.ts. */
function projectEntry(id: string, bullets: Bullet[]): Entry {
  const project = projectById(id)
  return {
    title: project.title,
    href: project.link,
    period: yearSpan([project.year]),
    note: project.stack.join(STACK_SEPARATOR),
    bullets,
  }
}

/** A bullet that leads with a project's name, linked when the project is public. */
function projectBullet(id: string, text: string): Bullet {
  const project = projectById(id)
  return { label: project.title, href: project.link, text }
}

/** The apps the résumé lists, by project id, each with its line. */
const APPS: { id: string; text: string }[] = [
  {
    id: 'bishara',
    text: 'Arabic scripture on the iOS Lock Screen, widgets and wallpapers. Built solo in React Native and Expo with native widget extensions; offline, no accounts.',
  },
  { id: 'muleprep', text: 'MuleSoft certification practice engine, React on Cloudflare’s edge.' },
  {
    id: 'petale',
    text: 'Bouquet composer in React and Vite that serializes arrangements into shareable links.',
  },
  { id: 'rukhsa', text: 'Multilingual PWA for Lebanese driving-theory exams.' },
  {
    id: 'socrat',
    text: 'Open-source WebRTC platform on Next.js for virtual Socratic dialogue, with real-time participation and attendance analytics.',
  },
]

/** Side projects from before the apps, on one line. */
const EARLIER = {
  years: [2022, 2024],
  text: 'Tourify (Ionic, Angular, PHP), a dollar-rate API (FastAPI, Flutter), Smoll (SolidJS), Mandelbrot (C#).',
}

export const RESUME: Resume = {
  name: 'Charbel Fayad',
  headline: 'Software Integration Engineer and Scrum Master',
  contacts: [
    { label: 'Byblos, Lebanon' },
    { label: '+961 70 353 574' },
    { label: LINKS.email.replace(/^mailto:/, ''), href: LINKS.email },
    { label: SITE_LABEL, href: SITE_URL },
    ...CONTACT_LINKS.filter((link) => PROFILE_IDS.has(link.id)).map(({ label, href }) => ({
      label,
      href,
    })),
  ],
  experience: [
    {
      title: 'Software Integration Engineer',
      context: 'Murex',
      period: 'Jun 2024 – Present',
      bullets: [
        'Architect API-led, event-driven integrations on MuleSoft Anypoint connecting 20+ cloud and on-premise systems, real-time and async over ActiveMQ and RabbitMQ.',
        'Apply enterprise integration patterns (canonical data models, content-based routing, API gateways) and design for high availability with clustering and active-passive failover.',
        'Built from scratch an Anypoint management-as-code tool that versions API contracts, specifications, instances and gateways and deploys them through CI/CD.',
        'Built an ActiveMQ observability tool (React, PostgreSQL, Docker) for queues, message tracing and audits.',
        'Design REST and SOAP APIs from business processes and stakeholder requirements; keep them reliable with Log4j structured logging and Splunk monitoring.',
        'Maintain Groovy Jenkins pipelines for Maven and Dockerized Node.js: Nexus, Harbor, Black Duck, Prisma Cloud.',
        {
          label: 'Scrum Master (SAFe)',
          text: 'run the ceremonies, coordinate cross-team dependencies, manage risk, present deliveries.',
        },
        {
          label: 'Support Coordinator',
          text: 'triage support requests, analyze recurring issues, coordinate fixes across the team.',
        },
      ],
    },
  ],
  projects: [
    projectEntry('sase', [
      'Architected B2B2B multi-tenant orchestration on a custom Linux NFV infrastructure over KVM, with near-zero-touch edge provisioning and service-chained VNFs for SD-WAN, firewalling and inline IDS/IPS.',
      'Architected the telemetry services: thousands of IoT edge devices stream through Kafka into Flink for real-time processing and ClickHouse for analytics, replicated across availability zones.',
      'Built Go edge agents that report to regional control planes over gRPC, on AWS and Kubernetes, with the data plane at the edge or in the cloud.',
    ]),
    {
      title: 'Apps',
      period: yearSpan([...APPS.map(({ id }) => projectById(id).year), ...EARLIER.years]),
      bullets: [
        ...APPS.map(({ id, text }) => projectBullet(id, text)),
        { label: 'Earlier', text: EARLIER.text },
      ],
    },
  ],
  research: [
    {
      title: 'Machine Learning Research',
      context: 'Lebanese American University',
      period: 'Mar 2022 – Jun 2025',
      note: ['Python', 'TensorFlow', 'Keras', 'DEAP', 'NetworkX'].join(STACK_SEPARATOR),
      bullets: [
        'Genetic algorithm evolving on a dynamic scale-free (Barabási–Albert) network, where authority nodes balance exploration and exploitation.',
        'Neural network ensemble embedded in a scale-free graph, weighted by node centrality and pruned through its power-law degree distribution.',
        'Adaptive-topology neural networks that rewire low-importance connections during training; genetic programming for federated learning on binary neural networks.',
      ],
    },
  ],
  publications: PAPERS.map((paper) => ({
    authors: formatAuthors(paper.authors),
    title: paper.title,
    href: paperUrl(paper),
    venue: paper.venue,
    year: paper.year,
  })),
  education: [
    {
      title: 'Lebanese American University',
      context: 'Byblos',
      period: 'Sep 2021 – Jun 2024',
      bullets: [
        'BS Computer Science, Honors Program. CGPA 3.97, Major GPA 4.0, High Distinction.',
        {
          label: 'Founder',
          text: 'Software Engineering Club (workshops and technical seminars) and Computer Science Club.',
        },
        { label: 'Lab Instructor', text: 'Operating Systems and Computer Programming labs.' },
      ],
    },
  ],
}
