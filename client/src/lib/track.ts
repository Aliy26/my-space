const API = import.meta.env.VITE_API_BASE_URL ?? ''

// Unique ID for this page session — same across all events from this visitor.
// Lets you match "New Visit #A3F7" with "User Left #A3F7" in Telegram.
const SESSION_ID = Math.random().toString(36).slice(2, 7).toUpperCase()

export type TrackEventType =
  | 'page_visit'
  | 'page_leave'
  | 'resume_view'
  | 'resume_download'
  | 'project_click'

/**
 * Fire-and-forget event tracker.
 * Never throws — tracking must never break the UI.
 */
export function trackEvent(
  type: TrackEventType,
  meta: Record<string, string> = {},
): void {
  const payload = {
    type,
    meta: {
      sessionId: SESSION_ID,
      referrer: document.referrer || 'Direct',
      language: navigator.language,
      screen: `${screen.width}×${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...meta,
    },
  }

  fetch(`${API}/api/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {})
}

// ── Sections in order of depth ───────────────────────────────
const SECTIONS = [
  { id: 'hero',     label: 'Hero',     emoji: '🏠' },
  { id: 'about',    label: 'About',    emoji: '👤' },
  { id: 'skills',   label: 'Skills',   emoji: '🛠️' },
  { id: 'projects', label: 'Projects', emoji: '🚀' },
  { id: 'resume',   label: 'Resume',   emoji: '📄' },
  { id: 'contact',  label: 'Contact',  emoji: '📧' },
]

const SECTION_RANK: Record<string, number> = Object.fromEntries(
  SECTIONS.map((s, i) => [s.id, i]),
)

/**
 * Call once on app mount (public site only).
 * Sets up:
 *  - scroll depth tracking via IntersectionObserver
 *  - time-on-page tracking
 *  - sends page_leave via sendBeacon when tab closes
 *
 * Returns a cleanup function for useEffect.
 */
export function initPageLeaveTracking(): () => void {
  const startTime = Date.now()
  let deepestRank = 0
  let deepestSection = SECTIONS[0]

  // Watch every section — record the deepest one reached
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const rank = SECTION_RANK[entry.target.id] ?? 0
          if (rank > deepestRank) {
            deepestRank = rank
            deepestSection = SECTIONS[rank]
          }
        }
      }
    },
    { threshold: 0.25 },
  )

  for (const s of SECTIONS) {
    const el = document.getElementById(s.id)
    if (el) observer.observe(el)
  }

  // Send beacon when user leaves
  const sendLeave = () => {
    const elapsed = Date.now() - startTime

    // Ignore bounces under 4 seconds — not a real visit
    if (elapsed < 4000) return

    const mins = Math.floor(elapsed / 60000)
    const secs = Math.floor((elapsed % 60000) / 1000)
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`

    const payload = JSON.stringify({
      type: 'page_leave',
      meta: {
        sessionId: SESSION_ID,
        timeOnPage: timeStr,
        deepestSection: `${deepestSection.emoji} ${deepestSection.label}`,
        language: navigator.language,
        screen: `${screen.width}×${screen.height}`,
      },
    })

    // sendBeacon works even when the tab is closing — regular fetch does not
    navigator.sendBeacon(
      `${API}/api/track`,
      new Blob([payload], { type: 'application/json' }),
    )
  }

  // visibilitychange fires on: tab close, tab switch, minimize, phone lock
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') sendLeave()
  }

  document.addEventListener('visibilitychange', onVisibilityChange)

  return () => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    observer.disconnect()
  }
}
