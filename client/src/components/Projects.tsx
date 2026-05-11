import { useTranslation } from 'react-i18next'
import type { Project } from '../types/project.types.ts'
import ProjectCard from './ProjectCard.tsx'
import ScrollReveal from './ScrollReveal.tsx'
import SectionTitle from './SectionTitle.tsx'

type ProjectsProps = {
  projects: Project[]
}

function Projects({ projects }: ProjectsProps) {
  const { t } = useTranslation()

  return (
    <section id="projects" className="section shell">
      <ScrollReveal variant="scale">
        <SectionTitle eyebrow={t('projects.eyebrow')} title={t('projects.title')} />

        {projects.length > 0 ? (
          <div className="projects-grid">
            {projects.map((project) => (
              <ProjectCard key={project.id ?? project.title} project={project} />
            ))}
          </div>
        ) : (
          <div className="card">
            <p className="section-lead">{t('projects.empty')}</p>
          </div>
        )}
      </ScrollReveal>
    </section>
  )
}

export default Projects
