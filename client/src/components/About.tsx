import { useTranslation } from 'react-i18next'
import SectionTitle from './SectionTitle.tsx'
import ScrollReveal from './ScrollReveal.tsx'

function About() {
  const { t } = useTranslation()

  const highlights = [
    t('about.highlight1'),
    t('about.highlight2'),
    t('about.highlight3'),
  ]

  return (
    <section id="about" className="section shell">
      <ScrollReveal variant="up">
        <SectionTitle eyebrow={t('about.eyebrow')} title={t('about.title')} />

        <div className="about-layout">
          <div className="card">
            <p className="section-lead">{t('about.lead')}</p>
            <p>{t('about.body')}</p>
          </div>

          <div className="info-stack">
            {highlights.map((item) => (
              <div key={item} className="info-card">
                <span className="info-dot" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}

export default About
