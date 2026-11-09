import Image from 'next/image'
import React, { useRef, useState } from 'react'
import { FeaturedProject, ProjectImage } from '@models/project'
import {
  PREVIEW_GAP,
  PREVIEW_ROW_OFFSET,
  PREVIEW_WIDTH,
  previewHeight,
  previewTransition,
  shouldMorph,
} from '@lib/preview'
import { trackProjectClick } from '@hooks/useAnalytics'

interface PreviewState {
  activeId: string | null
  isVisible: boolean
  /** Row offset inside the list, in px. */
  top: number
  /** True when the preview was showing (or just hid), so it slides to the new row instead of fading in. */
  isMorphing: boolean
}

const INITIAL_PREVIEW: PreviewState = { activeId: null, isVisible: false, top: 0, isMorphing: false }

const HIDDEN_SCALE = 'scale(0.96)'
const SHOWN_SCALE = 'scale(1)'
const SHARP = 'blur(0px)'
const SOFT = 'blur(2px)'

type ProjectWithImage = FeaturedProject & { image: ProjectImage }

function hasImage(project: FeaturedProject): project is ProjectWithImage {
  return project.image !== undefined
}

interface ProjectListProps {
  projects: FeaturedProject[]
  /** Adds the stack and year under each description (used on /projects). */
  showStack?: boolean
  /** Analytics label for where the list is rendered. */
  source: string
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, showStack = false, source }) => {
  const [preview, setPreview] = useState<PreviewState>(INITIAL_PREVIEW)
  /** When the preview last stopped showing, in ms since epoch; null until it has been shown. */
  const hiddenAtRef = useRef<number | null>(null)
  const withImages = projects.filter(hasImage)
  const active = withImages.find((p) => p.id === preview.activeId) ?? withImages[0]

  const show = (project: FeaturedProject, row: HTMLElement) => {
    if (!hasImage(project)) {
      hide()
      return
    }
    const top = row.offsetTop + PREVIEW_ROW_OFFSET
    const hiddenAt = hiddenAtRef.current
    const msSinceHidden = hiddenAt === null ? null : Date.now() - hiddenAt
    setPreview((prev) => ({
      activeId: project.id,
      isVisible: true,
      top,
      isMorphing: shouldMorph(prev.isVisible, msSinceHidden),
    }))
  }

  const hide = () => {
    if (preview.isVisible) hiddenAtRef.current = Date.now()
    setPreview((prev) => ({ ...prev, isVisible: false }))
  }

  return (
    <div className="relative" onMouseLeave={hide}>
      {projects.map((project) => {
        const body = (
          <>
            <span className="row-title block">{project.title}</span>
            <span className="block text-muted">{project.description}</span>
            {showStack && (
              <span className="block text-[13px] text-muted">
                {[...project.stack, project.year].join(' · ')}
              </span>
            )}
          </>
        )
        if (project.link === undefined) {
          return (
            <div key={project.id} className="py-2" onMouseEnter={hide}>
              {body}
            </div>
          )
        }
        const link = project.link
        return (
          <a
            key={project.id}
            href={link}
            target="_blank"
            rel="noreferrer"
            className="row-link block py-2"
            onMouseEnter={(e) => show(project, e.currentTarget)}
            onFocus={(e) => show(project, e.currentTarget)}
            onBlur={hide}
            onClick={() => trackProjectClick(project.title, link)}
          >
            {body}
          </a>
        )
      })}

      {active && (
        <div
          aria-hidden="true"
          data-testid="project-preview"
          className="project-preview pointer-events-none absolute hidden overflow-hidden rounded-lg bg-outline preview:block"
          style={{
            left: `calc(100% + ${PREVIEW_GAP}px)`,
            width: PREVIEW_WIDTH,
            top: preview.top,
            height: previewHeight(active.image),
            opacity: preview.isVisible ? 1 : 0,
            transform: preview.isVisible ? SHOWN_SCALE : HIDDEN_SCALE,
            transition: previewTransition(preview.isMorphing),
          }}
        >
          {withImages.map((project) => {
            const isActive = project.id === active.id
            return (
              <Image
                key={project.id}
                src={project.image.src}
                width={project.image.width}
                height={project.image.height}
                sizes={`${PREVIEW_WIDTH}px`}
                alt=""
                data-project={project.id}
                className="project-preview-image absolute left-0 top-0 w-full"
                style={{
                  // Each screenshot keeps its own height; the frame clips it while it resizes,
                  // so the image is revealed rather than rescaled or cropped.
                  height: previewHeight(project.image),
                  opacity: isActive ? 1 : 0,
                  filter: isActive ? SHARP : SOFT,
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ProjectList
