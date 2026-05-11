import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import About from "./components/About";
import TechTicker from "./components/TechTicker";
import AdminPage from "./components/AdminPage";
import BackgroundEffect from "./components/BackgroundEffect";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import LoginPage from "./components/LoginPage";
import Navbar from "./components/Navbar";
import Projects from "./components/Projects";
import ResumeSection from "./components/ResumeSection";
import Skills from "./components/Skills";
import { projects as fallbackProjects } from "./data/projects.ts";
import { skills as fallbackSkills } from "./data/skills.ts";
import i18n from "./i18n/index.ts";
import { LANGUAGE_STORAGE_KEY, type LanguageCode } from "./i18n/index.ts";
import {
  checkAuth,
  fetchContactSettings,
  fetchDefaultLanguage,
  fetchHeroStats,
  fetchProfileImage,
  fetchProjects,
  fetchResume,
  fetchSkills,
  logout,
  toAbsoluteApiUrl,
  type ContactSettings,
  type HeroStats,
} from "./lib/api.ts";
import { trackEvent } from "./lib/track.ts";
import type { ProfileImageSummary } from "./types/profile-image.types.ts";
import type { Project } from "./types/project.types.ts";
import type { ResumeSummary } from "./types/resume.types.ts";
import type { Skill } from "./types/skill.types.ts";

type Theme = "dark" | "light";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";

  const storedTheme = window.localStorage.getItem("portfolio-theme");
  if (storedTheme === "dark" || storedTheme === "light") return storedTheme;

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [projects, setProjects] = useState<Project[]>(fallbackProjects);
  const [skills, setSkills] = useState<Skill[]>(fallbackSkills);
  const [profileImage, setProfileImage] = useState<ProfileImageSummary | null>(
    null,
  );
  const [resume, setResume] = useState<ResumeSummary | null>(null);
  const [contactSettings, setContactSettings] = useState<ContactSettings>({
    email: "umaraliy092@gmail.com",
    github: "https://github.com/aliy26",
  });
  const [heroStats, setHeroStats] = useState<HeroStats>({
    years: "4",
    builds: "12",
  });
  const [isScrolled, setIsScrolled] = useState(false);
  // null = checking, false = not logged in, string = username
  const [authUser, setAuthUser] = useState<string | null | false>(null);
  const isAdminView = window.location.pathname.startsWith("/admin");

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    window.localStorage.setItem("portfolio-theme", theme);
  }, [theme]);

  // Track page visits (only on public site, not admin panel)
  useEffect(() => {
    if (!isAdminView) {
      trackEvent("page_visit");
    }
  }, [isAdminView]);

  useEffect(() => {
    const root = document.documentElement;
    const updateCursor = (x: number, y: number) => {
      root.style.setProperty("--cursor-x", `${x}px`);
      root.style.setProperty("--cursor-y", `${y}px`);
    };

    updateCursor(window.innerWidth / 2, window.innerHeight / 2);

    const handlePointerMove = (event: PointerEvent) =>
      updateCursor(event.clientX, event.clientY);
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 48);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // Check auth state via cookie (server validates)
      if (isAdminView) {
        const username = await checkAuth();
        if (isMounted) setAuthUser(username ?? false);
      }

      try {
        const [projectList, defaultLang] = await Promise.all([
          fetchProjects(),
          fetchDefaultLanguage(),
        ]);
        if (isMounted) {
          setProjects(projectList);
          const storedLanguage =
            window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode | null
          const languageToUse = storedLanguage ?? (defaultLang as LanguageCode)
          void i18n.changeLanguage(languageToUse)
        }
      } catch {
        // Keep fallback data when API is unavailable.
      }

      try {
        const skillList = await fetchSkills();
        if (isMounted && skillList.length > 0) setSkills(skillList);
      } catch {
        // Skills fall back to static data.
      }

      try {
        const resumeSummary = await fetchResume();
        if (isMounted) setResume(resumeSummary);
      } catch {
        // Hero falls back to local resume.
      }

      try {
        const profileImageSummary = await fetchProfileImage();
        if (isMounted) setProfileImage(profileImageSummary);
      } catch {
        // Navbar falls back to letter badge.
      }

      try {
        const [contact, stats] = await Promise.all([
          fetchContactSettings(),
          fetchHeroStats(),
        ]);
        if (isMounted) {
          setContactSettings(contact);
          setHeroStats(stats);
        }
      } catch {
        // Keep hardcoded defaults.
      }
    };

    void loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = () => {
    setAuthUser("admin");
  };

  const handleLogout = async () => {
    await logout();
    setAuthUser(false);
    window.location.href = "/";
  };

  const resumeUrl = resume ? toAbsoluteApiUrl(resume.viewUrl) : null;
  const profileImageUrl = profileImage
    ? toAbsoluteApiUrl(profileImage.viewUrl)
    : null;

  const renderAdminContent = () => {
    // Still checking auth state
    if (authUser === null) return null;
    if (authUser === false) return <LoginPage onLogin={handleLogin} />;
    return (
      <AdminPage
        onProfileImageChange={setProfileImage}
        onLogout={handleLogout}
      />
    );
  };

  return (
    <I18nextProvider i18n={i18n}>
      <div className={`app app-${theme}`}>
        <BackgroundEffect theme={theme} />
        <Navbar
          theme={theme}
          isAdminView={isAdminView}
          isScrolled={isScrolled}
          profileImageUrl={profileImageUrl}
          onToggleTheme={() =>
            setTheme((current) => (current === "dark" ? "light" : "dark"))
          }
        />
        {isAdminView ? (
          renderAdminContent()
        ) : (
          <main>
            <Hero
              theme={theme}
              resumeUrl={resumeUrl}
              years={heroStats.years}
              builds={heroStats.builds}
            />
            <About />
            <Skills skills={skills} />
            <div className="ticker-strip">
              <TechTicker />
            </div>
            <Projects projects={projects} />
            <ResumeSection resume={resume} />
            <Contact
              email={contactSettings.email}
              github={contactSettings.github}
            />
          </main>
        )}
        <Footer email={contactSettings.email} github={contactSettings.github} />
      </div>
    </I18nextProvider>
  );
}

export default App;
