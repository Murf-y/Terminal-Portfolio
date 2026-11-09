import { ArchivedProject, FeaturedProject } from '@models/project'

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    id: 'bishara',
    title: 'Bishara',
    description:
      'Arabic scripture on the iOS Lock Screen, Home Screen widgets and wallpapers. Full library on-device, offline delivery, no accounts. Built solo on React Native and Expo with native widget extensions.',
    stack: ['React Native', 'Expo'],
    year: 2026,
    link: 'https://getbishara.app/',
    image: { src: '/images/projects/bishara.png', width: 576, height: 360 },
  },
  {
    id: 'sase',
    title: 'SD-WAN and SASE orchestrator',
    description:
      'B2B2B multi-tenant orchestration on a custom Linux NFV infrastructure over KVM: near-zero-touch edge provisioning, service-chained VNFs with inline IDS/IPS. Telemetry from thousands of edge devices through Kafka, Flink and ClickHouse, replicated across availability zones.',
    stack: ['Go', 'gRPC', 'KVM', 'Kubernetes', 'Kafka', 'Flink', 'ClickHouse', 'AWS'],
    year: 2026,
  },
  {
    id: 'muleprep',
    title: 'MulePrep',
    description: 'Certification practice engine for MuleSoft exams. React, served from Cloudflare’s edge.',
    stack: ['React', 'Cloudflare'],
    year: 2026,
    link: 'https://muleprep.pages.dev',
    image: { src: '/images/projects/muleprep.jpg', width: 576, height: 290 },
  },
  {
    id: 'petale',
    title: 'Petale',
    description: 'Bouquet composer that serializes an arrangement into a shareable link.',
    stack: ['React', 'Vite'],
    year: 2026,
    link: 'https://petale.live',
    image: { src: '/images/projects/petal.jpg', width: 576, height: 302 },
  },
  {
    id: 'rukhsa',
    title: 'Rukhsa',
    description: 'Lebanese driving-theory exam practice. Multilingual, installable PWA.',
    stack: ['PWA'],
    year: 2026,
    link: 'https://drivinglb.netlify.app',
    image: { src: '/images/projects/rukhsa.png', width: 576, height: 326 },
  },
  {
    id: 'socrat',
    title: 'Socrat',
    description:
      'Virtual Harkness circles for philosophy discussion. Access-coded private rooms over WebRTC.',
    stack: ['Next.js', 'WebRTC'],
    year: 2024,
    link: 'https://socrat.vercel.app/',
    image: { src: '/images/projects/socrat.png', width: 576, height: 314 },
  },
]

export const ARCHIVED_PROJECTS: ArchivedProject[] = [
  { title: 'Game of Life', stack: ['React'], link: 'https://lifeingame.netlify.app/' },
  {
    title: 'Network Models Visualizer',
    stack: ['JavaScript'],
    link: 'https://murf-y.github.io/NetworkModelsVisualization/',
  },
  { title: 'Smoll', stack: ['SolidJS', 'MongoDB'], link: 'https://github.com/Murf-y/smoll' },
  { title: 'NinjaCo', stack: ['Arduino', 'Visual programming'], link: 'https://ninjaco.vercel.app/' },
  {
    title: 'Attractors Simulation',
    stack: ['Canvas 2D'],
    link: 'https://github.com/Murf-y/Attractors-Simulation',
  },
  { title: 'Enum Dirbuster', stack: ['Multithreading'], link: 'https://github.com/Murf-y/Enum-Dirbuster' },
  {
    title: 'Pacman Heuristic',
    stack: ['Genetic algorithm', 'A*'],
    link: 'https://github.com/Murf-y/Pacman-Search-Evalution',
  },
  { title: 'Tourify', stack: ['AngularJS', 'Ionic', 'PHP'], link: 'https://github.com/Murf-y/Tourify' },
  { title: 'Groupify', stack: ['Java', 'PHP'], link: 'https://github.com/Murf-y/Groupify' },
  {
    title: 'Dollar Rate API',
    stack: ['FastAPI', 'BeautifulSoup'],
    link: 'https://github.com/Murf-y/LBP-DollarRate-API',
  },
  { title: 'USD Rate App', stack: ['Flutter', 'Dart'], link: 'https://github.com/Murf-y/USD-Rate-App' },
  { title: 'LyricsHub', stack: ['React'], link: 'https://github.com/Murf-y/LyricsHub' },
  { title: 'Mandelbrot Set', stack: ['C#'], link: 'https://github.com/Murf-y/MandelbrotSet-Visualizer' },
  {
    title: 'Terminal Portfolio',
    stack: ['Next.js', 'Tailwind'],
    link: 'https://github.com/Murf-y/Terminal-Portofolio',
  },
]
