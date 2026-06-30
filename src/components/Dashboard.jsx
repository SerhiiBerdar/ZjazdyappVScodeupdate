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
import CidloDetailPanel from './CidloDetailPanel'
import SlotDrillPanel from './SlotDrillPanel'
import { chronoHours } from '../utils/parser'
import { exportToExcel } from '../utils/excelExport'

export default function Dashboard({ allData, stStats, flowData, parseStatus, onParse, onClear, onAddRecord, onImportRecords }) {
  const [inputTab, setInputTab]     = useState('paste')
  const [pasteText, setPasteText]   = useState('')
  const [filters, setFilters]       = useState({ barcode:'', station:'', hour:'' })
  const [timelineRes, setTimelineRes]               = useState(15)
  const [timelineDuplicates, setTimelineDuplicates] = useState(false)
  const [stationMode, setStationMode] = useState('hour')
  const [selectedStation, setSelectedStation] = useState('')
  const [heatN, setHeatN]           = useState(25)
  const [kltSearch, setKltSearch]   = useState('')
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [drillSlot, setDrillSlot]   = useState(null) // { label, resMin, records }

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

  const handleSlotClick = useCallback((slotMin, label, resMin) => {
    const records = filtered.filter(d => {
      const dm = Math.floor((d.hour * 60 + d.minute) / resMin) * resMin
      return dm === slotMin
    })
    setDrillSlot({ label, resMin, records })
  }, [filtered])

  const INPUT_TABS = [
    { id: 'paste',  label: 'Vložiť text' },
    { id: 'manual', label: 'Zadať ručne' },
    { id: 'xlsx',   label: 'Import .xlsx' },
  ]

  return (
    <main style={{ padding: '20px 24px', maxWidth: 1440, margin: '0 auto' }}>

      {/* ── Data input ── */}
      <div className="card fade-in-up" style={{ padding: '20px 22px', marginBottom: 16 }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: allData.length > 0 ? 'var(--success)' : 'var(--text-tertiary)',
              boxShadow: allData.length > 0 ? '0 0 6px rgba(48,209,88,0.5)' : 'none',
            }} />
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.8px',
            }}>
              Načítať dáta
            </span>
          </div>

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
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.7 }}>
              Označte v Exceli riadky (3 stĺpce:{' '}
              <code style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border)',
                padding: '1px 6px', borderRadius: 4,
                color: 'var(--text-primary)', fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}>Čiarový kód</code>
              {' · '}
              <code style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border)',
                padding: '1px 6px', borderRadius: 4,
                color: 'var(--text-primary)', fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}>Stanica</code>
              {' · '}
              <code style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border)',
                padding: '1px 6px', borderRadius: 4,
                color: 'var(--text-primary)', fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}>Dátum/čas</code>
              ), skopírujte{' '}
              <kbd style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-strong)',
                padding: '1px 6px', borderRadius: 4, fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}>Ctrl+C</kbd>
              {' '}a vložte{' '}
              <kbd style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-strong)',
                padding: '1px 6px', borderRadius: 4, fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}>Ctrl+V</kbd>.
            </div>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              style={{
                width: '100%', minHeight: 88, resize: 'vertical',
                fontFamily: 'var(--font-mono)', fontSize: 13,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                padding: '10px 14px',
                outline: 'none',
              }}
              placeholder={"80145688\tL47\t23.06.2026 06:00:57\n80145688\tSO01\t23.06.2026 05:54:55\n..."}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
              <button className="btn" onClick={handleParse}>Analyzovať</button>
              <button className="btn-ghost" onClick={handleClear}>Vymazať</button>
              {parseStatus.msg && (
                <span style={{
                  fontSize: 13, fontWeight: 500,
                  color: parseStatus.ok ? 'var(--success)' : 'var(--danger)',
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
              <div style={{
                marginTop: 10, fontSize: 13, fontWeight: 500,
                color: parseStatus.ok ? 'var(--success)' : 'var(--danger)',
              }}>
                {parseStatus.msg}
              </div>
            )}
            {allData.length > 0 && (
              <div style={{
                marginTop: 14, paddingTop: 14,
                borderTop: '1px solid var(--border)',
                display: 'flex', gap: 10, alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  V pamäti:{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {allData.length.toLocaleString('sk')}
                  </strong>{' '}
                  záznamov
                </span>
                <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={handleClear}>
                  Vymazať všetky
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Tab: Excel file import ── */}
        {inputTab === 'xlsx' && (
          <>
            <ExcelImport onImport={onImportRecords} existingCount={allData.length} />
            {parseStatus.msg && allData.length > 0 && (
              <div style={{
                marginTop: 12, fontSize: 13, fontWeight: 500,
                color: parseStatus.ok ? 'var(--success)' : 'var(--danger)',
              }}>
                {parseStatus.msg}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Data views ── */}
      {allData.length > 0 && (
        <>
          {/* Section label */}
          <div className="fade-in-up delay-1" style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22, fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px',
              margin: 0,
            }}>
              Analytika
            </h2>
            <div style={{
              background: 'rgba(48,209,88,0.12)',
              color: 'var(--success)',
              border: '1px solid rgba(48,209,88,0.25)',
              fontSize: 11, fontWeight: 600,
              padding: '3px 10px', borderRadius: 20,
              letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>
              Live
            </div>
            <button
              className="btn-ghost"
              style={{ marginLeft: 'auto', fontSize: 13 }}
              onClick={() => exportToExcel(allData)}
              title="Exportovať všetky záznamy do Excel súboru"
            >
              Export Excel
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
          <div className="fade-in-up delay-2" style={{
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
            gap: 12, marginBottom: 16,
          }}>
            <StatCard
              label="Zobrazené záznamy" value={total.toLocaleString('sk')}
              sub={total < allData.length ? `z celkových ${allData.length.toLocaleString('sk')}` : 'priechodov celkovo'}
              accent={0}
            />
            <StatCard label="KLT prepravky"   value={uniqueKlt.toLocaleString('sk')} sub="unikátnych KLT"     accent={1} />
            <StatCard label="Aktívne stanice" value={uniqueSt}                        sub="unikátnych staníc"  accent={2} />
            <StatCard
              label="Vrcholová hodina" value={peak ? `${peak[0]}:00` : '—'}
              sub={peak ? `${peak[1].toLocaleString('sk')} priechodov` : ''}
              accent={3}
            />
          </div>

          {/* Timeline */}
          <div className="card fade-in-up delay-3" style={{ padding: 20, marginBottom: 12 }}>
            <TimelineChart
              data={filtered} resolution={timelineRes} onResChange={setTimelineRes}
              showDuplicates={timelineDuplicates} onToggleDuplicates={setTimelineDuplicates}
              onSlotClick={handleSlotClick}
            />
          </div>

          {/* Top stations + Detail */}
          <div className="fade-in-up delay-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="card" style={{ padding: 20 }}>
              <TopStationsChart stStats={filteredStats} onSelect={st => { setSelectedStation(st); setFilters(f => ({ ...f, station: st })); setIsDetailOpen(true) }} />
            </div>
            <div className="card" style={{ padding: 20 }}>
              <StationDetailChart allData={filtered} stStats={filteredStats} selected={selectedStation}
                onSelect={setSelectedStation} mode={stationMode} onModeChange={setStationMode} />
            </div>
          </div>

          <div className="card fade-in-up delay-4" style={{ padding: 20, marginBottom: 12 }}>
            <HeatmapSvg stStats={filteredStats} allData={filtered} topN={heatN} onTopNChange={setHeatN} />
          </div>

          <div className="card fade-in-up delay-4" style={{ padding: 20, marginBottom: 12 }}>
            <FlowChart flowData={flowData} stations={allStations} />
          </div>

          <div id="klt-trace-section" className="card fade-in-up delay-5" style={{ padding: 20, marginBottom: 12 }}>
            <KltTrace allData={allData} search={kltSearch} onSearchChange={setKltSearch} />
          </div>

          <div className="card fade-in-up delay-5" style={{ overflow: 'hidden', marginBottom: 20 }}>
            <StationsTable stStats={filteredStats} total={total}
              onFilterStation={st => setFilters(f => ({ ...f, station: st }))} />
          </div>
        </>
      )}

      <CidloDetailPanel
        station={selectedStation}
        allData={allData}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      {drillSlot && (
        <SlotDrillPanel
          slotLabel={drillSlot.label}
          resMin={drillSlot.resMin}
          records={drillSlot.records}
          onClose={() => setDrillSlot(null)}
          onSelectBarcode={bc => {
            setKltSearch(bc)
            setDrillSlot(null)
            setTimeout(() => {
              document.getElementById('klt-trace-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 80)
          }}
        />
      )}

      {/* ── Empty state ── */}
      {!allData.length && (
        <div className="fade-in-up delay-1" style={{ textAlign: 'center', padding: '80px 20px 60px' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
          }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M6 28V14l6-6h18l6 6v14a2 2 0 01-2 2H8a2 2 0 01-2-2z" stroke="var(--text-tertiary)" strokeWidth="2"/>
              <path d="M13 30V21h10v9" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 8v-2" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 34, fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 8, letterSpacing: '-0.5px',
          }}>
            Žiadne dáta
          </h1>
          <p style={{
            fontSize: 17, fontWeight: 500,
            color: 'var(--accent)',
            marginBottom: 24,
          }}>
            Pripravený na analýzu
          </p>
          <p style={{
            fontSize: 14, color: 'var(--text-secondary)',
            lineHeight: 1.8, maxWidth: 440, margin: '0 auto',
          }}>
            Vyberte spôsob zadania dát vyššie —{' '}
            <span style={{ color: 'var(--text-primary)' }}>vložte skopírovaný text</span>,{' '}
            <span style={{ color: 'var(--text-primary)' }}>zadajte záznamy ručne</span>, alebo{' '}
            <span style={{ color: 'var(--text-primary)' }}>nahrajte Excel súbor (.xlsx)</span>.
          </p>
        </div>
      )}
    </main>
  )
}
