const STORAGE_KEY = 'zjazdy_usage_log'

export function logEvent(type, detail = {}) {
  const events = readEvents()
  events.push({ type, ts: new Date().toISOString(), ...detail })
  if (events.length > 2000) events.splice(0, events.length - 2000)
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)) } catch {}
}

export function readEvents() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

export function clearAllEvents() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}
