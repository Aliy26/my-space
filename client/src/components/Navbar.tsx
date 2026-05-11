import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "../i18n/index.ts";
import heroImage from "../assets/images/users/hero-image.png";

const ownerName = import.meta.env.VITE_OWNER_NAME || "Umar";

const SunIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
    <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
    <line x1="2" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="22" y2="12" />
    <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
    <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

type NavbarProps = {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  isAdminView?: boolean;
  profileImageUrl?: string | null;
  isScrolled?: boolean;
};

function Navbar({
  theme,
  onToggleTheme,
  isAdminView = false,
  isScrolled = false,
}: NavbarProps) {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ??
    SUPPORTED_LANGUAGES[0];

  const navItems = [
    { href: "#about", label: t("nav.about") },
    { href: "#skills", label: t("nav.skills") },
    { href: "#projects", label: t("nav.projects") },
    { href: "#resume", label: t("nav.resume") },
    { href: "#contact", label: t("nav.contact") },
  ];

  const links = isAdminView
    ? [{ href: "/", label: t("nav.backToSite") }]
    : navItems;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (code: LanguageCode) => {
    void i18n.changeLanguage(code)
    window.localStorage.setItem('portfolio-language', code)
    setLangOpen(false)
  }

  return (
    <header
      className={`site-header ${isScrolled ? "site-header-scrolled" : ""}`}
    >
      <nav className="nav shell" aria-label="Primary">
        {/* <a className="brand" href={isAdminView ? "/" : "#hero"}>
          <span className="brand-mark">
            {profileImageUrl ? (
              <img
                className="brand-image"
                src={profileImageUrl}
                alt={`${ownerName} profile`}
              />
            ) : (
              ownerName.charAt(0).toUpperCase()
            )}
          </span>
          <span className="brand-name">{ownerName}</span>
        </a> */}
        <a className="brand" href={isAdminView ? "/" : "#hero"}>
          <span className="brand-mark">
            <img
              className="brand-image"
              src={heroImage}
              alt={`${ownerName} profile`}
            />
          </span>
          <span className="brand-name">{ownerName}</span>
        </a>

        <button
          type="button"
          className="nav-hamburger"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-actions ${menuOpen ? "nav-actions-open" : ""}`}>
          <div className="nav-links">
            {links.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="nav-controls">
            {/* Language dropdown */}
            <div className="lang-dropdown" ref={langRef}>
              <button
                type="button"
                className="lang-toggle"
                aria-haspopup="listbox"
                aria-expanded={langOpen}
                onClick={() => setLangOpen((v) => !v)}
              >
                <img
                  className="lang-toggle-flag"
                  src={currentLang.flagUrl}
                  alt={currentLang.label}
                  aria-hidden="true"
                />
                <span className="lang-toggle-code">
                  {currentLang.code.toUpperCase()}
                </span>
                <span
                  className={`lang-toggle-chevron ${langOpen ? "lang-toggle-chevron-open" : ""}`}
                >
                  ▾
                </span>
              </button>

              {langOpen && (
                <ul className="lang-menu" role="listbox">
                  {SUPPORTED_LANGUAGES.map(({ code, label, flagUrl }) => (
                    <li
                      key={code}
                      role="option"
                      aria-selected={i18n.language === code}
                      className={`lang-menu-item ${i18n.language === code ? "lang-menu-item-active" : ""}`}
                      onClick={() => handleLanguageChange(code as LanguageCode)}
                    >
                      <img
                        className="lang-menu-flag"
                        src={flagUrl}
                        alt={label}
                        aria-hidden="true"
                      />
                      <span className="lang-menu-label">{label}</span>
                      {i18n.language === code && (
                        <span className="lang-menu-check" aria-hidden="true">
                          ✓
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Theme toggle */}
            <button
              type="button"
              className={`theme-toggle ${theme === "light" ? "theme-toggle-active" : ""}`}
              onClick={onToggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              <span className="theme-toggle-label">
                <MoonIcon />
              </span>
              <span className="theme-toggle-track">
                <span className="theme-toggle-thumb">
                  {theme === "light" ? <SunIcon /> : <MoonIcon />}
                </span>
              </span>
              <span className="theme-toggle-label">
                <SunIcon />
              </span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
