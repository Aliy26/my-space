import { useTranslation } from 'react-i18next'
import { toAbsoluteApiUrl } from '../lib/api.ts'
import { trackEvent } from '../lib/track.ts'
import type { ResumeSummary } from '../types/resume.types.ts'
import ScrollReveal from './ScrollReveal.tsx'
import SectionTitle from './SectionTitle.tsx'

type ResumeSectionProps = {
  resume: ResumeSummary | null
}

function ResumeSection({ resume }: ResumeSectionProps) {
  const { t } = useTranslation()
  const viewUrl = resume ? toAbsoluteApiUrl(resume.viewUrl) : null
  const downloadUrl = resume ? toAbsoluteApiUrl(resume.downloadUrl) : null

  return (
    <section id="resume" className="section shell">
      <ScrollReveal variant="up">
        <SectionTitle eyebrow={t('resume.eyebrow')} title={t('resume.title')} />

        {viewUrl && downloadUrl ? (
          <div className="resume-wrapper">
            <div className="resume-actions">
              <a
                href={viewUrl}
                target="_blank"
                rel="noreferrer"
                className="button button-secondary"
                onClick={() => trackEvent('resume_view')}
              >
                {t('resume.view')}
              </a>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="button button-primary"
                onClick={() => trackEvent('resume_download')}
              >
                {t('resume.download')}
              </a>
            </div>
          </div>
        ) : (
          <div className="card">
            <p className="section-lead">{t('resume.empty')}</p>
          </div>
        )}
      </ScrollReveal>
    </section>
  )
}

export default ResumeSection
