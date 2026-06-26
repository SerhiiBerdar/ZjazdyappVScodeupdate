import { useMemo } from 'react'

/**
 * Finds barcodes (KLT) that visited the same station at least `minVisits` times.
 * Returns sorted by max repeat count descending.
 *
 * Data shape: { barcode, station, datetime (Date), hour, minute }
 */
export function useOtoceneBaliky(data, minVisits = 2) {
  return useMemo(() => {
    if (!data?.length) return []

    // Group records by barcode
    const byBarcode = {}
    for (const row of data) {
      const bc = row.barcode
      if (!bc) continue
      if (!byBarcode[bc]) byBarcode[bc] = []
      byBarcode[bc].push(row)
    }

    const result = []

    for (const [barcode, rows] of Object.entries(byBarcode)) {
      // Sort chronologically
      const sorted = [...rows].sort((a, b) => a.datetime - b.datetime)

      // Count visits per station
      const stationCounts = {}
      for (const r of sorted) {
        const st = r.station
        if (st) stationCounts[st] = (stationCounts[st] ?? 0) + 1
      }

      // Keep stations with >= minVisits
      const repeated = Object.entries(stationCounts)
        .filter(([, count]) => count >= minVisits)
        .map(([station, visitCount]) => {
          const times = sorted
            .filter(r => r.station === station)
            .map(r => r.datetime)
          const first = times[0]
          const last  = times[times.length - 1]
          const timeRange = first && last && first !== last
            ? `${fmtDT(first)} – ${fmtDT(last)}`
            : fmtDT(first)
          return { station, visitCount, timeRange, times }
        })

      if (repeated.length === 0) continue

      result.push({
        barcode,
        visits: sorted.map(r => ({
          station: r.station,
          datetime: r.datetime,
        })),
        repeatedStations: repeated,
        fullRoute: sorted.map(r => r.station),
      })
    }

    // Sort by highest single-station repeat count descending
    return result.sort((a, b) => {
      const maxA = Math.max(...a.repeatedStations.map(x => x.visitCount))
      const maxB = Math.max(...b.repeatedStations.map(x => x.visitCount))
      return maxB - maxA
    })
  }, [data, minVisits])
}

function fmtDT(dt) {
  if (!dt) return ''
  return dt.toLocaleString('sk', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}
