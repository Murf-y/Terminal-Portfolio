import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import ThemeToggle from './ThemeToggle'
import { useTheme } from '@hooks/useTheme'

/* Lazy-load Terminal — heavy component, only used on demand */
const Terminal = dynamic(() => import('./Terminal'), { ssr: false })

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter()
  const { theme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [terminalOpen, setTerminalOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Close mobile menu on route change */
  useEffect(() => {
    setMenuOpen(false)
  }, [router.pathname])

  /* Lock body scroll when menu or terminal is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen || terminalOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen, terminalOpen])

  const logoSrc = theme === 'light' ? '/images/Logo_dark.png' : '/images/Logo.png'

  return (
    <div className="grain min-h-screen flex flex-col">
      {/* ─── Navigation ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 py-3 transition-all duration-300 ${
          scrolled || menuOpen
            ? 'bg-void/90 backdrop-blur-md border-b border-border/40'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <Link href="/" className="group flex items-center gap-3 z-50">
          <img
            src={logoSrc}
            alt="CF Logo"
            className="w-8 h-8 sm:w-9 sm:h-9 transition-transform duration-300 group-hover:scale-110"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5 lg:gap-7">
          <NavLink href="/about" current={router.pathname}>
            /about
          </NavLink>
          <NavLink href="/projects" current={router.pathname}>
            /projects
          </NavLink>
          <NavLink href="/research" current={router.pathname}>
            /research
          </NavLink>
          <a
            href="/data/resume.pdf"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-muted hover:text-accent transition-colors duration-200 tracking-wide"
          >
            /resume
          </a>
          <ThemeToggle />
          {/* Terminal toggle */}
          <button
            onClick={() => setTerminalOpen(true)}
            className="relative group w-8 h-8 flex items-center justify-center rounded-md border border-transparent hover:border-border/30 bg-transparent hover:bg-accent-dim transition-all duration-200 cursor-pointer"
            aria-label="Open terminal mode"
          >
            <span className="font-mono text-[11px] text-muted group-hover:text-accent transition-colors duration-200 font-bold leading-none">
              {'>_'}
            </span>
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] text-void bg-text px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              terminal mode
            </span>
          </button>
          <a
            href="mailto:charbelfayad64@gmail.com"
            className="hidden lg:inline-block text-void bg-accent px-4 py-1.5 text-[11px] font-mono font-semibold tracking-widest uppercase hover:opacity-80 transition-opacity duration-200"
          >
            Contact
          </a>
        </div>

        {/* Mobile: theme toggle + terminal + hamburger */}
        <div className="flex md:hidden items-center gap-2 z-50">
          <ThemeToggle />
          <button
            onClick={() => setTerminalOpen(true)}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-transparent hover:border-border/30 bg-transparent hover:bg-accent-dim transition-all duration-200"
            aria-label="Open terminal mode"
          >
            <span className="font-mono text-[10px] text-muted font-bold leading-none">{'>_'}</span>
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="relative w-7 h-7 flex flex-col items-center justify-center gap-[5px]"
            aria-label="Toggle menu"
          >
            <span
              className={`block w-5 h-[1.5px] bg-text transition-all duration-300 origin-center ${
                menuOpen ? 'rotate-45 translate-y-[6.5px]' : ''
              }`}
            />
            <span
              className={`block w-5 h-[1.5px] bg-text transition-all duration-300 ${
                menuOpen ? 'opacity-0 scale-x-0' : ''
              }`}
            />
            <span
              className={`block w-5 h-[1.5px] bg-text transition-all duration-300 origin-center ${
                menuOpen ? '-rotate-45 -translate-y-[6.5px]' : ''
              }`}
            />
          </button>
        </div>
      </nav>

      {/* ─── Mobile Menu Overlay ─── */}
      <div
        className={`fixed inset-0 z-40 bg-void/98 backdrop-blur-sm flex flex-col items-start justify-center px-8 transition-all duration-300 md:hidden ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="space-y-6">
          {[
            { href: '/about', label: '/about' },
            { href: '/projects', label: '/projects' },
            { href: '/research', label: '/research' },
          ].map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block font-mono text-2xl tracking-wide transition-colors duration-200 ${
                router.pathname === item.href ? 'text-accent' : 'text-text hover:text-accent'
              }`}
              style={{ transitionDelay: menuOpen ? `${80 + i * 50}ms` : '0ms' }}
            >
              {item.label}
            </Link>
          ))}
          <a
            href="/data/resume.pdf"
            target="_blank"
            rel="noreferrer"
            className="block font-mono text-2xl text-text hover:text-accent tracking-wide transition-colors duration-200"
            style={{ transitionDelay: menuOpen ? '230ms' : '0ms' }}
          >
            /resume
          </a>
        </div>
        <a
          href="mailto:charbelfayad64@gmail.com"
          className="mt-12 text-void bg-accent px-6 py-3 text-[12px] font-mono font-semibold tracking-widest uppercase hover:opacity-80 transition-opacity duration-200"
        >
          Contact
        </a>
      </div>

      {/* ─── Content ─── */}
      <main className="flex-1">{children}</main>

      {/* ─── Footer ─── */}
      <footer className="px-4 sm:px-6 md:px-12 lg:px-24 py-8 sm:py-10 border-t border-border/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="CF" className="w-5 h-5 opacity-50" />
            <p className="font-mono text-[11px] text-muted">
              &copy; {new Date().getFullYear()} Charbel Fayad
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 sm:gap-x-8 gap-y-2">
            <a
              href="/data/resume.pdf"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] text-muted hover:text-accent transition-colors duration-200"
            >
              Resume
            </a>
            <a
              href="mailto:charbelfayad64@gmail.com"
              className="font-mono text-[11px] text-muted hover:text-accent transition-colors duration-200"
            >
              Email
            </a>
            <a
              href="https://github.com/Murf-y"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] text-muted hover:text-accent transition-colors duration-200"
            >
              GitHub
            </a>
            <a
              href="https://www.researchgate.net/profile/Charbel-Fayad"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] text-muted hover:text-accent transition-colors duration-200"
            >
              ResearchGate
            </a>
          </div>
        </div>
      </footer>

      {/* ─── Terminal Overlay ─── */}
      {terminalOpen && <Terminal onExit={() => setTerminalOpen(false)} />}
    </div>
  )
}

/* ─── Nav link with active state ─── */
const NavLink: React.FC<{
  href: string
  current: string
  children: React.ReactNode
}> = ({ href, current, children }) => {
  const isActive = current === href

  return (
    <Link
      href={href}
      className={`font-mono text-xs tracking-wide transition-colors duration-200 ${
        isActive ? 'text-accent' : 'text-muted hover:text-text'
      }`}
    >
      {children}
    </Link>
  )
}

export default Layout
