import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import { EXP_NODES } from '../data/expNodes'
import StationPopup from './StationPopup'
import StatCard from './StatCard'

function heatFill(ratio, type) {
  if (!ratio) return null
  const t = Math.min(ratio, 1)
  if (type === 'D') return `rgba(${Math.round(200+t*55)},${Math.round(20+t*20)},20,${(0.3+t*0.6).toFixed(2)})`
  if (type === 'X') return `rgba(130,60,230,${(0.4+t*0.55).toFixed(2)})`
  return `rgba(20,${Math.round(160+t*90)},${Math.round(50+t*170)},${(0.3+t*0.6).toFixed(2)})`
}

const MIN_ZOOM = 0.05
const MAX_ZOOM = 5

export default function ExpLayout({ allData, stStats }) {
  const [svgContent, setSvgContent] = useState('')
  const [selected, setSelected]     = useState(null)
  const [scale, setScale]           = useState(1)
  const [fs, setFs]                 = useState(false)
  const svgRef      = useRef(null)   // div that holds the injected <svg>
  const viewportRef = useRef(null)   // scrolling viewport
  const containerRef= useRef(null)   // wrapper (for fullscreen)
  const natural     = useRef({ w: 0, h: 0 })
  const drag        = useRef(null)
  const moved       = useRef(false)
  const anchor      = useRef(null)   // {contentX, contentY, ax, ay} for zoom centering

  useEffect(() => {
    fetch('/expLayout.svg').then(r => r.text()).then(setSvgContent)
  }, [])

  const fitToView = useCallback(() => {
    const vp = viewportRef.current
    const { w, h } = natural.current
    if (!vp || !w || !h) return
    const pad = 16
    const s = Math.min((vp.clientWidth - pad) / w, (vp.clientHeight - pad) / h)
    anchor.current = null
    setScale(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, s)))
  }, [])

  // inject svg + wire up station clicks
  useEffect(() => {
    if (!svgContent || !svgRef.current) return
    svgRef.current.innerHTML = svgContent
    const svg = svgRef.current.querySelector('svg')
    if (svg) {
      const vb = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number)
      natural.current = { w: vb[2] || 1000, h: vb[3] || 1000 }
      svg.removeAttribute('width'); svg.removeAttribute('height')
      svg.style.display = 'block'
    }
    svgRef.current.querySelectorAll('.mz-station').forEach(el => {
      el.style.cursor = 'pointer'
      el.addEventListener('click', () => {
        if (moved.current) return
        const id = el.dataset.label, type = el.dataset.type
        if (id) setSelected({ id, type })
      })
    })
    fitToView()
  }, [svgContent, fitToView])

  // apply scale to svg size (drives native scrollbars) + keep zoom anchor stable
  useLayoutEffect(() => {
    const svg = svgRef.current?.querySelector('svg')
    const vp = viewportRef.current
    if (!svg || !vp) return
    svg.style.width  = natural.current.w * scale + 'px'
    svg.style.height = natural.current.h * scale + 'px'
    if (anchor.current) {
      const { contentX, contentY, ax, ay } = anchor.current
      vp.scrollLeft = contentX * scale - ax
      vp.scrollTop  = contentY * scale - ay
      anchor.current = null
    }
  }, [scale, svgContent])

  // heatmap colouring
  useEffect(() => {
    if (!svgRef.current || !svgContent) return
    const maxCount = Math.max(...EXP_NODES.map(n => {
      const st = stStats.find(s => s.station.toUpperCase() === n.id.toUpperCase())
      return st?.count ?? 0
    }), 1)
    EXP_NODES.forEach(n => {
      const el = svgRef.current?.querySelector(`#hsr_${n.safeId}`)
      if (!el) return
      const st = stStats.find(s => s.station.toUpperCase() === n.id.toUpperCase())
      const ratio = (st?.count ?? 0) / maxCount
      const fill = heatFill(ratio, n.type)
      if (fill) {
        el.setAttribute('fill', fill)
        el.setAttribute('stroke-width', '2.5')
        el.setAttribute('stroke', n.type==='D' ? 'rgba(255,150,100,.9)' : n.type==='X' ? 'rgba(190,120,255,.9)' : 'rgba(100,240,140,.85)')
      } else {
        el.setAttribute('stroke', 'rgba(255,255,255,.12)')
        el.setAttribute('stroke-width', '1')
      }
    })
  }, [stStats, svgContent])

  // zoom keeping a screen point stable
  const zoomAt = useCallback((factor, clientX, clientY) => {
    const vp = viewportRef.current
    if (!vp) return
    const rect = vp.getBoundingClientRect()
    const ax = clientX != null ? clientX - rect.left : vp.clientWidth / 2
    const ay = clientY != null ? clientY - rect.top  : vp.clientHeight / 2
    setScale(prev => {
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * factor))
      anchor.current = {
        contentX: (vp.scrollLeft + ax) / prev,
        contentY: (vp.scrollTop  + ay) / prev,
        ax, ay,
      }
      return next
    })
  }, [])

  // ctrl/⌘ + wheel = zoom · plain wheel = native scroll
  const onWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY)
    }
  }, [zoomAt])

  // drag to pan (adjusts scroll position)
  const onPointerDown = (e) => {
    const vp = viewportRef.current
    drag.current = { sx: e.clientX, sy: e.clientY, sl: vp.scrollLeft, st: vp.scrollTop }
    moved.current = false
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.sx, dy = e.clientY - drag.current.sy
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved.current = true
    const vp = viewportRef.current
    vp.scrollLeft = drag.current.sl - dx
    vp.scrollTop  = drag.current.st - dy
  }
  const endDrag = (e) => {
    if (!drag.current) return
    drag.current = null
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    setTimeout(() => { moved.current = false }, 0)
  }

  // fullscreen ("otvoriť v okne")
  const toggleFs = useCallback(() => {
    const el = containerRef.current
    if (!document.fullscreenElement) el?.requestFullscreen?.()
    else document.exitFullscreen?.()
  }, [])
  useEffect(() => {
    const h = () => { setFs(!!document.fullscreenElement); setTimeout(fitToView, 60) }
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [fitToView])

  const expNames  = new Set(EXP_NODES.map(n => n.id.toUpperCase()))
  const expData   = stStats.filter(s => expNames.has(s.station.toUpperCase()))
  const expTotal  = expData.reduce((s,n) => s+n.count, 0)
  const expActive = expData.length
  const expKlt    = new Set(allData.filter(d => expNames.has(d.station.toUpperCase())).map(d => d.barcode)).size
  const hb = {}; allData.forEach(d => { hb[d.hour] = (hb[d.hour]||0)+1 })
  const peak = Object.entries(hb).sort((a,b) => b[1]-a[1])[0]

  const btn = {
    width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
    background: 'var(--panel)', border: '1px solid var(--border)',
    color: 'var(--text2)', fontSize: 16, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  return (
    <div style={{ padding: 20, maxWidth: 1600, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>📦 Expedičná časť — sortery &amp; výstupné linky</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Klikni na stanicu → detail · Ťahaj myšou alebo scrolluj = posun · Ctrl + koliesko / tlačidlá = priblíženie</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard label="Záznamy v EXP"    value={expTotal.toLocaleString('sk')}  sub="priechodov celkovo"  accent="var(--accent)" />
        <StatCard label="Aktívne stanice"  value={expActive}                      sub="unikátnych staníc"   accent="var(--accent2)" />
        <StatCard label="KLT prepravky"    value={expKlt.toLocaleString('sk')}    sub="unikátnych KLT"      accent="var(--accent4)" />
        <StatCard label="Vrcholová hodina" value={peak ? `${peak[0]}:00` : '—'} sub={peak ? `${peak[1].toLocaleString('sk')} priechodov` : ''} accent="var(--accent3)" />
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: 11, color: 'var(--text2)' }}>
        <span>🟥 Sorter / Divertor</span><span>🟩 Stanica</span><span>🟣 Prítok / Transfer</span>
        <span style={{ color: 'var(--text3)' }}>· Jas = počet priechodov</span>
      </div>

      <div ref={containerRef} style={{ position: 'relative', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: fs ? 0 : 12, overflow: 'hidden', height: fs ? '100vh' : undefined }}>
        <div
          ref={viewportRef}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          style={{ width: '100%', height: fs ? '100vh' : '72vh', overflow: 'auto', cursor: drag.current ? 'grabbing' : 'grab', touchAction: 'none' }}
        >
          <div ref={svgRef} style={{ width: 'fit-content' }} />
        </div>

        {/* toolbar */}
        <div style={{ position: 'absolute', right: 12, top: 12, display: 'flex', gap: 6 }}>
          <button title="Priblížiť"      style={btn} onClick={() => zoomAt(1.25)}>+</button>
          <button title="Oddialiť"       style={btn} onClick={() => zoomAt(1/1.25)}>−</button>
          <button title="Prispôsobiť"    style={{ ...btn, fontSize: 13 }} onClick={fitToView}>⤢</button>
          <button title={fs ? 'Zavrieť okno' : 'Otvoriť na celú obrazovku'} style={{ ...btn, fontSize: 14 }} onClick={toggleFs}>{fs ? '✕' : '⛶'}</button>
        </div>
        <div style={{ position: 'absolute', left: 12, bottom: 12, fontSize: 11, color: 'var(--text3)', background: 'rgba(0,0,0,.4)', padding: '3px 8px', borderRadius: 6 }}>
          {Math.round(scale * 100)} %
        </div>
      </div>

      {!allData.length && (
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: 'var(--text3)' }}>
          Načítajte dáta v záložke Dashboard — stanice sa ofarbia podľa reálnej vyťaženosti
        </div>
      )}

      {selected && (
        <StationPopup
          station={selected.id} type={selected.type}
          allData={allData} stStats={stStats}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
