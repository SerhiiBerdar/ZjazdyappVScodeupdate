import * as XLSX from 'xlsx'

function fmtDate(dt) {
  if (!dt) return ''
  const d = dt instanceof Date ? dt : new Date(dt)
  if (isNaN(d.getTime())) return String(dt)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function exportToExcel(records) {
  const data = records.map(r => ({
    'BoxResponse_ID': r.boxResponseId || '',
    'Čárový kód':    r.barcode,
    'Stanice/čidlo': r.station,
    'Čas průjezdu':  fmtDate(r.datetime),
    'Poznámka':      r.poznamka || '',
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'data zjazdov bed obmedzenia')
  XLSX.writeFile(wb, `zjazdy_export_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
