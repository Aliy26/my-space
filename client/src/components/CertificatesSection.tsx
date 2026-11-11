import { toAbsoluteApiUrl } from "../lib/api.ts";
import { useTranslation } from "react-i18next";
import { trackEvent } from "../lib/track.ts";
import type { CertificateSummary } from "../types/certificate.types.ts";
import ScrollReveal from "./ScrollReveal.tsx";
import SectionTitle from "./SectionTitle.tsx";

type CertificatesSectionProps = {
  certificates: CertificateSummary[];
};

const CertificateIcon = () => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    aria-hidden="true"
    className="resume-card-icon"
  >
    <rect
      x="8"
      y="6"
      width="36"
      height="48"
      rx="4"
      fill="currentColor"
      opacity="0.08"
    />
    <rect
      x="8"
      y="6"
      width="36"
      height="48"
      rx="4"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M24 17h12M24 26h16M24 35h12"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <rect
      x="16"
      y="38"
      width="28"
      height="12"
      rx="3"
      fill="currentColor"
      opacity="0.9"
    />
    <path d="M30 44h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

function CertificateCard({ certificate }: { certificate: CertificateSummary }) {
  const { t } = useTranslation();
  const hasDirectFile = Boolean(certificate.viewUrl);
  const viewHref = hasDirectFile
    ? (toAbsoluteApiUrl(certificate.viewUrl) ?? undefined)
    : undefined;
  const downloadHref = hasDirectFile
    ? (toAbsoluteApiUrl(certificate.downloadUrl ?? certificate.viewUrl) ??
      viewHref)
    : undefined;

  return (
    <div className="resume-card">
      <div className="resume-card-preview-area">
        <CertificateIcon />
      </div>
      <div className="resume-card-info">
        <span className="resume-card-filename" title={certificate.title}>
          {certificate.title}
        </span>
        {certificate.description ? (
          <p
            className="section-lead"
            style={{ margin: 0, textAlign: "center" }}
          >
            {certificate.description}
          </p>
        ) : null}
        <div className="resume-card-actions">
          {viewHref ? (
            <a
              href={viewHref}
              target="_blank"
              rel="noreferrer"
              className="button button-primary"
              onClick={() => trackEvent("resume_view")}
            >
              {t("certificates.view")}
            </a>
          ) : null}
          {downloadHref && hasDirectFile ? (
            <a
              href={downloadHref}
              className="button button-secondary"
              target="_blank"
              rel="noreferrer"
              download={certificate.filename ?? undefined}
            >
              {t("certificates.download")}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CertificatesSection({ certificates }: CertificatesSectionProps) {
  const { t } = useTranslation();

  return (
    <section id="certificates" className="section shell">
      <ScrollReveal variant="up">
        <SectionTitle
          eyebrow={t("certificates.eyebrow")}
          title={t("certificates.title")}
        />
        {certificates.length > 0 ? (
          <div className="resume-cards-grid">
            {certificates.map((certificate) => (
              <CertificateCard key={certificate.id} certificate={certificate} />
            ))}
          </div>
        ) : (
          <div className="card">
            <p className="section-lead">{t("certificates.empty")}</p>
          </div>
        )}
      </ScrollReveal>
    </section>
  );
}

export default CertificatesSection;
