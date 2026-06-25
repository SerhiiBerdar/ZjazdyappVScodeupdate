import React, { useState, useRef, useEffect, useCallback } from 'react'

export default function ExcelImport({ onImport, existingCount }) {
  const [status, setStatus] = useState('idle') // idle | parsing | done | error
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [importMode, setImportMode] = useState('replace')
  const [progress, setProgress] = useState(0)
  const workerRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => () => workerRef.current?.terminate(), [])

  const processFile = useCallback(async (file) => {
    if (!file.name.match(/\.xlsx?$/i)) {
      setStatus('error')
      setResult({ message: 'Neplatný formát. Prosím nahrajte súbor s príponou .xlsx alebo .xls' })
      return
    }

    setStatus('parsing')
    setProgress(0)
    setResult(null)
    workerRef.current?.terminate()

    let worker
    try {
      worker = new Worker(
        new URL('../workers/excelParser.worker.js', import.meta.url),
        { type: 'module' }
      )
    } catch {
      setStatus('error')
      setResult({ message: 'Web Worker nie je podporovaný v tomto prehliadači.' })
      return
    }

    workerRef.current = worker

    worker.onmessage = e => {
      const msg = e.data
      if (msg.type === 'progress') {
        setProgress(Math.round((msg.processed / msg.total) * 100))
      } else if (msg.type === 'done') {
        const records = msg.records.map(r => ({
          ...r,
          datetime: new Date(r.datetimeISO),
        }))
        setResult({ ...msg, records })
        setStatus('done')
        worker.terminate()
      } else if (msg.type === 'error') {
        setResult({ message: msg.message })
        setStatus('error')
        worker.terminate()
      }
    }

    worker.onerror = e => {
      setResult({ message: e.message || 'Neznáma chyba pri parsovaní' })
      setStatus('error')
      worker.terminate()
    }

    const buffer = await file.arrayBuffer()
    worker.postMessage(buffer)
  }, [])

  const handleDrop = useCallback(e => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleFileInput = e => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleImport = () => {
    if (result?.records?.length) {
      onImport(result.records, importMode)
      setStatus('idle')
      setResult(null)
    }
  }

  const reset = () => { setStatus('idle'); setResult(null); setProgress(0) }

  const dropZoneStyle = {
    border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border2)'}`,
    borderRadius: 'var(--radius-sm)',
    padding: '28px 20px',
    textAlign: 'center',
    transition: 'border-color var(--dur) var(--ease), background var(--dur) var(--ease)',
    background: dragOver ? 'rgba(200,255,0,0.04)' : 'transparent',
    cursor: 'pointer',
  }

  return (
    <div>
      {/* Import mode selector */}
      {existingCount > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 13 }}>
          {[
            { value: 'replace', label: 'Nahradiť existujúce dáta' },
            { value: 'append',  label: `Pridať k ${existingCount.toLocaleString('sk')} existujúcim záznamom` },
          ].map(opt => (
            <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: importMode === opt.value ? 'var(--accent)' : 'var(--text2)' }}>
              <input
                type="radio"
                value={opt.value}
                checked={importMode === opt.value}
                onChange={() => setImportMode(opt.value)}
                style={{ accentColor: 'var(--accent)' }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {(status === 'idle' || status === 'error') && (
        <div
          style={dropZoneStyle}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={{ fontSize: 32, marginBottom: 10 }}>📂</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            Presuňte Excel súbor sem
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>
            alebo kliknite pre výber súboru (.xlsx, .xls)
          </div>
          <button className="btn-ghost" onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}>
            Vybrať súbor
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
        </div>
      )}

      {/* Error */}
      {status === 'error' && result?.message && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--accent3)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>✕</span>
          <span>{result.message}</span>
          <button className="btn-ghost" style={{ marginLeft: 'auto', fontSize: 11, padding: '4px 10px' }} onClick={reset}>Skúsiť znova</button>
        </div>
      )}

      {/* Parsing progress */}
      {status === 'parsing' && (
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
            Spracúvam súbor... môže trvať niekoľko sekúnd pre veľké súbory
          </div>
          <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: progress > 0 ? `${progress}%` : '30%',
              background: 'var(--accent)',
              borderRadius: 2,
              transition: 'width 0.3s ease',
              animation: progress === 0 ? 'indeterminate 1.4s infinite' : 'none',
              boxShadow: '0 0 8px var(--accent-glow)',
            }} />
          </div>
          {progress > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>{progress}%</div>
          )}
        </div>
      )}

      {/* Done state */}
      {status === 'done' && result && (
        <div style={{ marginTop: 4 }}>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16, padding: '14px 16px', background: 'rgba(200,255,0,0.06)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
            <Stat label="Úspešne" value={result.successRows.toLocaleString('sk')} color="var(--accent)" />
            <Stat label="Celkovo riadkov" value={result.totalRows.toLocaleString('sk')} />
            {result.skippedRows > 0 && <Stat label="Preskočených" value={result.skippedRows.toLocaleString('sk')} color="var(--accent3)" />}
          </div>

          {/* Parse errors */}
          {result.errors?.length > 0 && (
            <details style={{ marginBottom: 12 }}>
              <summary style={{ fontSize: 12, color: 'var(--text2)', cursor: 'pointer', padding: '6px 0', userSelect: 'none' }}>
                ⚠ Chyby pri parsovaní ({result.errors.length}{result.errors.length >= 10 ? '+' : ''})
              </summary>
              <ul style={{ marginTop: 8, paddingLeft: 16, fontSize: 11, color: 'var(--accent3)', lineHeight: 2 }}>
                {result.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </details>
          )}

          {result.successRows === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--accent3)', marginBottom: 12 }}>
              ✕ Žiadne platné záznamy sa nenačítali. Skontrolujte formát stĺpcov.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn" onClick={handleImport}>
                ↓ Načítať {result.successRows.toLocaleString('sk')} záznamov
              </button>
              <button className="btn-ghost" onClick={reset}>Vybrať iný súbor</button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes indeterminate {
          0%   { transform: translateX(-100%) scaleX(0.5); }
          50%  { transform: translateX(50%)   scaleX(0.7); }
          100% { transform: translateX(200%)  scaleX(0.5); }
        }
      `}</style>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)', color: color || 'var(--text)', letterSpacing: '0.04em' }}>{value}</div>
    </div>
  )
}
