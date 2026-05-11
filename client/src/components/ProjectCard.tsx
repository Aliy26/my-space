import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toAbsoluteApiUrl } from '../lib/api.ts'
import { trackEvent } from '../lib/track.ts'
import type { Project } from '../types/project.types.ts'

type ProjectCardProps = {
  project: Project
}

function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useTranslation()
  const isExternalLink = /^https?:\/\//.test(project.href)
  const imageUrl = project.imageUrl ? toAbsoluteApiUrl(project.imageUrl) : null
  const [imageError, setImageError] = useState(false)

  return (
    <article className="project-card card">
      {imageUrl ? (
        <div className="project-card-image">
          {!imageError ? (
            <img
              src={imageUrl}
              alt={project.title}
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="project-card-image-placeholder" />
          )}
        </div>
      ) : null}

      <div className="project-card-body">
        <div className="project-card-top">
          <h3>{project.title}</h3>
          <p className="project-description">{project.description}</p>
        </div>

        <div className="project-card-footer">
          <div className="project-tags-wrap">
            <ul className="chip-list">
              {project.tags.slice(0, 4).map((tag) => (
                <li key={tag} className="chip">
                  {tag}
                </li>
              ))}
              {project.tags.length > 4 && (
                <li className="chip chip-more">+{project.tags.length - 4}</li>
              )}
            </ul>
          </div>

          {project.href && (
            <a
              className="project-card-btn"
              href={project.href}
              target={isExternalLink ? '_blank' : undefined}
              rel={isExternalLink ? 'noreferrer' : undefined}
              aria-label={`${project.title} — ${t('projects.openProject')}`}
              onClick={() => trackEvent('project_click', { title: project.title })}
            >
              {t('projects.openProject')} ↗
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

export default ProjectCard
