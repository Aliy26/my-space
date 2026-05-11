import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useTranslation } from "react-i18next";
import resumeFallback from "../assets/resume.pdf";
import DocumentIcon from "./DocumentIcon.tsx";
import HeroTerminal from "./HeroTerminal.tsx";
import HeroTyping from "./HeroTyping.tsx";

type HeroProps = {
  theme: "dark" | "light";
  resumeUrl?: string | null;
  years?: string;
  builds?: string;
};

const stackBadges = ["Nextjs", "Nestjs", "TypeScript", "GraphQL"];
const heroParticles = [
  { x: "10%", y: "18%", size: "10px", delay: "0s", duration: "8s" },
  { x: "18%", y: "74%", size: "8px", delay: "1.2s", duration: "7.4s" },
  { x: "32%", y: "10%", size: "6px", delay: "0.4s", duration: "6.8s" },
  { x: "40%", y: "82%", size: "9px", delay: "2.3s", duration: "7.8s" },
  { x: "58%", y: "16%", size: "12px", delay: "1s", duration: "8.5s" },
  { x: "70%", y: "72%", size: "7px", delay: "2.7s", duration: "6.9s" },
  { x: "82%", y: "24%", size: "11px", delay: "1.6s", duration: "7.1s" },
  { x: "88%", y: "58%", size: "8px", delay: "3.1s", duration: "8.2s" },
];

function Hero({ theme, resumeUrl, years = "4", builds = "12" }: HeroProps) {
  const { t } = useTranslation();

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const { currentTarget, clientX, clientY } = event;
    const bounds = currentTarget.getBoundingClientRect();
    const relativeX = (clientX - bounds.left) / bounds.width;
    const relativeY = (clientY - bounds.top) / bounds.height;
    const offsetX = (relativeX - 0.5) * 2;
    const offsetY = (relativeY - 0.5) * 2;

    currentTarget.style.setProperty("--hero-mx", `${offsetX}`);
    currentTarget.style.setProperty("--hero-my", `${offsetY}`);
    currentTarget.style.setProperty("--hero-rx", `${offsetY * -8}deg`);
    currentTarget.style.setProperty("--hero-ry", `${offsetX * 10}deg`);
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    const { currentTarget } = event;
    currentTarget.style.setProperty("--hero-mx", "0");
    currentTarget.style.setProperty("--hero-my", "0");
    currentTarget.style.setProperty("--hero-rx", "0deg");
    currentTarget.style.setProperty("--hero-ry", "0deg");
  };

  return (
    <section id="hero" className="hero shell">
      <div className="hero-copy">
        <p className="eyebrow">{t("hero.eyebrow")}</p>
        <h1>{t("hero.title")}</h1>
        <HeroTyping text={t("hero.description")} />

        <div className="hero-stats-strip">
          <div className="hero-stat">
            <span className="hero-stat-number">{years}</span>
            <span className="hero-stat-label">Years exp.</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-number">{builds}</span>
            <span className="hero-stat-label">Projects shipped</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-number">Full</span>
            <span className="hero-stat-label">Stack</span>
          </div>
        </div>

        <div className="hero-actions">
          <a className="button button-primary" href="#projects">
            {t("hero.seeProjects")}
          </a>
          <a
            className="button button-secondary button-icon"
            href={resumeUrl ?? resumeFallback}
            target="_blank"
            rel="noreferrer"
          >
            <DocumentIcon />
            <span>{t("hero.resume")}</span>
          </a>
        </div>
      </div>

      <div
        className={`hero-visual hero-visual-${theme}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        aria-hidden="true"
      >
        <div className="hero-visual-shell">
          <div className="hero-visual-grid" />
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          <div className="hero-orbit hero-orbit-three" />
          <div className="hero-glow" />

          <div className="hero-particle-field">
            {heroParticles.map((particle, index) => (
              <span
                key={index}
                className="hero-particle"
                style={
                  {
                    "--x": particle.x,
                    "--y": particle.y,
                    "--size": particle.size,
                    "--delay": particle.delay,
                    "--duration": particle.duration,
                  } as CSSProperties
                }
              />
            ))}
          </div>

          <div className="hero-centerpiece">
            <div className="hero-center-halo" />
            <HeroTerminal />
          </div>

          <div className="hero-float hero-float-top">
            <div className="hero-float-dot" />
            <div>
              <p className="hero-float-label">{t("hero.buildStack")}</p>
              <div className="hero-chip-row">
                {stackBadges.map((badge) => (
                  <span key={badge} className="hero-chip">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="hero-float hero-float-bottom">
            <div className="hero-float-status">
              <span className="hero-float-status-dot" />
              <span className="hero-float-status-text">
                Currently Employed at JCG
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
