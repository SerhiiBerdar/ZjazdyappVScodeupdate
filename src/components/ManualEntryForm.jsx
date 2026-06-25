import React, { useState } from 'react'

const INPUT = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text)',
  fontSize: 13,
  padding: '8px 12px',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  width: '100%',
  colorScheme: 'dark',
  transition: 'border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease)',
}

const LABEL = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text2)',
  textTransform: 'uppercase',
  letterSpacing: '.08em',
  display: 'block',
  marginBottom: 5,
}

function toDatetimeLocal(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const makeDefault = () => ({
  boxResponseId: '',
  carovyKod: '',
  stanica: '',
  casPrejazdu: toDatetimeLocal(new Date()),
  poznamka: '',
})

function validate(form) {
  const errors = []
  if (!form.carovyKod.trim()) errors.push('Čárový kód je povinný')
  if (!form.stanica.trim()) errors.push('Stanice/čidlo je povinné')
  if (!form.casPrejazdu) errors.push('Čas průjezdu je povinný')
  else if (isNaN(Date.parse(form.casPrejazdu))) errors.push('Čas průjezdu má neplatný formát')
  return errors
}

export default function ManualEntryForm({ onAdd }) {
  const [form, setForm] = useState(makeDefault)
  const [errors, setErrors] = useState([])
  const [addedCount, setAddedCount] = useState(0)

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleAdd = () => {
    const errs = validate(form)
    if (errs.length) { setErrors(errs); return }
    setErrors([])

    const dt = new Date(form.casPrejazdu)
    onAdd({
      barcode:      form.carovyKod.trim(),
      station:      form.stanica.trim().toUpperCase(),
      datetime:     dt,
      hour:         dt.getHours(),
      minute:       dt.getMinutes(),
      boxResponseId: form.boxResponseId.trim() || null,
      poznamka:     form.poznamka.trim(),
    })

    setAddedCount(c => c + 1)
    // Keep time, clear the per-record fields
    setForm(f => ({ ...f, carovyKod: '', stanica: '', poznamka: '', boxResponseId: '' }))
  }

  const handleClear = () => { setForm(makeDefault()); setErrors([]); setAddedCount(0) }

  const handleKeyDown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() } }

  return (
    <div>
      {/* Description */}
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 16, lineHeight: 1.7 }}>
        Zadajte jednotlivé záznamy ručne. Stlačte{' '}
        <kbd style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', padding: '1px 5px', borderRadius: 4, fontSize: 10 }}>Enter</kbd>
        {' '}pre rýchle pridanie.
      </div>

      {/* Form grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: 12, marginBottom: 12 }}>
        {/* BoxResponse_ID */}
        <div>
          <label style={LABEL}>BoxResponse_ID <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(voliteľné)</span></label>
          <input
            type="number"
            value={form.boxResponseId}
            onChange={set('boxResponseId')}
            onKeyDown={handleKeyDown}
            placeholder="67845568"
            style={INPUT}
          />
        </div>

        {/* Čárový kód */}
        <div>
          <label style={LABEL}>Čárový kód <span style={{ color: 'var(--accent)', fontSize: 9 }}>*</span></label>
          <input
            type="text"
            value={form.carovyKod}
            onChange={set('carovyKod')}
            onKeyDown={handleKeyDown}
            placeholder="napr. 80111828"
            style={{ ...INPUT, borderColor: errors.some(e => e.includes('kód')) ? 'var(--accent3)' : undefined }}
            autoFocus
          />
        </div>

        {/* Stanica */}
        <div>
          <label style={LABEL}>Stanice/čidlo <span style={{ color: 'var(--accent)', fontSize: 9 }}>*</span></label>
          <input
            type="text"
            value={form.stanica}
            onChange={set('stanica')}
            onKeyDown={handleKeyDown}
            placeholder="napr. L02a, DS19S21"
            style={{ ...INPUT, borderColor: errors.some(e => e.includes('Stanice')) ? 'var(--accent3)' : undefined }}
          />
        </div>
      </div>

      {/* Čas průjezdu */}
      <div style={{ marginBottom: 12 }}>
        <label style={LABEL}>Čas průjezdu <span style={{ color: 'var(--accent)', fontSize: 9 }}>*</span></label>
        <input
          type="datetime-local"
          value={form.casPrejazdu}
          onChange={set('casPrejazdu')}
          style={{ ...INPUT, borderColor: errors.some(e => e.includes('Čas')) ? 'var(--accent3)' : undefined }}
        />
      </div>

      {/* Poznámka */}
      <div style={{ marginBottom: 16 }}>
        <label style={LABEL}>Poznámka <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(voliteľné)</span></label>
        <textarea
          value={form.poznamka}
          onChange={set('poznamka')}
          rows={2}
          placeholder="TargetStation: DS24S26 | LastLocation: DS19S21 | NextLocation: DS24S26"
          style={{ ...INPUT, resize: 'vertical', fontFamily: 'Consolas, Monaco, monospace', fontSize: 12 }}
        />
      </div>

      {/* Buttons + status */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn" onClick={handleAdd}>+ Pridať záznam</button>
        <button className="btn-ghost" onClick={handleClear}>↺ Vymazať formulár</button>

        {addedCount > 0 && (
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textShadow: '0 0 12px rgba(200,255,0,0.3)' }}>
            ✓ Pridaných: {addedCount}
          </span>
        )}

        {errors.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {errors.map((err, i) => (
              <span key={i} style={{ fontSize: 12, color: 'var(--accent3)', fontWeight: 500 }}>⚠ {err}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
