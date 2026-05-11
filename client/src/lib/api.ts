import type { Project } from '../types/project.types.ts'
import type { ProfileImageSummary } from '../types/profile-image.types.ts'
import type { ResumeSummary } from '../types/resume.types.ts'
import type { Skill } from '../types/skill.types.ts'

type ProjectPayload = {
  title: string
  description: string
  href: string
  tags: string[]
  sortOrder: number
  imageFile?: File | null
}

export type ContactSettings = {
  email: string
  github: string
}

export type HeroStats = {
  years: string
  builds: string
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

function getApiUrl(path: string) {
  return `${apiBaseUrl}${path}`
}

async function parseError(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string }
    return payload.message || `Request failed with status ${response.status}.`
  } catch {
    return `Request failed with status ${response.status}.`
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(getApiUrl(path), {
    credentials: 'include',
    ...init,
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return (await response.json()) as T
}

export async function checkAuth(): Promise<string | null> {
  try {
    const data = await requestJson<{ username: string }>('/api/auth/me')
    return data.username
  } catch {
    return null
  }
}

export async function login(username: string, password: string): Promise<string> {
  const data = await requestJson<{ username: string }>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return data.username
}

export async function logout(): Promise<void> {
  await fetch(getApiUrl('/api/auth/logout'), {
    method: 'POST',
    credentials: 'include',
  })
}

export async function fetchDefaultLanguage(): Promise<string> {
  const data = await requestJson<{ language: string }>('/api/settings/language')
  return data.language
}

export async function updateDefaultLanguage(language: string): Promise<string> {
  const data = await requestJson<{ language: string }>('/api/settings/language', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language }),
  })
  return data.language
}

export async function fetchProjects() {
  return requestJson<Project[]>('/api/projects')
}

export async function fetchResume() {
  const response = await fetch(getApiUrl('/api/resume'), { credentials: 'include' })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return (await response.json()) as ResumeSummary
}

export async function fetchProfileImage() {
  const response = await fetch(getApiUrl('/api/profile-image'), { credentials: 'include' })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return (await response.json()) as ProfileImageSummary
}

export async function createProject(payload: ProjectPayload) {
  const formData = new FormData()
  formData.append('title', payload.title)
  formData.append('description', payload.description)
  formData.append('href', payload.href)
  formData.append('tags', payload.tags.join(','))
  formData.append('sortOrder', String(payload.sortOrder))
  if (payload.imageFile) formData.append('projectImage', payload.imageFile)

  return requestJson<Project>('/api/admin/projects', { method: 'POST', body: formData })
}

export async function updateProject(projectId: string, payload: ProjectPayload) {
  const formData = new FormData()
  formData.append('title', payload.title)
  formData.append('description', payload.description)
  formData.append('href', payload.href)
  formData.append('tags', payload.tags.join(','))
  formData.append('sortOrder', String(payload.sortOrder))
  if (payload.imageFile) formData.append('projectImage', payload.imageFile)

  return requestJson<Project>(`/api/admin/projects/${projectId}`, { method: 'PUT', body: formData })
}

export async function deleteProject(projectId: string) {
  const response = await fetch(getApiUrl(`/api/admin/projects/${projectId}`), {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }
}

export async function uploadResume(file: File) {
  const formData = new FormData()
  formData.append('resume', file)

  return requestJson<ResumeSummary>('/api/admin/resume', {
    method: 'POST',
    body: formData,
  })
}

export async function uploadProfileImage(file: File) {
  const formData = new FormData()
  formData.append('profileImage', file)

  return requestJson<ProfileImageSummary>('/api/admin/profile-image', {
    method: 'POST',
    body: formData,
  })
}

export function toAbsoluteApiUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (/^https?:\/\//.test(path) || !path.startsWith('/')) {
    return path
  }

  return apiBaseUrl ? `${apiBaseUrl}${path}` : path
}

export async function fetchContactSettings(): Promise<ContactSettings> {
  return requestJson<ContactSettings>('/api/settings/contact')
}

export async function updateContactSettings(payload: ContactSettings): Promise<ContactSettings> {
  return requestJson<ContactSettings>('/api/settings/contact', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function fetchHeroStats(): Promise<HeroStats> {
  return requestJson<HeroStats>('/api/settings/hero-stats')
}

export async function updateHeroStats(payload: HeroStats): Promise<HeroStats> {
  return requestJson<HeroStats>('/api/settings/hero-stats', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function fetchSkills(): Promise<Skill[]> {
  return requestJson<Skill[]>('/api/skills')
}

export async function createSkill(payload: Omit<Skill, 'id'>): Promise<Skill> {
  return requestJson<Skill>('/api/admin/skills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function updateSkill(skillId: string, payload: Omit<Skill, 'id'>): Promise<Skill> {
  return requestJson<Skill>(`/api/admin/skills/${skillId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function deleteSkill(skillId: string): Promise<void> {
  const response = await fetch(getApiUrl(`/api/admin/skills/${skillId}`), {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }
}
