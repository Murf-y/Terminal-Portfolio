export const NAME = 'Charbel Fayad'
export const HEADLINE = 'Software engineer'
export const SITE_DESCRIPTION =
  'Software integration engineer and Scrum Master at Murex. Projects, research and contact.'

const EMAIL = 'charbelfayad64@gmail.com'
export const RESUME_PATH = '/data/resume.pdf'

export const LINKS = {
  email: `mailto:${EMAIL}`,
  github: 'https://github.com/Murf-y',
  linkedin: 'https://www.linkedin.com/in/charbel-fayad-7ba9b1203/',
  orcid: 'https://orcid.org/0009-0007-0529-5003',
  researchgate: 'https://www.researchgate.net/profile/Charbel-Fayad',
  murex: 'https://www.murex.com/en',
} as const

type ContactLinkId = 'email' | 'github' | 'linkedin' | 'orcid' | 'researchgate' | 'resume'

interface ContactLink {
  id: ContactLinkId
  label: string
  href: string
}

export const CONTACT_LINKS: ContactLink[] = [
  { id: 'email', label: 'Email', href: LINKS.email },
  { id: 'github', label: 'GitHub', href: LINKS.github },
  { id: 'linkedin', label: 'LinkedIn', href: LINKS.linkedin },
  { id: 'orcid', label: 'ORCID', href: LINKS.orcid },
  { id: 'researchgate', label: 'ResearchGate', href: LINKS.researchgate },
  { id: 'resume', label: 'Résumé', href: RESUME_PATH },
]

/** About page body. Plain strings so the terminal can print the same text. */
export const ABOUT_PARAGRAPHS: string[] = [
  'Architecture, development and production support of an ESB-based integration platform at Murex, since 2024. API-led and event-driven, real-time and async. Java services, API gateways, ActiveMQ and RabbitMQ, built on enterprise integration patterns: canonical data models, content-based routing, clustering and active-passive failover. Interfaces across 20+ cloud and on-premise systems, on a platform brokering traffic between hundreds.',
  'Built from scratch: an Anypoint management-as-code tool that versions API contracts, specifications, instances and gateways and deploys them through CI/CD, and an observability tool for ActiveMQ with queue management, end-to-end message traceability and audit trails. Delivery on Jenkins, Maven and Docker, with Black Duck and Prisma Cloud scanning; Log4j and Splunk in production.',
  'Scrum Master and Support Coordinator for the same team. Facilitation, cross-team dependencies, delivery risk, continuous improvement. Recurring-issue analysis and coordinated fixes.',
  'Outside Murex, infrastructure from the OS up. Custom virtualization, B2B2B multi-tenant control planes, service-chained network functions, telemetry streamed from thousands of edge devices. Products shipped end to end, built for the open internet and a public good.',
  'Research in evolutionary algorithms, ensemble and federated learning, and model optimization, through network science. Topology as a design variable: how the structure connecting populations, ensembles and models shapes the way they learn.',
  'BS Computer Science, Lebanese American University, 2024. Honors Program, High Distinction. CGPA 3.97, Major GPA 4.0.',
]

interface ExperienceEntry {
  period: string
  title: string
  detail: string
}

export const EXPERIENCE: ExperienceEntry[] = [
  {
    period: '2024–now',
    title: 'Software Integration Engineer, Murex',
    detail: 'Scrum Master, Support Coordinator',
  },
  {
    period: '2024',
    title: 'BS Computer Science, Lebanese American University',
    detail: 'Honors Program, High Distinction. CGPA 3.97, Major GPA 4.0',
  },
]
