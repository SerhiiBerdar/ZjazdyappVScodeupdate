import React, { useState } from 'react'
import { useOtoceneBaliky } from '../hooks/useOtoceneBaliky'

export default function OtoceneBaliky({ allData }) {
  const [minVisits, setMinVisits]   = useState(2)
  const [filter, setFilter]         = useState('')
  const [selected, setSelected]     = useState(null)

  const otocene = useOtoceneBaliky(allData, minVisits)

  const filtered = filter
    ? otocene.filter(b => b.barcode.toLowerCase().includes(filter.toLowerCase()))
    : otocene

  return (
    <main style={{ padding: '20px 24px', maxWidth: 1440, margin: '0 auto' }}>

      {/* Header card */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, margin: 0 }}>
              ⚠️ Otočené balíky
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              KLT prepravky, ktoré navštívili rovnakú stanicu viackrát — potenciálna chyba triedenia alebo fyzický obrat.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Barcode search */}
            <input
              type="text"
              placeholder="Hľadaj KLT..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ width: 180, fontSize: 13, padding: '7px 12px' }}
            />

            {/* Min visits selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Min. návštevy:</span>
              {[2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setMinVisits(n)}
                  className={minVisits === n ? 'btn' : 'btn-ghost'}
                  style={{ padding: '5px 10px', fontSize: 13, minWidth: 32 }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary bar */}
        <div style={{
          marginTop: 16, paddingTop: 14,
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 24, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Nájdených:{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{filtered.length.toLocaleString('sk')}</strong> KLT
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Podmienka: min. <strong style={{ color: 'var(--warning)' }}>{minVisits}×</strong> tá istá stanica
          </span>
          {allData.length === 0 && (
            <span style={{ fontSize: 13, color: 'var(--danger)' }}>Najprv načítajte dáta na karte Dashboard</span>
          )}
        </div>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['KLT / Čiarový kód', 'Opakovaná stanica', 'Počet návštev', 'Časové rozpätie', 'Celá trasa'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontSize: 10, fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                    background: 'var(--bg-secondary)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(balik =>
                balik.repeatedStations.map((rs, ri) => (
                  <tr
                    key={`${balik.barcode}-${ri}`}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                    onClick={() => setSelected(balik)}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {ri === 0 && (
                      <td
                        rowSpan={balik.repeatedStations.length}
                        style={{
                          padding: '9px 16px',
                          fontFamily: 'var(--font-mono)', fontSize: 12,
                          color: 'var(--accent)', fontWeight: 600,
                          verticalAlign: 'middle',
                          borderRight: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        {balik.barcode}
                      </td>
                    )}
                    <td style={{
                      padding: '9px 16px',
                      fontFamily: 'var(--font-mono)', fontSize: 12,
                      color: 'var(--warning)',
                    }}>
                      {rs.station}
                    </td>
                    <td style={{ padding: '9px 16px' }}>
                      <span style={{
                        background: 'rgba(255,69,58,0.15)',
                        color: 'var(--danger)',
                        border: '1px solid rgba(255,69,58,0.25)',
                        borderRadius: 20, fontSize: 11, fontWeight: 700,
                        padding: '2px 8px',
                      }}>
                        {rs.visitCount}×
                      </span>
                    </td>
                    <td style={{ padding: '9px 16px', fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {rs.timeRange}
                    </td>
                    {ri === 0 && (
                      <td
                        rowSpan={balik.repeatedStations.length}
                        style={{
                          padding: '9px 16px', fontSize: 11,
                          color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)',
                          maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          verticalAlign: 'middle',
                        }}
                        title={balik.fullRoute.join(' → ')}
                      >
                        {balik.fullRoute.join(' → ')}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : allData.length > 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            Žiadne otočené balíky
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
            Žiadny KLT nenavštívil tú istú stanicu min. {minVisits}×
          </div>
        </div>
      ) : null}

      {/* Detail modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={() => setSelected(null)}
          />
          <div style={{
            position: 'relative',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-xl)',
            width: '90vw', maxWidth: 820,
            maxHeight: '82vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
          }}>

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700 }}>
                  Trasa KLT:{' '}
                  <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{selected.barcode}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                  {selected.visits.length} udalostí · {selected.repeatedStations.length} opakovaných staníc
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer', fontSize: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            {/* Visual route */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 'max-content' }}>
                {selected.fullRoute.map((st, i) => {
                  const isRepeated = selected.repeatedStations.some(rs => rs.station === st)
                  return (
                    <React.Fragment key={i}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 6,
                        fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
                        background: isRepeated ? 'rgba(255,69,58,0.15)' : 'var(--bg-elevated)',
                        color: isRepeated ? 'var(--danger)' : 'var(--text-secondary)',
                        border: isRepeated ? '1px solid rgba(255,69,58,0.3)' : '1px solid var(--border)',
                      }}>
                        {st}
                      </span>
                      {i < selected.fullRoute.length - 1 && (
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>→</span>
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>

            {/* Events table */}
            <div style={{ overflow: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['#', 'Stanica', 'Dátum a čas'].map(h => (
                      <th key={h} style={{
                        padding: '8px 14px', textAlign: 'left',
                        fontSize: 10, fontWeight: 600,
                        color: 'var(--text-tertiary)',
                        textTransform: 'uppercase', letterSpacing: '0.07em',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.visits.map((v, i) => {
                    const isRepeated = selected.repeatedStations.some(rs => rs.station === v.station)
                    return (
                      <tr
                        key={i}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: isRepeated ? 'rgba(255,69,58,0.05)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '7px 14px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{i + 1}</td>
                        <td style={{
                          padding: '7px 14px',
                          fontFamily: 'var(--font-mono)', fontWeight: 600,
                          color: isRepeated ? 'var(--danger)' : 'var(--text-primary)',
                        }}>
                          {v.station}
                          {isRepeated && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--danger)' }}>⚠</span>}
                        </td>
                        <td style={{ padding: '7px 14px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {v.datetime.toLocaleString('sk', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
