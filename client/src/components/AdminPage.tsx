import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useTranslation } from "react-i18next";
import {
  createProject,
  createSkill,
  deleteProject,
  deleteSkill,
  fetchContactSettings,
  fetchDefaultLanguage,
  fetchHeroStats,
  fetchProfileImage,
  fetchProjects,
  fetchResume,
  fetchSkills,
  toAbsoluteApiUrl,
  updateContactSettings,
  updateDefaultLanguage,
  updateHeroStats,
  updateProject,
  updateSkill,
  uploadProfileImage,
  uploadResume,
  type ContactSettings,
  type HeroStats,
} from "../lib/api.ts";
import type { ProfileImageSummary } from "../types/profile-image.types.ts";
import type { Project } from "../types/project.types.ts";
import type { ResumeSummary } from "../types/resume.types.ts";
import type { Skill } from "../types/skill.types.ts";
import { type LanguageCode, SUPPORTED_LANGUAGES } from "../i18n/index.ts";
import DocumentIcon from "./DocumentIcon.tsx";

// ── Icons ──────────────────────────────────────────────────────────────────

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-5-5L5 21" />
  </svg>
);
const FileIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const ChartIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const BoltIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const FolderIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);
const ChevronIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ── Types ──────────────────────────────────────────────────────────────────

const emptyProjectForm = {
  title: "",
  description: "",
  href: "",
  tags: "",
  sortOrder: "0",
};
const emptySkillForm = { name: "", category: "", sortOrder: "0" };

type ProjectForm = typeof emptyProjectForm;
type SkillForm = typeof emptySkillForm;

type ProjectImagePreview = { file: File; objectUrl: string } | null;

type ProjectFormErrors = Partial<Record<keyof ProjectForm, string>>;

type AdminState = {
  projects: Project[];
  skills: Skill[];
  profileImage: ProfileImageSummary | null;
  resume: ResumeSummary | null;
  selectedLanguage: LanguageCode;
  contactSettings: ContactSettings;
  heroStats: HeroStats;
  projectForm: ProjectForm;
  projectFormErrors: ProjectFormErrors;
  editingProjectId: string | null;
  confirmDeleteId: string | null;
  skillForm: SkillForm;
  editingSkillId: string | null;
  projectImagePreview: ProjectImagePreview;
  profileImageFile: File | null;
  resumeFile: File | null;
  isLoading: boolean;
  isUploadingProfileImage: boolean;
  isSavingProject: boolean;
  isUploadingResume: boolean;
  isSavingLanguage: boolean;
  isSavingContact: boolean;
  isSavingHeroStats: boolean;
  isSavingSkill: boolean;
  statusMessage: string | null;
  errorMessage: string | null;
};

type AdminAction =
  | {
      type: "LOAD_SUCCESS";
      projects: Project[];
      skills: Skill[];
      resume: ResumeSummary | null;
      profileImage: ProfileImageSummary | null;
      language: LanguageCode;
      contact: ContactSettings;
      heroStats: HeroStats;
    }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "SET_PROJECT_FORM"; field: keyof ProjectForm; value: string }
  | { type: "SET_PROJECT_FORM_ERRORS"; errors: ProjectFormErrors }
  | { type: "EDIT_PROJECT"; project: Project }
  | { type: "CANCEL_EDIT" }
  | { type: "SAVE_PROJECT_START" }
  | { type: "SAVE_PROJECT_SUCCESS"; project: Project; isEdit: boolean }
  | { type: "SAVE_PROJECT_ERROR"; error: string }
  | { type: "CONFIRM_DELETE"; projectId: string }
  | { type: "CANCEL_DELETE" }
  | { type: "DELETE_PROJECT_SUCCESS"; projectId: string }
  | { type: "DELETE_PROJECT_ERROR"; error: string }
  | { type: "SET_PROFILE_IMAGE_FILE"; file: File | null }
  | { type: "UPLOAD_PROFILE_IMAGE_START" }
  | { type: "UPLOAD_PROFILE_IMAGE_SUCCESS"; profileImage: ProfileImageSummary }
  | { type: "UPLOAD_PROFILE_IMAGE_ERROR"; error: string }
  | { type: "SET_RESUME_FILE"; file: File | null }
  | { type: "UPLOAD_RESUME_START" }
  | { type: "UPLOAD_RESUME_SUCCESS"; resume: ResumeSummary }
  | { type: "UPLOAD_RESUME_ERROR"; error: string }
  | { type: "SET_LANGUAGE"; language: LanguageCode }
  | { type: "SAVE_LANGUAGE_START" }
  | { type: "SAVE_LANGUAGE_SUCCESS"; message: string }
  | { type: "SAVE_LANGUAGE_ERROR"; error: string }
  | { type: "SET_CONTACT"; field: keyof ContactSettings; value: string }
  | { type: "SAVE_CONTACT_START" }
  | { type: "SAVE_CONTACT_SUCCESS"; contact: ContactSettings }
  | { type: "SAVE_CONTACT_ERROR"; error: string }
  | { type: "SET_HERO_STAT"; field: keyof HeroStats; value: string }
  | { type: "SAVE_HERO_STATS_START" }
  | { type: "SAVE_HERO_STATS_SUCCESS"; heroStats: HeroStats }
  | { type: "SAVE_HERO_STATS_ERROR"; error: string }
  | { type: "SET_PROJECT_IMAGE"; preview: ProjectImagePreview }
  | { type: "SET_SKILL_FORM"; field: keyof SkillForm; value: string }
  | { type: "EDIT_SKILL"; skill: Skill }
  | { type: "CANCEL_EDIT_SKILL" }
  | { type: "SAVE_SKILL_START" }
  | { type: "SAVE_SKILL_SUCCESS"; skill: Skill; isEdit: boolean }
  | { type: "SAVE_SKILL_ERROR"; error: string }
  | { type: "DELETE_SKILL_SUCCESS"; skillId: string }
  | { type: "DELETE_SKILL_ERROR"; error: string };

// ── Helpers ────────────────────────────────────────────────────────────────

function sortProjects(projects: Project[]) {
  return [...projects].sort((a, b) => {
    const diff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    return diff !== 0 ? diff : a.title.localeCompare(b.title);
  });
}

function sortSkills(skills: Skill[]) {
  return [...skills].sort((a, b) => {
    const diff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
}

function formatDate(value?: string) {
  if (!value) return "Not uploaded yet";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function validateProjectForm(form: ProjectForm): ProjectFormErrors {
  const errors: ProjectFormErrors = {};

  if (!form.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!form.description.trim()) {
    errors.description = "Description is required.";
  }

  const href = form.href.trim();
  if (!href) {
    errors.href = "Link is required.";
  } else if (!href.startsWith("#")) {
    try {
      const url = new URL(href);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        errors.href = "Link must start with https:// or be a hash (#section).";
      }
    } catch {
      errors.href =
        "Link must be a valid URL (https://...) or a hash (#section).";
    }
  }

  return errors;
}

// ── Reducer ────────────────────────────────────────────────────────────────

const initialState: AdminState = {
  projects: [],
  skills: [],
  profileImage: null,
  resume: null,
  selectedLanguage: "en",
  contactSettings: { email: "", github: "" },
  heroStats: { years: "4", builds: "12" },
  projectForm: emptyProjectForm,
  projectFormErrors: {},
  editingProjectId: null,
  confirmDeleteId: null,
  skillForm: emptySkillForm,
  editingSkillId: null,
  projectImagePreview: null,
  profileImageFile: null,
  resumeFile: null,
  isLoading: true,
  isUploadingProfileImage: false,
  isSavingProject: false,
  isUploadingResume: false,
  isSavingLanguage: false,
  isSavingContact: false,
  isSavingHeroStats: false,
  isSavingSkill: false,
  statusMessage: null,
  errorMessage: null,
};

function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case "LOAD_SUCCESS":
      return {
        ...state,
        isLoading: false,
        projects: sortProjects(action.projects),
        skills: sortSkills(action.skills),
        resume: action.resume,
        profileImage: action.profileImage,
        selectedLanguage: action.language,
        contactSettings: action.contact,
        heroStats: action.heroStats,
        errorMessage: null,
      };
    case "LOAD_ERROR":
      return { ...state, isLoading: false, errorMessage: action.error };

    case "SET_PROJECT_FORM":
      return {
        ...state,
        projectForm: { ...state.projectForm, [action.field]: action.value },
        projectFormErrors: {
          ...state.projectFormErrors,
          [action.field]: undefined,
        },
      };
    case "SET_PROJECT_FORM_ERRORS":
      return { ...state, projectFormErrors: action.errors };
    case "EDIT_PROJECT":
      return {
        ...state,
        editingProjectId: action.project.id ?? null,
        projectForm: {
          title: action.project.title,
          description: action.project.description,
          href: action.project.href,
          tags: action.project.tags.join(", "),
          sortOrder: `${action.project.sortOrder ?? 0}`,
        },
        projectFormErrors: {},
        projectImagePreview: null,
        statusMessage: null,
        errorMessage: null,
      };
    case "CANCEL_EDIT":
      return {
        ...state,
        editingProjectId: null,
        projectForm: emptyProjectForm,
        projectFormErrors: {},
        projectImagePreview: null,
      };

    case "SAVE_PROJECT_START":
      return {
        ...state,
        isSavingProject: true,
        errorMessage: null,
        statusMessage: null,
      };
    case "SAVE_PROJECT_SUCCESS": {
      const next = action.isEdit
        ? state.projects.map((p) =>
            p.id === action.project.id ? action.project : p,
          )
        : [...state.projects, action.project];
      return {
        ...state,
        isSavingProject: false,
        projects: sortProjects(next),
        editingProjectId: null,
        projectForm: emptyProjectForm,
        projectFormErrors: {},
        projectImagePreview: null,
        statusMessage: action.isEdit ? "Project updated." : "Project created.",
      };
    }
    case "SAVE_PROJECT_ERROR":
      return { ...state, isSavingProject: false, errorMessage: action.error };

    case "CONFIRM_DELETE":
      return {
        ...state,
        confirmDeleteId: action.projectId,
        errorMessage: null,
        statusMessage: null,
      };
    case "CANCEL_DELETE":
      return { ...state, confirmDeleteId: null };
    case "DELETE_PROJECT_SUCCESS": {
      const projects = state.projects.filter((p) => p.id !== action.projectId);
      const editingProjectId =
        state.editingProjectId === action.projectId
          ? null
          : state.editingProjectId;
      const projectForm =
        state.editingProjectId === action.projectId
          ? emptyProjectForm
          : state.projectForm;
      return {
        ...state,
        projects,
        editingProjectId,
        projectForm,
        confirmDeleteId: null,
        statusMessage: "Project deleted.",
      };
    }
    case "DELETE_PROJECT_ERROR":
      return { ...state, confirmDeleteId: null, errorMessage: action.error };

    case "SET_PROFILE_IMAGE_FILE":
      return { ...state, profileImageFile: action.file };
    case "UPLOAD_PROFILE_IMAGE_START":
      return {
        ...state,
        isUploadingProfileImage: true,
        errorMessage: null,
        statusMessage: null,
      };
    case "UPLOAD_PROFILE_IMAGE_SUCCESS":
      return {
        ...state,
        isUploadingProfileImage: false,
        profileImage: action.profileImage,
        profileImageFile: null,
        statusMessage: "Profile image updated.",
      };
    case "UPLOAD_PROFILE_IMAGE_ERROR":
      return {
        ...state,
        isUploadingProfileImage: false,
        errorMessage: action.error,
      };

    case "SET_RESUME_FILE":
      return { ...state, resumeFile: action.file };
    case "UPLOAD_RESUME_START":
      return {
        ...state,
        isUploadingResume: true,
        errorMessage: null,
        statusMessage: null,
      };
    case "UPLOAD_RESUME_SUCCESS":
      return {
        ...state,
        isUploadingResume: false,
        resume: action.resume,
        resumeFile: null,
        statusMessage: "Resume updated.",
      };
    case "UPLOAD_RESUME_ERROR":
      return { ...state, isUploadingResume: false, errorMessage: action.error };

    case "SET_LANGUAGE":
      return { ...state, selectedLanguage: action.language };
    case "SAVE_LANGUAGE_START":
      return {
        ...state,
        isSavingLanguage: true,
        errorMessage: null,
        statusMessage: null,
      };
    case "SAVE_LANGUAGE_SUCCESS":
      return {
        ...state,
        isSavingLanguage: false,
        statusMessage: action.message,
      };
    case "SAVE_LANGUAGE_ERROR":
      return { ...state, isSavingLanguage: false, errorMessage: action.error };

    case "SET_CONTACT":
      return {
        ...state,
        contactSettings: {
          ...state.contactSettings,
          [action.field]: action.value,
        },
      };
    case "SAVE_CONTACT_START":
      return {
        ...state,
        isSavingContact: true,
        errorMessage: null,
        statusMessage: null,
      };
    case "SAVE_CONTACT_SUCCESS":
      return {
        ...state,
        isSavingContact: false,
        contactSettings: action.contact,
        statusMessage: "Contact settings saved.",
      };
    case "SAVE_CONTACT_ERROR":
      return { ...state, isSavingContact: false, errorMessage: action.error };

    case "SET_HERO_STAT":
      return {
        ...state,
        heroStats: { ...state.heroStats, [action.field]: action.value },
      };
    case "SAVE_HERO_STATS_START":
      return {
        ...state,
        isSavingHeroStats: true,
        errorMessage: null,
        statusMessage: null,
      };
    case "SAVE_HERO_STATS_SUCCESS":
      return {
        ...state,
        isSavingHeroStats: false,
        heroStats: action.heroStats,
        statusMessage: "Hero stats saved.",
      };
    case "SAVE_HERO_STATS_ERROR":
      return { ...state, isSavingHeroStats: false, errorMessage: action.error };

    case "SET_PROJECT_IMAGE":
      return { ...state, projectImagePreview: action.preview };

    case "SET_SKILL_FORM":
      return {
        ...state,
        skillForm: { ...state.skillForm, [action.field]: action.value },
      };
    case "EDIT_SKILL":
      return {
        ...state,
        editingSkillId: action.skill.id ?? null,
        skillForm: {
          name: action.skill.name,
          category: action.skill.category,
          sortOrder: `${action.skill.sortOrder ?? 0}`,
        },
        statusMessage: null,
        errorMessage: null,
      };
    case "CANCEL_EDIT_SKILL":
      return { ...state, editingSkillId: null, skillForm: emptySkillForm };
    case "SAVE_SKILL_START":
      return {
        ...state,
        isSavingSkill: true,
        errorMessage: null,
        statusMessage: null,
      };
    case "SAVE_SKILL_SUCCESS": {
      const next = action.isEdit
        ? state.skills.map((s) => (s.id === action.skill.id ? action.skill : s))
        : [...state.skills, action.skill];
      return {
        ...state,
        isSavingSkill: false,
        skills: sortSkills(next),
        editingSkillId: null,
        skillForm: emptySkillForm,
        statusMessage: action.isEdit ? "Skill updated." : "Skill added.",
      };
    }
    case "SAVE_SKILL_ERROR":
      return { ...state, isSavingSkill: false, errorMessage: action.error };
    case "DELETE_SKILL_SUCCESS": {
      const skills = state.skills.filter((s) => s.id !== action.skillId);
      return { ...state, skills, statusMessage: "Skill deleted." };
    }
    case "DELETE_SKILL_ERROR":
      return { ...state, errorMessage: action.error };

    default:
      return state;
  }
}

// ── Component ──────────────────────────────────────────────────────────────

type AdminPageProps = {
  onProfileImageChange?: (profileImage: ProfileImageSummary | null) => void;
  onLogout: () => void;
};

function AdminPage({ onProfileImageChange, onLogout }: AdminPageProps) {
  const { t, i18n } = useTranslation();
  const [state, dispatch] = useReducer(adminReducer, initialState);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const projectFormRef = useRef<HTMLFormElement>(null);

  const toggleSection = (id: string) =>
    setOpenSection((prev) => (prev === id ? null : id));

  const {
    projects,
    skills,
    profileImage,
    resume,
    selectedLanguage,
    contactSettings,
    heroStats,
    projectForm,
    projectFormErrors,
    editingProjectId,
    confirmDeleteId,
    skillForm,
    editingSkillId,
    projectImagePreview,
    profileImageFile,
    resumeFile,
    isLoading,
    isUploadingProfileImage,
    isSavingProject,
    isUploadingResume,
    isSavingLanguage,
    isSavingContact,
    isSavingHeroStats,
    isSavingSkill,
    statusMessage,
    errorMessage,
  } = state;

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const [
          projectList,
          skillList,
          resumeSummary,
          profileImageSummary,
          defaultLang,
          contact,
          stats,
        ] = await Promise.all([
          fetchProjects(),
          fetchSkills(),
          fetchResume(),
          fetchProfileImage(),
          fetchDefaultLanguage(),
          fetchContactSettings(),
          fetchHeroStats(),
        ]);

        if (!isMounted) return;

        dispatch({
          type: "LOAD_SUCCESS",
          projects: projectList,
          skills: skillList,
          resume: resumeSummary,
          profileImage: profileImageSummary,
          language: defaultLang as LanguageCode,
          contact,
          heroStats: stats,
        });
        onProfileImageChange?.(profileImageSummary);
      } catch (error) {
        if (isMounted) {
          dispatch({
            type: "LOAD_ERROR",
            error:
              error instanceof Error
                ? error.message
                : "Unable to load admin data.",
          });
        }
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Scroll project form into view when editing starts
  useEffect(() => {
    if (editingProjectId && projectFormRef.current) {
      projectFormRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [editingProjectId]);

  const resumeLinks = useMemo(() => {
    if (!resume) return null;
    return {
      view: toAbsoluteApiUrl(resume.viewUrl),
      download: toAbsoluteApiUrl(resume.downloadUrl),
    };
  }, [resume]);

  const profileImageUrl = useMemo(
    () => (profileImage ? toAbsoluteApiUrl(profileImage.viewUrl) : null),
    [profileImage],
  );

  const handleProjectSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateProjectForm(projectForm);
    if (Object.keys(errors).length > 0) {
      dispatch({ type: "SET_PROJECT_FORM_ERRORS", errors });
      return;
    }

    dispatch({ type: "SAVE_PROJECT_START" });

    try {
      const payload = {
        title: projectForm.title.trim(),
        description: projectForm.description.trim(),
        href: projectForm.href.trim(),
        tags: projectForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        sortOrder: Number(projectForm.sortOrder || 0),
        imageFile: projectImagePreview?.file ?? null,
      };

      const saved = editingProjectId
        ? await updateProject(editingProjectId, payload)
        : await createProject(payload);

      dispatch({
        type: "SAVE_PROJECT_SUCCESS",
        project: saved,
        isEdit: !!editingProjectId,
      });
    } catch (error) {
      dispatch({
        type: "SAVE_PROJECT_ERROR",
        error:
          error instanceof Error ? error.message : "Unable to save project.",
      });
    }
  };

  const handleDeleteConfirmed = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      dispatch({ type: "DELETE_PROJECT_SUCCESS", projectId });
    } catch (error) {
      dispatch({
        type: "DELETE_PROJECT_ERROR",
        error:
          error instanceof Error ? error.message : "Unable to delete project.",
      });
    }
  };

  const handleResumeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!resumeFile) return;

    dispatch({ type: "UPLOAD_RESUME_START" });

    try {
      const next = await uploadResume(resumeFile);
      dispatch({ type: "UPLOAD_RESUME_SUCCESS", resume: next });
    } catch (error) {
      dispatch({
        type: "UPLOAD_RESUME_ERROR",
        error:
          error instanceof Error ? error.message : "Unable to upload resume.",
      });
    }
  };

  const handleProfileImageSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!profileImageFile) return;

    dispatch({ type: "UPLOAD_PROFILE_IMAGE_START" });

    try {
      const next = await uploadProfileImage(profileImageFile);
      dispatch({ type: "UPLOAD_PROFILE_IMAGE_SUCCESS", profileImage: next });
      onProfileImageChange?.(next);
    } catch (error) {
      dispatch({
        type: "UPLOAD_PROFILE_IMAGE_ERROR",
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload profile image.",
      });
    }
  };

  const handleLanguageSave = async () => {
    dispatch({ type: "SAVE_LANGUAGE_START" });

    try {
      await updateDefaultLanguage(selectedLanguage);
      void i18n.changeLanguage(selectedLanguage);
      dispatch({
        type: "SAVE_LANGUAGE_SUCCESS",
        message: t("admin.languageSaved"),
      });
    } catch (error) {
      dispatch({
        type: "SAVE_LANGUAGE_ERROR",
        error:
          error instanceof Error ? error.message : "Unable to update language.",
      });
    }
  };

  const handleContactSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({ type: "SAVE_CONTACT_START" });

    try {
      const saved = await updateContactSettings(contactSettings);
      dispatch({ type: "SAVE_CONTACT_SUCCESS", contact: saved });
    } catch (error) {
      dispatch({
        type: "SAVE_CONTACT_ERROR",
        error:
          error instanceof Error
            ? error.message
            : "Unable to save contact settings.",
      });
    }
  };

  const handleHeroStatsSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({ type: "SAVE_HERO_STATS_START" });

    try {
      const saved = await updateHeroStats(heroStats);
      dispatch({ type: "SAVE_HERO_STATS_SUCCESS", heroStats: saved });
    } catch (error) {
      dispatch({
        type: "SAVE_HERO_STATS_ERROR",
        error:
          error instanceof Error ? error.message : "Unable to save hero stats.",
      });
    }
  };

  const handleSkillSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = skillForm.name.trim();
    const category = skillForm.category.trim();

    if (!name || !category) return;

    dispatch({ type: "SAVE_SKILL_START" });

    try {
      const payload = {
        name,
        category,
        sortOrder: Number(skillForm.sortOrder || 0),
      };
      const saved = editingSkillId
        ? await updateSkill(editingSkillId, payload)
        : await createSkill(payload);
      dispatch({
        type: "SAVE_SKILL_SUCCESS",
        skill: saved,
        isEdit: !!editingSkillId,
      });
    } catch (error) {
      dispatch({
        type: "SAVE_SKILL_ERROR",
        error: error instanceof Error ? error.message : "Unable to save skill.",
      });
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    try {
      await deleteSkill(skillId);
      dispatch({ type: "DELETE_SKILL_SUCCESS", skillId });
    } catch (error) {
      dispatch({
        type: "DELETE_SKILL_ERROR",
        error:
          error instanceof Error ? error.message : "Unable to delete skill.",
      });
    }
  };

  const accordionSections = [
    {
      id: "brand-image",
      Icon: ImageIcon,
      label: t("admin.brandImage"),
      title: t("admin.navbarProfileImage"),
    },
    {
      id: "resume",
      Icon: FileIcon,
      label: t("admin.resume"),
      title: t("admin.currentResume"),
    },
    {
      id: "contact",
      Icon: MailIcon,
      label: t("admin.contactSettings"),
      title: t("admin.contactSettingsTitle"),
    },
    {
      id: "hero-stats",
      Icon: ChartIcon,
      label: t("admin.heroStats"),
      title: t("admin.heroStatsTitle"),
    },
    {
      id: "language",
      Icon: GlobeIcon,
      label: t("admin.language"),
      title: t("admin.languageLabel"),
    },
    {
      id: "skills",
      Icon: BoltIcon,
      label: t("admin.skills"),
      title: editingSkillId ? t("admin.editSkill") : t("admin.addSkill"),
    },
    {
      id: "projects",
      Icon: FolderIcon,
      label: t("admin.projects"),
      title: editingProjectId ? t("admin.editProject") : t("admin.addProject"),
    },
  ];

  return (
    <main className="admin-page shell">
      <section className="admin-hero card">
        <div className="admin-hero-top">
          <p className="eyebrow">{t("admin.eyebrow")}</p>
          <button
            type="button"
            className="button button-secondary"
            onClick={onLogout}
          >
            {t("admin.logout")}
          </button>
        </div>
        <h1>{t("admin.title")}</h1>
        <p className="admin-lead">{t("admin.lead")}</p>

        {statusMessage ? (
          <p className="admin-status admin-status-success">{statusMessage}</p>
        ) : null}
        {errorMessage ? (
          <p className="admin-status admin-status-error">{errorMessage}</p>
        ) : null}
      </section>

      <div className="admin-accordion">
        {accordionSections.map(({ id, Icon, label, title }) => {
          const isOpen = openSection === id;
          return (
            <div
              key={id}
              className={`accordion-item ${isOpen ? "accordion-item-open" : ""}`}
            >
              <button
                type="button"
                className="accordion-trigger"
                aria-expanded={isOpen}
                onClick={() => toggleSection(id)}
              >
                <span className="accordion-trigger-left">
                  <span className="accordion-icon">
                    <Icon />
                  </span>
                  <span className="accordion-meta">
                    <span className="accordion-label">{label}</span>
                    <span className="accordion-title">{title}</span>
                  </span>
                </span>
                <span
                  className={`accordion-chevron ${isOpen ? "accordion-chevron-open" : ""}`}
                >
                  <ChevronIcon />
                </span>
              </button>

              <div
                className={`accordion-body ${isOpen ? "accordion-body-open" : ""}`}
              >
                <div className="accordion-body-inner">
                  {/* ── Brand Image ──────────────────────────── */}
                  {id === "brand-image" && (
                    <div className="admin-form">
                      <div className="admin-avatar-preview">
                        {profileImageUrl ? (
                          <img
                            src={profileImageUrl}
                            alt="Current navbar profile"
                          />
                        ) : (
                          <span>A</span>
                        )}
                      </div>
                      <div className="admin-resume-meta">
                        <strong>
                          {profileImage?.filename ?? t("admin.noProfileImage")}
                        </strong>
                        <span>
                          {t("admin.lastUpdated")}{" "}
                          {formatDate(profileImage?.updatedAt)}
                        </span>
                      </div>
                      <form
                        className="admin-form"
                        onSubmit={handleProfileImageSubmit}
                      >
                        <label className="field">
                          <span>{t("admin.uploadImageLabel")}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            onChange={(e) =>
                              dispatch({
                                type: "SET_PROFILE_IMAGE_FILE",
                                file: e.target.files?.[0] ?? null,
                              })
                            }
                          />
                        </label>
                        <button
                          className="button button-primary"
                          type="submit"
                          disabled={
                            isUploadingProfileImage || !profileImageFile
                          }
                        >
                          {isUploadingProfileImage
                            ? t("admin.uploading")
                            : t("admin.uploadImage")}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* ── Resume ───────────────────────────────── */}
                  {id === "resume" && (
                    <div className="admin-form">
                      {isLoading ? (
                        <p className="section-lead">
                          {t("admin.loadingResume")}
                        </p>
                      ) : (
                        <>
                          <div className="admin-resume-meta">
                            <strong>
                              {resume?.filename ?? t("admin.noResume")}
                            </strong>
                            <span>
                              {t("admin.lastUpdated")}{" "}
                              {formatDate(resume?.updatedAt)}
                            </span>
                          </div>
                          {resumeLinks ? (
                            <div className="admin-inline-actions">
                              <a
                                className="button button-secondary button-icon"
                                href={resumeLinks.view ?? undefined}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <DocumentIcon />
                                <span>{t("admin.viewResume")}</span>
                              </a>
                              <a
                                className="button button-primary button-icon"
                                href={resumeLinks.download ?? undefined}
                              >
                                <DocumentIcon />
                                <span>{t("admin.downloadResume")}</span>
                              </a>
                            </div>
                          ) : null}
                        </>
                      )}
                      <form
                        className="admin-form"
                        onSubmit={handleResumeSubmit}
                      >
                        <label className="field">
                          <span>{t("admin.uploadPdf")}</span>
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) =>
                              dispatch({
                                type: "SET_RESUME_FILE",
                                file: e.target.files?.[0] ?? null,
                              })
                            }
                          />
                        </label>
                        <button
                          className="button button-primary"
                          type="submit"
                          disabled={isUploadingResume || !resumeFile}
                        >
                          {isUploadingResume
                            ? t("admin.uploading")
                            : t("admin.uploadResume")}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* ── Contact ──────────────────────────────── */}
                  {id === "contact" && (
                    <form className="admin-form" onSubmit={handleContactSave}>
                      <label className="field">
                        <span>{t("admin.contactEmail")}</span>
                        <input
                          type="email"
                          value={contactSettings.email}
                          placeholder="you@example.com"
                          onChange={(e) =>
                            dispatch({
                              type: "SET_CONTACT",
                              field: "email",
                              value: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="field">
                        <span>{t("admin.contactGithub")}</span>
                        <input
                          type="url"
                          value={contactSettings.github}
                          placeholder="https://github.com/username"
                          onChange={(e) =>
                            dispatch({
                              type: "SET_CONTACT",
                              field: "github",
                              value: e.target.value,
                            })
                          }
                        />
                      </label>
                      <button
                        className="button button-primary"
                        type="submit"
                        disabled={isSavingContact}
                      >
                        {isSavingContact
                          ? t("admin.saving")
                          : t("admin.saveContact")}
                      </button>
                    </form>
                  )}

                  {/* ── Hero Stats ───────────────────────────── */}
                  {id === "hero-stats" && (
                    <form className="admin-form" onSubmit={handleHeroStatsSave}>
                      <label className="field">
                        <span>{t("admin.heroYears")}</span>
                        <input
                          type="text"
                          value={heroStats.years}
                          placeholder="4"
                          onChange={(e) =>
                            dispatch({
                              type: "SET_HERO_STAT",
                              field: "years",
                              value: e.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="field">
                        <span>{t("admin.heroBuilds")}</span>
                        <input
                          type="text"
                          value={heroStats.builds}
                          placeholder="12"
                          onChange={(e) =>
                            dispatch({
                              type: "SET_HERO_STAT",
                              field: "builds",
                              value: e.target.value,
                            })
                          }
                        />
                      </label>
                      <button
                        className="button button-primary"
                        type="submit"
                        disabled={isSavingHeroStats}
                      >
                        {isSavingHeroStats
                          ? t("admin.saving")
                          : t("admin.saveHeroStats")}
                      </button>
                    </form>
                  )}

                  {/* ── Language ─────────────────────────────── */}
                  {id === "language" && (
                    <div className="admin-form">
                      <div className="admin-lang-selector">
                        {SUPPORTED_LANGUAGES.map(
                          ({ code, label: langLabel }) => (
                            <button
                              key={code}
                              type="button"
                              className={`button ${selectedLanguage === code ? "button-primary" : "button-secondary"}`}
                              onClick={() =>
                                dispatch({
                                  type: "SET_LANGUAGE",
                                  language: code as LanguageCode,
                                })
                              }
                            >
                              {langLabel}
                            </button>
                          ),
                        )}
                      </div>
                      <button
                        className="button button-primary"
                        type="button"
                        onClick={handleLanguageSave}
                        disabled={isSavingLanguage}
                      >
                        {isSavingLanguage
                          ? t("admin.languageSaving")
                          : t("admin.saveLanguage")}
                      </button>
                    </div>
                  )}

                  {/* ── Skills ───────────────────────────────── */}
                  {id === "skills" && (
                    <div className="admin-form">
                      <form className="admin-form" onSubmit={handleSkillSubmit}>
                        <label className="field">
                          <span>{t("admin.skillName")}</span>
                          <input
                            type="text"
                            value={skillForm.name}
                            placeholder="React"
                            required
                            onChange={(e) =>
                              dispatch({
                                type: "SET_SKILL_FORM",
                                field: "name",
                                value: e.target.value,
                              })
                            }
                          />
                        </label>
                        <label className="field">
                          <span>{t("admin.skillCategory")}</span>
                          <input
                            type="text"
                            value={skillForm.category}
                            placeholder="Frontend"
                            required
                            onChange={(e) =>
                              dispatch({
                                type: "SET_SKILL_FORM",
                                field: "category",
                                value: e.target.value,
                              })
                            }
                          />
                        </label>
                        <label className="field field-small">
                          <span>{t("admin.projectSortOrder")}</span>
                          <input
                            type="number"
                            value={skillForm.sortOrder}
                            onChange={(e) =>
                              dispatch({
                                type: "SET_SKILL_FORM",
                                field: "sortOrder",
                                value: e.target.value,
                              })
                            }
                          />
                        </label>
                        <div className="admin-inline-actions">
                          <button
                            className="button button-primary"
                            type="submit"
                            disabled={isSavingSkill}
                          >
                            {isSavingSkill
                              ? t("admin.saving")
                              : editingSkillId
                                ? t("admin.updateSkill")
                                : t("admin.createSkill")}
                          </button>
                          {editingSkillId ? (
                            <button
                              className="button button-secondary"
                              type="button"
                              onClick={() =>
                                dispatch({ type: "CANCEL_EDIT_SKILL" })
                              }
                            >
                              {t("admin.cancelEdit")}
                            </button>
                          ) : null}
                        </div>
                      </form>
                      {!isLoading && skills.length > 0 ? (
                        <div className="admin-skill-list">
                          {skills.map((skill) => (
                            <div
                              key={skill.id ?? skill.name}
                              className="admin-skill-row"
                            >
                              <span className="admin-skill-name">
                                {skill.name}
                              </span>
                              <span className="chip">{skill.category}</span>
                              {skill.id ? (
                                <div className="admin-skill-actions">
                                  <button
                                    className="button button-secondary"
                                    type="button"
                                    onClick={() =>
                                      dispatch({ type: "EDIT_SKILL", skill })
                                    }
                                  >
                                    {t("admin.edit")}
                                  </button>
                                  <button
                                    className="button button-primary"
                                    type="button"
                                    onClick={() => handleDeleteSkill(skill.id!)}
                                  >
                                    {t("admin.delete")}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* ── Projects ─────────────────────────────── */}
                  {id === "projects" && (
                    <div className="admin-form">
                      <form
                        className="admin-form"
                        ref={projectFormRef}
                        onSubmit={handleProjectSubmit}
                      >
                        <label className="field">
                          <span>{t("admin.projectTitle")}</span>
                          <input
                            type="text"
                            value={projectForm.title}
                            placeholder="Modern dashboard platform"
                            aria-invalid={!!projectFormErrors.title}
                            onChange={(e) =>
                              dispatch({
                                type: "SET_PROJECT_FORM",
                                field: "title",
                                value: e.target.value,
                              })
                            }
                          />
                          {projectFormErrors.title ? (
                            <span className="field-error">
                              {projectFormErrors.title}
                            </span>
                          ) : null}
                        </label>
                        <label className="field">
                          <span>{t("admin.projectDescription")}</span>
                          <textarea
                            rows={4}
                            value={projectForm.description}
                            placeholder="Short explanation of the project and your role."
                            aria-invalid={!!projectFormErrors.description}
                            onChange={(e) =>
                              dispatch({
                                type: "SET_PROJECT_FORM",
                                field: "description",
                                value: e.target.value,
                              })
                            }
                          />
                          {projectFormErrors.description ? (
                            <span className="field-error">
                              {projectFormErrors.description}
                            </span>
                          ) : null}
                        </label>
                        <label className="field">
                          <span>{t("admin.projectLink")}</span>
                          <input
                            type="text"
                            value={projectForm.href}
                            placeholder="https://example.com or #projects"
                            aria-invalid={!!projectFormErrors.href}
                            onChange={(e) =>
                              dispatch({
                                type: "SET_PROJECT_FORM",
                                field: "href",
                                value: e.target.value,
                              })
                            }
                          />
                          {projectFormErrors.href ? (
                            <span className="field-error">
                              {projectFormErrors.href}
                            </span>
                          ) : null}
                        </label>
                        <label className="field">
                          <span>{t("admin.projectTags")}</span>
                          <input
                            type="text"
                            value={projectForm.tags}
                            placeholder="React, Node.js, MongoDB"
                            onChange={(e) =>
                              dispatch({
                                type: "SET_PROJECT_FORM",
                                field: "tags",
                                value: e.target.value,
                              })
                            }
                          />
                        </label>
                        <label className="field">
                          <span>{t("admin.projectImage")}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              if (projectImagePreview?.objectUrl)
                                URL.revokeObjectURL(
                                  projectImagePreview.objectUrl,
                                );
                              dispatch({
                                type: "SET_PROJECT_IMAGE",
                                preview: file
                                  ? {
                                      file,
                                      objectUrl: URL.createObjectURL(file),
                                    }
                                  : null,
                              });
                            }}
                          />
                          {projectImagePreview ? (
                            <img
                              className="admin-project-image-preview"
                              src={projectImagePreview.objectUrl}
                              alt="Preview"
                            />
                          ) : null}
                        </label>
                        <label className="field field-small">
                          <span>{t("admin.projectSortOrder")}</span>
                          <input
                            type="number"
                            value={projectForm.sortOrder}
                            onChange={(e) =>
                              dispatch({
                                type: "SET_PROJECT_FORM",
                                field: "sortOrder",
                                value: e.target.value,
                              })
                            }
                          />
                        </label>
                        <div className="admin-inline-actions">
                          <button
                            className="button button-primary"
                            type="submit"
                            disabled={isSavingProject}
                          >
                            {isSavingProject
                              ? t("admin.saving")
                              : editingProjectId
                                ? t("admin.updateProject")
                                : t("admin.createProject")}
                          </button>
                          {editingProjectId ? (
                            <button
                              className="button button-secondary"
                              type="button"
                              onClick={() => dispatch({ type: "CANCEL_EDIT" })}
                            >
                              {t("admin.cancelEdit")}
                            </button>
                          ) : null}
                        </div>
                      </form>

                      <div className="accordion-projects-list">
                        <div className="section-title">
                          <p className="eyebrow">{t("admin.storedProjects")}</p>
                          <h2>{t("admin.storedProjectsTitle")}</h2>
                        </div>
                        {isLoading ? (
                          <p className="section-lead">
                            {t("admin.loadingProjects")}
                          </p>
                        ) : projects.length === 0 ? (
                          <div className="card">
                            <p className="section-lead">
                              {t("admin.noProjects")}
                            </p>
                          </div>
                        ) : (
                          <div className="projects-grid">
                            {projects.map((project) => (
                              <article
                                key={project.id ?? project.title}
                                className="project-card card admin-project-card"
                              >
                                {project.imageUrl ? (
                                  <div className="project-card-image">
                                    <img
                                      src={
                                        toAbsoluteApiUrl(project.imageUrl) ??
                                        undefined
                                      }
                                      alt={project.title}
                                      loading="lazy"
                                    />
                                  </div>
                                ) : null}
                                <div className="project-card-top">
                                  <p className="project-label">
                                    {t("admin.sortLabel", {
                                      order: project.sortOrder ?? 0,
                                    })}
                                  </p>
                                  <h3>{project.title}</h3>
                                  <p>{project.description}</p>
                                </div>
                                <ul className="chip-list">
                                  {project.tags.map((tag) => (
                                    <li key={tag} className="chip">
                                      {tag}
                                    </li>
                                  ))}
                                </ul>
                                {project.id ? (
                                  <div className="admin-project-actions">
                                    {confirmDeleteId === project.id ? (
                                      <div className="admin-confirm-delete">
                                        <p className="admin-confirm-text">
                                          {t("admin.confirmDelete")}
                                        </p>
                                        <div className="admin-inline-actions">
                                          <button
                                            className="button button-primary"
                                            type="button"
                                            onClick={() =>
                                              handleDeleteConfirmed(project.id!)
                                            }
                                          >
                                            {t("admin.confirmYes")}
                                          </button>
                                          <button
                                            className="button button-secondary"
                                            type="button"
                                            onClick={() =>
                                              dispatch({
                                                type: "CANCEL_DELETE",
                                              })
                                            }
                                          >
                                            {t("admin.confirmNo")}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <button
                                          className="button button-secondary"
                                          type="button"
                                          onClick={() =>
                                            dispatch({
                                              type: "EDIT_PROJECT",
                                              project,
                                            })
                                          }
                                        >
                                          {t("admin.edit")}
                                        </button>
                                        <button
                                          className="button button-primary"
                                          type="button"
                                          onClick={() =>
                                            dispatch({
                                              type: "CONFIRM_DELETE",
                                              projectId: project.id!,
                                            })
                                          }
                                        >
                                          {t("admin.delete")}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                ) : null}
                              </article>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default AdminPage;
