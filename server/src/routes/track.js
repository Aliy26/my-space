import express from 'express'
import { sendTelegram, parseUserAgent, getClientIp, getGeoInfo } from '../utils/telegram.js'

const router = express.Router()

// Simple in-memory dedup: prevent 50 Telegram pings if someone spams refresh.
// Key = "ip:type" → timestamp of last notification. Resets every 10 min for visits.
const recentEvents = new Map()
const VISIT_COOLDOWN_MS = 10 * 60 * 1000 // 10 minutes

function isDuplicate(ip, type) {
  if (type !== 'page_visit') return false // always notify for downloads / clicks
  const key = `${ip}:${type}`
  const last = recentEvents.get(key)
  if (last && Date.now() - last < VISIT_COOLDOWN_MS) return true
  recentEvents.set(key, Date.now())
  return false
}

const EVENT_META = {
  page_visit:       { emoji: '🌐', label: 'New Visit' },
  resume_download:  { emoji: '📥', label: 'Resume Downloaded' },
  project_click:    { emoji: '🚀', label: 'Project Opened' },
}

router.post('/', async (req, res) => {
  const { type, meta = {} } = req.body ?? {}

  if (!EVENT_META[type]) {
    return res.status(400).json({ message: 'Invalid event type.' })
  }

  // Respond immediately — don't make the browser wait for geo + Telegram
  res.json({ ok: true })

  const ip = getClientIp(req)

  if (isDuplicate(ip, type)) return

  // Run geo lookup + Telegram send in background
  const ua = req.headers['user-agent'] ?? ''
  const referer = meta.referrer || req.headers['referer'] || 'Direct'
  const { browser, os, isMobile } = parseUserAgent(ua)
  const { country, city, isp } = await getGeoInfo(ip)

  const { emoji, label } = EVENT_META[type]

  const now = new Date()
  const dateStr = now.toLocaleString('en-GB', {
    timeZone: 'Asia/Seoul',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  })

  // Build location line
  const locationParts = [city, country].filter(Boolean)
  const locationLine = locationParts.length ? locationParts.join(', ') : 'Unknown'
  const ispLine = isp ? ` • ${isp}` : ''

  // Build device line
  const deviceIcon = isMobile ? '📱' : '💻'
  const screenInfo = meta.screen ? ` • ${meta.screen}` : ''

  // Build referrer line
  const cleanRef = referer.replace(/^https?:\/\//, '').split('/')[0]
  const refLine = cleanRef && cleanRef !== 'Direct' ? `\n🔗 From: <b>${cleanRef}</b>` : ''

  // Extra info per event type
  let extraLine = ''
  if (type === 'project_click' && meta.title) {
    extraLine = `\n📁 Project: <b>${meta.title}</b>`
  }
  if (type === 'resume_download') {
    extraLine = `\n📄 File: Resume PDF`
  }

  const text =
    `${emoji} <b>${label}</b>\n` +
    `📅 ${dateStr} KST\n` +
    `🌍 ${locationLine}${ispLine}\n` +
    `${deviceIcon} ${browser} on ${os}${screenInfo}` +
    `\n🗣️ ${meta.language ?? 'Unknown'}` +
    refLine +
    extraLine

  await sendTelegram(text)
})

export default router
