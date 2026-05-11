import { useTranslation } from 'react-i18next'
import { toAbsoluteApiUrl } from '../lib/api.ts'
import { trackEvent } from '../lib/track.ts'
import type { ResumeSummary } from '../types/resume.types.ts'
import ScrollReveal from './ScrollReveal.tsx'
import SectionTitle from './SectionTitle.tsx'

type ResumeSectionProps = {
  resumes: ResumeSummary[]
}

const FLAG_MAP: Record<string, { flagUrl: string; label: string }> = {
  en: { flagUrl: new URL('flag-icons/flags/4x3/us.svg', import.meta.url).href, label: 'English' },
  us: { flagUrl: new URL('flag-icons/flags/4x3/us.svg', import.meta.url).href, label: 'English' },
  ko: { flagUrl: new URL('flag-icons/flags/4x3/kr.svg', import.meta.url).href, label: '한국어' },
  kr: { flagUrl: new URL('flag-icons/flags/4x3/kr.svg', import.meta.url).href, label: '한국어' },
}

function detectLang(filename: string) {
  const lower = filename.toLowerCase().replace('.pdf', '')
  for (const [code, info] of Object.entries(FLAG_MAP)) {
    if (lower.endsWith(`_${code}`) || lower.endsWith(`-${code}`) || lower === code) {
      return info
    }
  }
  return null
}

const PdfIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className="resume-card-icon">
    <rect x="8" y="4" width="36" height="48" rx="4" fill="currentColor" opacity="0.08" />
    <rect x="8" y="4" width="36" height="48" rx="4" stroke="currentColor" strokeWidth="2" />
    <path d="M36 4v12h12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M36 4l12 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <rect x="4" y="34" width="32" height="14" rx="3" fill="currentColor" opacity="0.9" />
    <text x="20" y="45" textAnchor="middle" fontSize="7" fontWeight="700" fill="white" fontFamily="sans-serif">PDF</text>
  </svg>
)

function ResumeCard({ resume }: { resume: ResumeSummary }) {
  const { t } = useTranslation()
  const viewUrl = toAbsoluteApiUrl(resume.viewUrl)
  const downloadUrl = toAbsoluteApiUrl(resume.downloadUrl)
  const lang = detectLang(resume.filename)

  return (
    <div className="resume-card">
      <div className="resume-card-preview-area">
        <PdfIcon />
        {lang && (
          <div className="resume-card-flag">
            <img src={lang.flagUrl} alt={lang.label} />
            <span>{lang.label}</span>
          </div>
        )}
      </div>
      <div className="resume-card-info">
        <span className="resume-card-filename" title={resume.filename}>
          {resume.filename}
        </span>
        <div className="resume-card-actions">
          <a
            href={viewUrl ?? undefined}
            target="_blank"
            rel="noreferrer"
            className="button button-secondary"
            onClick={() => trackEvent('resume_view')}
          >
            {t('resume.view')}
          </a>
          <a
            href={downloadUrl ?? undefined}
            target="_blank"
            rel="noreferrer"
            className="button button-primary"
            onClick={() => trackEvent('resume_download')}
          >
            {t('resume.download')}
          </a>
        </div>
      </div>
    </div>
  )
}

function ResumeSection({ resumes }: ResumeSectionProps) {
  const { t } = useTranslation()

  return (
    <section id="resume" className="section shell">
      <ScrollReveal variant="up">
        <SectionTitle eyebrow={t('resume.eyebrow')} title={t('resume.title')} />
        {resumes.length > 0 ? (
          <div className="resume-cards-grid">
            {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
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
