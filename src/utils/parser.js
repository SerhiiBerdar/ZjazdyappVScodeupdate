export function parseData(raw) {
  const lines = raw.trim().split('\n').map(l => l.trim()).filter(Boolean)
  const records = []
  let skipped = 0
  for (const line of lines) {
    const cols = line.split('\t')
    if (cols.length < 3) { skipped++; continue }
    const barcode = cols[0].trim()
    const station = cols[1].trim().toUpperCase()
    const dt = parseDateTime(cols.slice(2).join(' '))
    if (!barcode || !station || !dt || isNaN(dt)) { skipped++; continue }
    records.push({ barcode, station, datetime: dt, hour: dt.getHours(), minute: dt.getMinutes() })
  }
  return { records, skipped }
}

function parseDateTime(s) {
  s = s.trim()
  if (!s) return null
  let m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (m) return new Date(+m[3], +m[2]-1, +m[1], +m[4], +m[5], +(m[6]||0))
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (m) return new Date(+m[3], +m[1]-1, +m[2], +m[4], +m[5], +(m[6]||0))
  const d = new Date(s)
  if (!isNaN(d)) return d
  return null
}

export function buildStationStats(data) {
  const map = {}
  data.forEach(d => {
    const k = d.station
    if (!map[k]) map[k] = { station: k, count: 0, orders: new Set(), times: [], hourBuckets: {} }
    map[k].count++
    map[k].orders.add(d.barcode)
    map[k].times.push(d.datetime)
    map[k].hourBuckets[d.hour] = (map[k].hourBuckets[d.hour] || 0) + 1
  })
  return Object.values(map).map(s => {
    const peak = Object.entries(s.hourBuckets).sort((a,b) => b[1]-a[1])[0]
    return {
      station: s.station, count: s.count, unique: s.orders.size,
      peak: parseInt(peak[0]), peakCount: parseInt(peak[1]),
      first: new Date(Math.min(...s.times)),
      last: new Date(Math.max(...s.times)),
      hourBuckets: s.hourBuckets,
    }
  })
}

export function buildFlowPairs(data) {
  const pairs = {}
  const kltStations = {}
  const byBarcode = {}
  data.forEach(d => {
    if (!byBarcode[d.barcode]) byBarcode[d.barcode] = []
    byBarcode[d.barcode].push(d)
    if (!kltStations[d.barcode]) kltStations[d.barcode] = new Set()
    kltStations[d.barcode].add(d.station)
  })
  Object.values(byBarcode).forEach(rows => {
    rows.sort((a,b) => a.datetime - b.datetime)
    for (let i = 0; i < rows.length-1; i++) {
      const from = rows[i].station, to = rows[i+1].station
      if (from === to) continue
      const key = `${from}|||${to}`
      if (!pairs[key]) pairs[key] = { count: 0, barcodes: new Set() }
      pairs[key].count++
      pairs[key].barcodes.add(rows[i].barcode)
    }
  })
  return { pairs, kltStations }
}

export function getSlots(data, resMin, filterStation) {
  const fs = filterStation ? filterStation.toUpperCase() : null
  const src = fs ? data.filter(d => d.station.toUpperCase() === fs) : data
  const buckets = {}
  src.forEach(d => {
    const sm = Math.floor((d.hour * 60 + d.minute) / resMin) * resMin
    buckets[sm] = (buckets[sm] || 0) + 1
  })
  const nums = Object.keys(buckets).map(Number).sort((a,b) => a-b)
  if (!nums.length) return []
  let splitAfter = -1, maxGap = 0
  for (let i = 0; i < nums.length-1; i++) {
    const g = nums[i+1] - nums[i]
    if (g > maxGap) { maxGap = g; splitAfter = i }
  }
  const ordered = (maxGap > resMin*3 && splitAfter >= 0)
    ? [...nums.slice(splitAfter+1), ...nums.slice(0, splitAfter+1)]
    : nums
  return ordered.map(sm => {
    const h = Math.floor(sm/60) % 24, m = sm % 60
    return [String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'), buckets[sm]]
  })
}
export function chronoHours(data) {
  const used = [...new Set(data.map(d => d.hour))].sort((a,b) => a-b)
  if (!used.length) return []
  let maxGap = 0, splitAt = used[0]
  for (let i = 0; i < used.length-1; i++) {
    const g = used[i+1] - used[i]
    if (g > maxGap) { maxGap = g; splitAt = used[i+1] }
  }
  if (maxGap > 3) return [...used.filter(h => h >= splitAt), ...used.filter(h => h < splitAt)]
  return used
}
