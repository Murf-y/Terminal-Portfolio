import React from 'react'
import { CONTACT_LINKS, ContactLinkId } from '@content/profile'
import { trackContactClick, trackResumeOpen, trackSocialClick } from '@hooks/useAnalytics'

export function trackContactLink(id: ContactLinkId, source: string): void {
  switch (id) {
    case 'email':
      trackContactClick(source)
      return
    case 'resume':
      trackResumeOpen(source)
      return
    default:
      trackSocialClick(id, source)
  }
}

interface ContactLinksProps {
  /** Analytics label for where the links are rendered. */
  source: string
  /** Extra inline items after the links, such as the terminal button on Home. */
  children?: React.ReactNode
}

const ContactLinks: React.FC<ContactLinksProps> = ({ source, children }) => (
  <p className="flex flex-wrap gap-x-5 gap-y-1">
    {CONTACT_LINKS.map((link) => {
      const opensElsewhere = link.id !== 'email'
      return (
        <a
          key={link.id}
          href={link.href}
          className="text-link"
          target={opensElsewhere ? '_blank' : undefined}
          rel={opensElsewhere ? 'noreferrer' : undefined}
          onClick={() => trackContactLink(link.id, source)}
        >
          {link.label}
        </a>
      )
    })}
    {children}
  </p>
)

export default ContactLinks
