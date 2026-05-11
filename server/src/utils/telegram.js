import { logger } from '../index.js'

const TELEGRAM_API = 'https://api.telegram.org'

/**
 * Send a message to your Telegram bot chat.
 * Fails silently — tracking must never crash the server.
 */
export async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) return

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      logger.warn({ err }, 'Telegram API returned non-OK response')
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to send Telegram notification')
  }
}

/**
 * Parse user-agent string into readable browser / OS info.
 */
export function parseUserAgent(ua = '') {
  // Browser
  let browser = 'Unknown Browser'
  if (/Edg\//.test(ua))          browser = `Edge ${ua.match(/Edg\/([\d]+)/)?.[1] ?? ''}`
  else if (/OPR\//.test(ua))     browser = `Opera ${ua.match(/OPR\/([\d]+)/)?.[1] ?? ''}`
  else if (/Chrome\//.test(ua))  browser = `Chrome ${ua.match(/Chrome\/([\d]+)/)?.[1] ?? ''}`
  else if (/Firefox\//.test(ua)) browser = `Firefox ${ua.match(/Firefox\/([\d]+)/)?.[1] ?? ''}`
  else if (/Safari\//.test(ua))  browser = `Safari`

  // OS
  let os = 'Unknown OS'
  if (/iPhone/.test(ua))      os = 'iPhone'
  else if (/iPad/.test(ua))   os = 'iPad'
  else if (/Android/.test(ua)) os = 'Android'
  else if (/Windows/.test(ua)) os = 'Windows'
  else if (/Mac OS X/.test(ua)) os = 'macOS'
  else if (/Linux/.test(ua))   os = 'Linux'

  const isMobile = /Mobile|Android|iPhone|iPad/.test(ua)

  return { browser: browser.trim(), os, isMobile }
}

/**
 * Get the real client IP — works behind Nginx / Render / Cloudflare proxies.
 */
export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.socket?.remoteAddress ?? 'unknown'
}

/**
 * Fetch city + country + ISP from ip-api.com (free, no key needed).
 * Returns a fallback object on any error.
 */
export async function getGeoInfo(ip) {
  // Skip lookup for local dev IPs
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
    return { country: '🖥️ Local dev', city: '', isp: '' }
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,city,isp`,
      { signal: AbortSignal.timeout(3000) }, // 3s timeout
    )
    const data = await res.json()
    if (data.status === 'success') {
      return { country: data.country ?? '', city: data.city ?? '', isp: data.isp ?? '' }
    }
  } catch {
    // geo lookup failed — not critical
  }

  return { country: 'Unknown', city: '', isp: '' }
}
