/**
 * Parses the "Poznámka" column from the Excel export.
 * Format: "TargetStation: DS02S04 | LastLocation: DS01S03 | NextLocation:DS02S04"
 * Any of the three parts may be absent; ~14% of rows have an empty Poznámka.
 */
export function parsePoznamka(poznamka) {
  const result = { targetStation: null, lastLocation: null, nextLocation: null }

  if (!poznamka || typeof poznamka !== 'string') return result

  const parts = poznamka.split('|')
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.startsWith('TargetStation:')) {
      const val = trimmed.replace('TargetStation:', '').trim()
      result.targetStation = val || null
    } else if (trimmed.startsWith('LastLocation:')) {
      const val = trimmed.replace('LastLocation:', '').trim()
      result.lastLocation = val || null
    } else if (trimmed.startsWith('NextLocation:')) {
      const val = trimmed.replace('NextLocation:', '').trim()
      result.nextLocation = val || null
    }
  }

  return result
}

/**
 * Case-insensitive station comparison.
 * Real data has "L30A" vs "L30a" which are the same station.
 */
export function stanicaMatch(a, b) {
  if (!a || !b) return false
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}
