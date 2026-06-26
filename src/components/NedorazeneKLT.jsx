import React, { useState, useMemo } from 'react'
import { useNedorazeneKLT } from '../hooks/useNedorazeneKLT'

export default function NedorazeneKLT({ allData }) {
  const nedorazene    = useNedorazeneKLT(allData)
  const [searchBC, setSearchBC]       = useState('')
  const [searchTarget, setSearchTarget] = useState('')
  const [selected, setSelected]       = useState(null)

  const uniqueTargets = useMemo(() => {
    const set = new Set(nedorazene.map(n => n.targetStation))
    return ['— všetky —', ...Array.from(set).sort()]
  }, [nedorazene])

  const filtered = useMemo(() => {
    return nedorazene.filter(n => {
      const matchBC = !searchBC || n.barcode.toLowerCase().includes(searchBC.toLowerCase())
      const matchT  = !searchTarget || searchTarget === '— všetky —' ||
        n.targetStation.toLowerCase() === searchTarget.toLowerCase()
      return matchBC && matchT
    })
  }, [nedorazene, searchBC, searchTarget])

  const statsPerTarget = useMemo(() => {
    const map = new Map()
    for (const n of nedorazene) map.set(n.targetStation, (map.get(n.targetStation) ?? 0) + 1)
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)
  }, [nedorazene])

  const fmtDT = iso => {
    if (!iso) return '—'
    try { return new Date(iso).toLocaleString('sk-SK') } catch { return iso }
  }

  return (
    <main style={{ padding: '20px 24px', maxWidth: 1440, margin: '0 auto' }}>

      {/* ── Summary karty ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
            Nedorazených KLT
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            {nedorazene.length.toLocaleString('sk')}
          </div>
        </div>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
            Unikátnych targetov
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            {new Set(nedorazene.map(n => n.targetStation)).size}
          </div>
        </div>
        <div className="card" style={{ padding: '18px 20px', borderColor: 'rgba(255,69,58,0.3)', background: 'rgba(255,69,58,0.06)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
            Top problémový target
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'rgba(255,69,58,0.9)' }}>
            {statsPerTarget[0]?.[0] ?? '—'}
          </div>
          {statsPerTarget[0] && (
            <div style={{ fontSize: 11, color: 'var(--danger)', opacity: 0.7, marginTop: 2 }}>
              {statsPerTarget[0][1]} KLT
            </div>
          )}
        </div>
      </div>

      {/* ── Top 10 targetov ── */}
      {statsPerTarget.length > 0 && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
            Top cieľové stanice s nedorazeniami
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {statsPerTarget.map(([target, count]) => {
              const pct = Math.round((count / statsPerTarget[0][1]) * 100)
              return (
                <div key={target} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', width: 100, textAlign: 'right', flexShrink: 0 }}>
                    {target}
                  </span>
                  <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--danger)', borderRadius: 4, transition: 'width 0.4s ease' }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', width: 36, textAlign: 'right', flexShrink: 0 }}>
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Filtre ── */}
      {nedorazene.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Hľadaj čiarový kód..."
            value={searchBC}
            onChange={e => setSearchBC(e.target.value)}
            style={{ width: 210, fontSize: 13, padding: '7px 12px' }}
          />
          <select
            value={searchTarget}
            onChange={e => setSearchTarget(e.target.value)}
            style={{ fontSize: 13, padding: '7px 12px', width: 180 }}
          >
            {uniqueTargets.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Zobrazených:{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{filtered.length.toLocaleString('sk')}</strong>
          </span>
          {(searchBC || (searchTarget && searchTarget !== '— všetky —')) && (
            <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}
              onClick={() => { setSearchBC(''); setSearchTarget('') }}>
              Zrušiť filter
            </button>
          )}
        </div>
      )}

      {/* ── Tabuľka ── */}
      {nedorazene.length === 0 ? (
        <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          {allData.length === 0 ? (
            <>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Žiadne dáta</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
                Nahrajte Excel súbor na karte Dashboard (Import .xlsx) — táto záložka vyžaduje stĺpec <strong>Poznámka</strong> s údajom TargetStation.
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Všetky KLT dorazili na cieľ</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
                Alebo dáta neobsahujú stĺpec Poznámka s TargetStation.
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowY: 'auto', maxHeight: '52vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Čiarový kód', 'Cieľová stanica', 'Posledná stanica', 'Posledný čas', 'Záznamy'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: 10, fontWeight: 600,
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase', letterSpacing: '.07em',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 500).map(klt => (
                  <tr
                    key={klt.barcode}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                    onClick={() => setSelected(klt)}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                      {klt.barcode}
                    </td>
                    <td style={{ padding: '8px 16px' }}>
                      <span style={{
                        background: 'rgba(255,69,58,0.12)',
                        color: 'var(--danger)',
                        border: '1px solid rgba(255,69,58,0.25)',
                        borderRadius: 6, fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 7px',
                      }}>
                        {klt.targetStation}
                      </span>
                    </td>
                    <td style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--warning)' }}>
                      {klt.poslednaStanica}
                    </td>
                    <td style={{ padding: '8px 16px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {fmtDT(klt.poslednyDatumCas)}
                    </td>
                    <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                      <span style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: 6, fontSize: 11,
                        color: 'var(--text-secondary)',
                        padding: '2px 7px',
                      }}>
                        {klt.pocetZaznamov}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 500 && (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', borderTop: '1px solid var(--border)' }}>
                Zobrazených 500 z {filtered.length.toLocaleString('sk')} — upresni filter
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Detail modal ── */}
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
            width: '90vw', maxWidth: 780,
            maxHeight: '80vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
          }}>

            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700 }}>
                  Trasa KLT:{' '}
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{selected.barcode}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Target:{' '}
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>{selected.targetStation}</span>
                  {'  ·  '}
                  Posledná stanica:{' '}
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>{selected.poslednaStanica}</span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              >×</button>
            </div>

            {/* Visual route */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 'max-content', flexWrap: 'wrap' }}>
                {selected.trasa.map((st, i) => {
                  const isTarget = st.toLowerCase() === selected.targetStation.toLowerCase()
                  const isLast   = i === selected.trasa.length - 1
                  return (
                    <React.Fragment key={i}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 6,
                        fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
                        background: isTarget
                          ? 'rgba(48,209,88,0.15)'
                          : isLast
                            ? 'rgba(255,159,10,0.15)'
                            : 'var(--bg-elevated)',
                        color: isTarget
                          ? 'var(--success)'
                          : isLast
                            ? 'var(--warning)'
                            : 'var(--text-secondary)',
                        border: isTarget
                          ? '1px solid rgba(48,209,88,0.3)'
                          : isLast
                            ? '1px solid rgba(255,159,10,0.3)'
                            : '1px solid var(--border)',
                      }}>
                        {st}
                        {isTarget && ' ✓'}
                        {isLast && !isTarget && ' ←'}
                      </span>
                      {i < selected.trasa.length - 1 && (
                        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>→</span>
                      )}
                    </React.Fragment>
                  )
                })}
                {/* Show where it should have gone */}
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>→</span>
                <span style={{
                  padding: '3px 8px', borderRadius: 6,
                  fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
                  background: 'rgba(255,69,58,0.1)',
                  color: 'var(--danger)',
                  border: '1px dashed rgba(255,69,58,0.4)',
                }}>
                  {selected.targetStation} (nedorazil)
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ padding: '8px 24px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-tertiary)', flexShrink: 0 }}>
              {selected.pocetZaznamov} záznamov · {new Set(selected.trasa).size} unikátnych staníc
            </div>

            {/* Route table */}
            <div style={{ overflow: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['#', 'Stanica'].map(h => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.trasa.map((st, i) => {
                    const isTarget = st.toLowerCase() === selected.targetStation.toLowerCase()
                    const isLast   = i === selected.trasa.length - 1 && !isTarget
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isTarget ? 'rgba(48,209,88,0.04)' : isLast ? 'rgba(255,159,10,0.04)' : 'transparent' }}>
                        <td style={{ padding: '6px 14px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{i + 1}</td>
                        <td style={{ padding: '6px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: isTarget ? 'var(--success)' : isLast ? 'var(--warning)' : 'var(--text-primary)' }}>
                          {st}
                          {isTarget && <span style={{ marginLeft: 6, fontSize: 10 }}>✓ target</span>}
                          {isLast && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--warning)' }}>← zastavil tu</span>}
                        </td>
                      </tr>
                    )
                  })}
                  {/* Phantom final row */}
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,69,58,0.04)' }}>
                    <td style={{ padding: '6px 14px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>—</td>
                    <td style={{ padding: '6px 14px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--danger)' }}>
                      {selected.targetStation}
                      <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 400, color: 'rgba(255,69,58,0.6)' }}>← nedorazil</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
