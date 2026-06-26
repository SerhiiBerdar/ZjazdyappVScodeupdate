import React, { useMemo } from 'react'

export default function CidloDetailPanel({ station, allData, isOpen, onClose }) {
  const stationData = useMemo(() => {
    if (!station || !allData?.length) return []
    return allData
      .filter(d => d.station === station)
      .sort((a, b) => a.datetime - b.datetime)
  }, [station, allData])

  const uniqueBarcodes = useMemo(() => {
    return [...new Set(stationData.map(d => d.barcode))]
  }, [stationData])

  if (!isOpen || !station) return null

  const fmtDT = dt =>
    dt.toLocaleString('sk', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Overlay */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div style={{
        position: 'relative',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-xl)',
        width: '90vw', maxWidth: 860,
        maxHeight: '82vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
              Stanica:{' '}
              <span style={{ color: 'var(--accent)' }}>{station}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              {stationData.length.toLocaleString('sk')} záznamov
              {' · '}
              {uniqueBarcodes.length.toLocaleString('sk')} unikátnych KLT
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              cursor: 'pointer', fontSize: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 150ms ease',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            ×
          </button>
        </div>

        {/* KLT chips */}
        {uniqueBarcodes.length > 0 && (
          <div style={{
            padding: '10px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', flexWrap: 'wrap', gap: 6,
            flexShrink: 0,
            maxHeight: 96, overflowY: 'auto',
          }}>
            {uniqueBarcodes.slice(0, 40).map(bc => (
              <span key={bc} style={{
                padding: '2px 8px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 11, fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
              }}>
                {bc}
              </span>
            ))}
            {uniqueBarcodes.length > 40 && (
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', padding: '2px 4px', alignSelf: 'center' }}>
                +{uniqueBarcodes.length - 40} ďalších
              </span>
            )}
          </div>
        )}

        {/* Table */}
        <div style={{ overflow: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['KLT / Čiarový kód', 'Dátum a čas'].map(h => (
                  <th key={h} style={{
                    padding: '9px 16px', textAlign: 'left',
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
              {stationData.slice(0, 500).map((row, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{
                    padding: '7px 16px',
                    fontFamily: 'var(--font-mono)', fontSize: 12,
                    color: 'var(--accent)',
                  }}>
                    {row.barcode}
                  </td>
                  <td style={{
                    padding: '7px 16px',
                    fontSize: 12, color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {fmtDT(row.datetime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {stationData.length > 500 && (
            <div style={{
              padding: '14px', textAlign: 'center',
              fontSize: 12, color: 'var(--text-tertiary)',
              borderTop: '1px solid var(--border)',
            }}>
              Zobrazených prvých 500 z {stationData.length.toLocaleString('sk')} záznamov
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
