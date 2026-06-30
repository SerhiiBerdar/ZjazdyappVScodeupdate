import React, { useState } from 'react'

function fmt(dt) {
  if (!dt) return ''
  try { return dt.toLocaleTimeString('sk', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
  catch { return '' }
}

export default function SlotDrillPanel({ slotLabel, resMin, records, onClose, onSelectBarcode }) {
  const [search, setSearch] = useState('')

  const sorted = [...records].sort((a, b) => a.datetime - b.datetime)
  const filtered = search
    ? sorted.filter(r => r.barcode.includes(search) || r.station.includes(search.toUpperCase()))
    : sorted

  const uniqueKlt    = new Set(records.map(r => r.barcode)).size
  const uniqueStations = [...new Set(records.map(r => r.station))].sort()

  const resLabel = resMin < 60 ? `${resMin} min` : '1 hod'

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, width: 460,
      background: 'var(--surface)',
      border: '1px solid rgba(200,255,0,0.25)',
      borderRadius: 16, zIndex: 400,
      boxShadow: '0 20px 70px rgba(0,0,0,0.75), 0 0 30px rgba(200,255,0,0.06)',
      animation: 'slideUp .22s var(--ease)',
      display: 'flex', flexDirection: 'column', maxHeight: '80vh',
    }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Header */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700,
            letterSpacing: '-0.3px', color: '#C8FF00',
          }}>
            {slotLabel}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
            Časový slot · {resLabel}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none',
            color: 'var(--text-tertiary)', fontSize: 18,
            cursor: 'pointer', padding: '2px 4px', lineHeight: 1,
          }}
        >✕</button>
      </div>

      {/* Summary chips */}
      <div style={{
        display: 'flex', gap: 10, padding: '10px 16px',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        {[
          { label: 'Priechodov', value: records.length.toLocaleString('sk'), color: '#C8FF00' },
          { label: 'Unikátnych KLT', value: uniqueKlt.toLocaleString('sk'), color: '#22D3EE' },
          { label: 'Staníc', value: uniqueStations.length, color: '#A78BFA' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            flex: 1, textAlign: 'center',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border)',
            borderRadius: 10, padding: '8px 6px',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color, textShadow: `0 0 12px ${color}55` }}>
              {value}
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 2 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: '10px 16px 8px', flexShrink: 0 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Hľadať čiarový kód alebo stanicu…"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
            borderRadius: 8, padding: '7px 12px',
            fontSize: 12, color: 'var(--text-primary)',
            outline: 'none', fontFamily: 'var(--font-mono)',
          }}
        />
      </div>

      {/* Station tags */}
      {uniqueStations.length > 0 && uniqueStations.length <= 12 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', padding: '0 16px 8px', flexShrink: 0 }}>
          {uniqueStations.map(s => (
            <button
              key={s}
              onClick={() => setSearch(prev => prev === s ? '' : s)}
              style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 20,
                background: search === s ? 'rgba(200,255,0,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${search === s ? 'rgba(200,255,0,0.4)' : 'var(--border)'}`,
                color: search === s ? '#C8FF00' : 'var(--text-secondary)',
                cursor: 'pointer', fontFamily: 'var(--font-mono)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Records list */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '0 8px 12px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: 'var(--text-tertiary)' }}>
            Žiadne záznamy
          </div>
        ) : (
          filtered.map((r, i) => (
            <div
              key={i}
              onClick={() => onSelectBarcode && onSelectBarcode(r.barcode)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                transition: 'background .12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 12,
                color: 'var(--text-primary)', flex: 1,
              }}>
                {r.barcode}
              </span>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 20,
                background: 'rgba(34,211,238,0.1)',
                border: '1px solid rgba(34,211,238,0.2)',
                color: '#22D3EE', fontFamily: 'var(--font-mono)',
                flexShrink: 0,
              }}>
                {r.station}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', flexShrink: 0, minWidth: 62, textAlign: 'right' }}>
                {fmt(r.datetime)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div style={{
        borderTop: '1px solid var(--border)', padding: '8px 16px',
        fontSize: 10, color: 'var(--text-tertiary)', flexShrink: 0,
      }}>
        Klikni na záznam → preskúmaj trasu KLT
      </div>
    </div>
  )
}
