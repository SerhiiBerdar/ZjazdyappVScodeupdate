import { useMemo } from 'react'
import { parsePoznamka, stanicaMatch } from '../utils/parsePoznamka'

/**
 * Finds KLT prepravky that did not reach their TargetStation.
 *
 * A KLT "didn't arrive" when its last chronological record's station
 * doesn't match the TargetStation from the last record that has a non-empty Poznámka.
 *
 * Data shape expected (from excelParser.worker.js):
 *   { barcode, station, datetime (Date), poznamka (string) }
 *
 * Returns sorted by pocetZaznamov descending (most active packages first).
 */
export function useNedorazeneKLT(data) {
  return useMemo(() => {
    if (!data?.length) return []

    // Group by barcode
    const kltMap = new Map()
    for (const row of data) {
      const bc = row.barcode
      if (!bc) continue
      if (!kltMap.has(bc)) kltMap.set(bc, [])
      kltMap.get(bc).push(row)
    }

    const result = []

    for (const [barcode, records] of kltMap) {
      // Sort chronologically
      const sorted = [...records].sort((a, b) => {
        const ta = a.datetime instanceof Date ? a.datetime.getTime() : new Date(a.datetime).getTime()
        const tb = b.datetime instanceof Date ? b.datetime.getTime() : new Date(b.datetime).getTime()
        return ta - tb
      })

      const lastRec = sorted[sorted.length - 1]
      const poslednaStanica = String(lastRec.station ?? '').trim()

      // Find last known TargetStation (scan backwards through records with non-empty Poznámka)
      let lastTarget = null
      for (let i = sorted.length - 1; i >= 0; i--) {
        const parsed = parsePoznamka(sorted[i].poznamka)
        if (parsed.targetStation) {
          lastTarget = parsed.targetStation
          break
        }
      }

      // No TargetStation found → cannot determine if arrived
      if (!lastTarget) continue

      // Already at target → skip
      if (stanicaMatch(poslednaStanica, lastTarget)) continue

      const poslednyDatumCas = lastRec.datetime instanceof Date
        ? lastRec.datetime.toISOString()
        : String(lastRec.datetime ?? '')

      result.push({
        barcode,
        targetStation: lastTarget,
        poslednaStanica,
        poslednyDatumCas,
        pocetZaznamov: sorted.length,
        trasa: sorted.map(r => String(r.station ?? '')),
      })
    }

    // Most records first (most-active / likely still in motion)
    return result.sort((a, b) => b.pocetZaznamov - a.pocetZaznamov)
  }, [data])
}
