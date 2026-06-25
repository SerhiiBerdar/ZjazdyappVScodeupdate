import * as XLSX from 'xlsx'

function findColIndex(headers, candidates) {
  for (const candidate of candidates) {
    const idx = headers.findIndex(h => h.includes(candidate))
    if (idx >= 0) return idx
  }
  return -1
}

self.onmessage = function (e) {
  const buffer = e.data

  try {
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })

    const targetSheet =
      workbook.SheetNames.find(
        name =>
          name.toLowerCase().includes('data') ||
          name.toLowerCase().includes('zjazd')
      ) || workbook.SheetNames[0]

    const worksheet = workbook.Sheets[targetSheet]

    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: true,
      cellDates: true,
    })

    if (rawData.length < 2) {
      self.postMessage({ type: 'error', message: 'Súbor neobsahuje žiadne dáta' })
      return
    }

    const headers = rawData[0].map(h => String(h || '').toLowerCase().trim())

    const colIndex = {
      boxId:     findColIndex(headers, ['boxresponse_id', 'boxresponse', 'box_response']),
      carovyKod: findColIndex(headers, ['čárový kód', 'carovy kod', 'čiarový kód', 'barcode', 'čárový', 'čiarový']),
      stanica:   findColIndex(headers, ['stanice/čidlo', 'stanica', 'stanice', 'station', 'čidlo']),
      cas:       findColIndex(headers, ['čas průjezdu', 'čas prejazdu', 'cas', 'time', 'timestamp', 'datum', 'čas']),
      poznamka:  findColIndex(headers, ['poznámka', 'poznamka', 'note', 'notes']),
    }

    // Positional fallback if header detection fails (BoxResponse_ID, Čárový kód, Stanica, Čas, Poznámka)
    if (colIndex.carovyKod < 0 && colIndex.stanica < 0) {
      colIndex.boxId = 0
      colIndex.carovyKod = 1
      colIndex.stanica = 2
      colIndex.cas = 3
      colIndex.poznamka = 4
    }

    const records = []
    const errors = []
    let skippedRows = 0
    const dataRows = rawData.slice(1)
    const totalRows = dataRows.length

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]

      // Skip empty rows
      if (!row || row.every(cell => cell === null || cell === undefined || cell === '')) {
        skippedRows++
        continue
      }

      const rawKod = colIndex.carovyKod >= 0 ? row[colIndex.carovyKod] : null
      const rawSt  = colIndex.stanica >= 0 ? row[colIndex.stanica] : null
      const rawCas = colIndex.cas >= 0 ? row[colIndex.cas] : null

      const carovyKod = String(rawKod ?? '').trim()
      const stanica   = String(rawSt ?? '').trim()

      if (!carovyKod || !stanica || rawCas === null || rawCas === undefined || rawCas === '') {
        skippedRows++
        if (errors.length < 10) {
          errors.push(`Riadok ${i + 2}: Chýbajú povinné polia (Čárový kód, Stanica, Čas)`)
        }
        continue
      }

      let dt
      if (rawCas instanceof Date) {
        dt = rawCas
      } else {
        dt = new Date(String(rawCas))
      }

      if (isNaN(dt.getTime())) {
        skippedRows++
        if (errors.length < 10) {
          errors.push(`Riadok ${i + 2}: Neplatný formát dátumu: ${rawCas}`)
        }
        continue
      }

      const boxId    = colIndex.boxId >= 0 ? row[colIndex.boxId] : null
      const poznamka = colIndex.poznamka >= 0 ? String(row[colIndex.poznamka] ?? '').trim() : ''

      records.push({
        barcode:      carovyKod,
        station:      stanica.toUpperCase(),
        datetimeISO:  dt.toISOString(),
        hour:         dt.getHours(),
        minute:       dt.getMinutes(),
        boxResponseId: boxId !== null && boxId !== undefined ? String(boxId) : null,
        poznamka,
      })

      if (i > 0 && i % 10000 === 0) {
        self.postMessage({ type: 'progress', processed: i, total: totalRows })
      }
    }

    self.postMessage({
      type: 'done',
      records,
      errors,
      totalRows,
      successRows: records.length,
      skippedRows,
    })
  } catch (err) {
    self.postMessage({ type: 'error', message: String(err.message || err) })
  }
}
