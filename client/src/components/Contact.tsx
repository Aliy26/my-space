import { useTranslation } from "react-i18next";
import SectionTitle from "./SectionTitle.tsx";
import ScrollReveal from "./ScrollReveal.tsx";

const PHONE = "+821058890660";
const PHONE_DISPLAY = "+82 10-5889-0660";

type ContactProps = {
  email?: string;
  github?: string;
};

function Contact({
  email = "umaraliy092@gmail.com",
  github = "https://github.com/aliy26",
}: ContactProps) {
  const { t } = useTranslation();

  const githubDisplay = github.replace(/^https?:\/\//, "");

  const contactItems = [
    {
      label: t("contact.email"),
      value: email,
      href: `mailto:${email}`,
    },
    {
      label: t("contact.phone"),
      value: PHONE_DISPLAY,
      href: `tel:${PHONE}`,
    },
    {
      label: t("contact.github"),
      value: githubDisplay,
      href: github,
    },
    {
      label: t("contact.location"),
      value: t("contact.availability"),
      href: "#contact",
    },
  ];

  return (
    <section id="contact" className="section shell">
      <ScrollReveal variant="up">
        <SectionTitle
          eyebrow={t("contact.eyebrow")}
          title={t("contact.title")}
        />

        <div className="contact-layout">
          <div className="card">
            <p className="section-lead">{t("contact.lead")}</p>
            <a className="button button-primary" href={`mailto:${email}`}>
              {t("contact.startConversation")}
            </a>
          </div>

          <div className="contact-list">
            {contactItems.map((item) => (
              <a
                key={item.label}
                className="info-card contact-card"
                href={item.href}
              >
                <span className="contact-label">{item.label}</span>
                <strong>{item.value}</strong>
              </a>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

export default Contact;
