import React, { useState, useCallback } from 'react'
import StatCard from './StatCard'
import TimelineChart from './TimelineChart'
import TopStationsChart from './TopStationsChart'
import StationDetailChart from './StationDetailChart'
import HeatmapSvg from './HeatmapSvg'
import FlowChart from './FlowChart'
import KltTrace from './KltTrace'
import StationsTable from './StationsTable'
import FilterBar from './FilterBar'
import ManualEntryForm from './ManualEntryForm'
import ExcelImport from './ExcelImport'
import { chronoHours } from '../utils/parser'
import { exportToExcel } from '../utils/excelExport'

export default function Dashboard({ allData, stStats, flowData, parseStatus, onParse, onClear, onAddRecord, onImportRecords }) {
  const [inputTab, setInputTab]     = useState('paste') // 'paste' | 'manual' | 'xlsx'
  const [pasteText, setPasteText]   = useState('')
  const [filters, setFilters]       = useState({ barcode:'', station:'', hour:'' })
  const [timelineRes, setTimelineRes]               = useState(15)
  const [timelineDuplicates, setTimelineDuplicates] = useState(false)
  const [stationMode, setStationMode] = useState('hour')
  const [selectedStation, setSelectedStation] = useState('')
  const [heatN, setHeatN]           = useState(25)
  const [kltSearch, setKltSearch]   = useState('')

  const filtered = allData.filter(d => {
    if (filters.barcode && !d.barcode.includes(filters.barcode)) return false
    if (filters.station && d.station !== filters.station) return false
    if (filters.hour !== '' && d.hour !== parseInt(filters.hour)) return false
    return true
  })

  const filteredStats = stStats.filter(s => {
    if (filters.station && s.station !== filters.station) return false
    if (filters.barcode) {
      const bc = filters.barcode
      return allData.some(d => d.barcode.includes(bc) && d.station === s.station)
    }
    return true
  })

  const total     = filtered.length
  const uniqueKlt = new Set(filtered.map(d => d.barcode)).size
  const uniqueSt  = new Set(filtered.map(d => d.station)).size
  const hb = {}; filtered.forEach(d => { hb[d.hour] = (hb[d.hour] || 0) + 1 })
  const peak = Object.entries(hb).sort((a, b) => b[1] - a[1])[0]

  const allStations = [...new Set(allData.map(d => d.station))].sort()
  const allHours    = chronoHours(allData)

  const handleParse = () => onParse(pasteText)
  const handleClear = () => { onClear(); setPasteText(''); setFilters({ barcode:'', station:'', hour:'' }) }

  const INPUT_TABS = [
    { id: 'paste',  label: '📋 Vložiť text' },
    { id: 'manual', label: '✏️ Zadať ručne' },
    { id: 'xlsx',   label: '📂 Import .xlsx' },
  ]

  return (
    <main style={{ padding: 20, maxWidth: 1500, margin: '0 auto' }}>

      {/* ── Data input ── */}
      <div className="card fade-in-up" style={{ padding: 22, marginBottom: 20 }}>

        {/* Header row with status dot, title, and tab switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
            background: allData.length > 0 ? 'var(--accent)' : 'var(--text3)',
            boxShadow: allData.length > 0 ? '0 0 8px var(--accent-glow)' : 'none',
            display: 'inline-block',
          }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.12em' }}>
            Načítať dáta
          </span>

          {/* Tab switcher */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {INPUT_TABS.map(t => (
              <button
                key={t.id}
                className={`pill ${inputTab === t.id ? 'active' : ''}`}
                onClick={() => setInputTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab: Paste text ── */}
        {inputTab === 'paste' && (
          <>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12, lineHeight: 1.7 }}>
              Označte v Exceli riadky (3 stĺpce:{' '}
              <code style={{ background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '1px 6px', borderRadius: 4, color: 'var(--accent)', fontSize: 10 }}>Čiarový kód</code>
              {' · '}
              <code style={{ background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '1px 6px', borderRadius: 4, color: 'var(--accent)', fontSize: 10 }}>Stanica</code>
              {' · '}
              <code style={{ background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', padding: '1px 6px', borderRadius: 4, color: 'var(--accent)', fontSize: 10 }}>Dátum/čas</code>
              ), skopírujte <kbd style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', padding: '1px 5px', borderRadius: 4, fontSize: 10 }}>Ctrl+C</kbd> a vložte <kbd style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', padding: '1px 5px', borderRadius: 4, fontSize: 10 }}>Ctrl+V</kbd>.
            </div>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              style={{ width: '100%', minHeight: 90, resize: 'vertical', fontFamily: 'Consolas,Monaco,monospace', fontSize: 12 }}
              placeholder={"80145688\tL47\t23.06.2026 06:00:57\n80145688\tSO01\t23.06.2026 05:54:55\n..."}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
              <button className="btn" onClick={handleParse}>▶ Analyzovať</button>
              <button className="btn-ghost" onClick={handleClear}>✕ Vymazať</button>
              {parseStatus.msg && (
                <span style={{
                  fontSize: 12, fontWeight: 500,
                  color: parseStatus.ok ? 'var(--accent)' : 'var(--accent3)',
                  textShadow: parseStatus.ok ? '0 0 12px rgba(200,255,0,0.3)' : 'none',
                }}>
                  {parseStatus.msg}
                </span>
              )}
            </div>
          </>
        )}

        {/* ── Tab: Manual entry ── */}
        {inputTab === 'manual' && (
          <>
            <ManualEntryForm onAdd={record => onAddRecord(record)} />
            {parseStatus.msg && (
              <div style={{ marginTop: 10, fontSize: 12, fontWeight: 500, color: parseStatus.ok ? 'var(--accent)' : 'var(--accent3)' }}>
                {parseStatus.msg}
              </div>
            )}
            {allData.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                  Celkovo v pamäti: <strong style={{ color: 'var(--accent)' }}>{allData.length.toLocaleString('sk')}</strong> záznamov
                </span>
                <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={handleClear}>✕ Vymazať všetky</button>
              </div>
            )}
          </>
        )}

        {/* ── Tab: Excel file import ── */}
        {inputTab === 'xlsx' && (
          <>
            <ExcelImport onImport={onImportRecords} existingCount={allData.length} />
            {parseStatus.msg && allData.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 12, fontWeight: 500, color: parseStatus.ok ? 'var(--accent)' : 'var(--accent3)' }}>
                {parseStatus.msg}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Data views ── */}
      {allData.length > 0 && (
        <>
          {/* Section label + Export button */}
          <div className="fade-in-up delay-1" style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28, fontWeight: 800,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: 'var(--text)',
            }}>
              Live Analytics
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700,
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              border: '1px solid rgba(200,255,0,0.3)',
              padding: '3px 10px', borderRadius: 20,
              letterSpacing: '.1em', textTransform: 'uppercase',
              boxShadow: '0 0 10px rgba(200,255,0,0.2)',
            }}>
              Live
            </div>
            <button
              className="btn-ghost"
              style={{ marginLeft: 'auto', fontSize: 12 }}
              onClick={() => exportToExcel(allData)}
              title="Exportovať všetky záznamy do Excel súboru"
            >
              ⬇ Export Excel
            </button>
          </div>

          {/* Filters */}
          <div className="fade-in-up delay-1">
            <FilterBar
              filters={filters} onChange={setFilters}
              stations={allStations} hours={allHours}
              total={total} allTotal={allData.length}
            />
          </div>

          {/* Stat cards */}
          <div className="fade-in-up delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
            <StatCard label="Zobrazené záznamy" value={total.toLocaleString('sk')}
              sub={total < allData.length ? `z celkových ${allData.length.toLocaleString('sk')}` : 'priechodov celkovo'} accent={0} />
            <StatCard label="KLT prepravky"   value={uniqueKlt.toLocaleString('sk')} sub="unikátnych KLT" accent={1} />
            <StatCard label="Aktívne stanice" value={uniqueSt} sub="unikátnych staníc" accent={2} />
            <StatCard label="Vrcholová hodina" value={peak ? `${peak[0]}:00` : '—'}
              sub={peak ? `${peak[1].toLocaleString('sk')} priechodov` : ''} accent={3} />
          </div>

          {/* Timeline + Top stations */}
          <div className="fade-in-up delay-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div className="card" style={{ padding: 20, gridColumn: '1/-1' }}>
              <TimelineChart
                data={filtered} resolution={timelineRes} onResChange={setTimelineRes}
                showDuplicates={timelineDuplicates} onToggleDuplicates={setTimelineDuplicates}
              />
            </div>
            <div className="card" style={{ padding: 20 }}>
              <TopStationsChart stStats={filteredStats} onSelect={st => { setSelectedStation(st); setFilters(f => ({ ...f, station: st })) }} />
            </div>
            <div className="card" style={{ padding: 20 }}>
              <StationDetailChart allData={filtered} stStats={filteredStats} selected={selectedStation}
                onSelect={setSelectedStation} mode={stationMode} onModeChange={setStationMode} />
            </div>
          </div>

          <div className="card fade-in-up delay-4" style={{ padding: 20, marginBottom: 20 }}>
            <HeatmapSvg stStats={filteredStats} allData={filtered} topN={heatN} onTopNChange={setHeatN} />
          </div>

          <div className="card fade-in-up delay-4" style={{ padding: 20, marginBottom: 20 }}>
            <FlowChart flowData={flowData} stations={allStations} />
          </div>

          <div className="card fade-in-up delay-5" style={{ padding: 20, marginBottom: 20 }}>
            <KltTrace allData={allData} search={kltSearch} onSearchChange={setKltSearch} />
          </div>

          <div className="card fade-in-up delay-5" style={{ overflow: 'hidden', marginBottom: 20 }}>
            <StationsTable stStats={filteredStats} total={total}
              onFilterStation={st => setFilters(f => ({ ...f, station: st }))} />
          </div>
        </>
      )}

      {/* ── Empty state ── */}
      {!allData.length && (
        <div className="fade-in-up delay-1" style={{ textAlign: 'center', padding: '80px 20px 60px' }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,255,0,0.18) 0%, transparent 70%)',
            border: '1px solid rgba(200,255,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 42, margin: '0 auto 28px',
            boxShadow: '0 0 40px rgba(200,255,0,0.12)',
          }}>📂</div>

          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 42, fontWeight: 800,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'var(--text)', marginBottom: 8, lineHeight: 1.1,
          }}>
            Žiadne dáta
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20, fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--accent)', marginBottom: 24,
            textShadow: '0 0 20px rgba(200,255,0,0.4)',
          }}>
            Pripravený na analýzu
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 2, maxWidth: 480, margin: '0 auto' }}>
            Vyberte spôsob zadania dát vyššie:{' '}
            <span style={{ color: 'var(--text)' }}>📋 vložte skopírovaný text</span>,{' '}
            <span style={{ color: 'var(--text)' }}>✏️ zadajte záznamy ručne</span>, alebo{' '}
            <span style={{ color: 'var(--text)' }}>📂 nahrajte Excel súbor (.xlsx)</span>.
            <br /><br />
            <span style={{ color: 'var(--text3)', fontSize: 12 }}>Každý záznam = jedna KLT prepravka na stanici v konkrétnom čase.</span>
          </div>
        </div>
      )}
    </main>
  )
}
