import React, { useEffect, useRef } from 'react'
import { Chart } from 'chart.js/auto'
import { getSlots } from '../utils/parser'

const RES_OPTIONS = [5, 15, 30, 60]

const CHART_DEFAULTS = {
  grid:    'rgba(255,255,255,0.04)',
  tick:    '#6B6B80',
  tipBg:   '#1A1A24',
  tipTitle:'#F0F0F5',
  tipBody: '#6B6B80',
  tipBorder:'rgba(255,255,255,0.08)',
}

export default function TimelineChart({ data, resolution, onResChange, showDuplicates, onToggleDuplicates, onSlotClick }) {
  const canvasRef   = useRef(null)
  const chartRef    = useRef(null)
  const slotMinsRef = useRef([])

  useEffect(() => {
    if (!canvasRef.current) return
    chartRef.current?.destroy()

    const slots    = getSlots(data, resolution)
    const nPoints  = slots.length
    const ptRadius = nPoints > 120 ? 0 : 3

    slotMinsRef.current = slots.map(([label]) => {
      const [h, m] = label.split(':').map(Number)
      return h * 60 + m
    })

    let dupSlots = null
    if (showDuplicates && data.length) {
      const pairCounts = {}
      data.forEach(d => {
        const key = `${d.barcode}|${d.station}`
        pairCounts[key] = (pairCounts[key] || 0) + 1
      })
      const dupData = data.filter(d => pairCounts[`${d.barcode}|${d.station}`] > 1)
      dupSlots = getSlots(dupData, resolution)
    }

    const datasets = [
      {
        label: 'Všetky priechody',
        data: slots.map(s => s[1]),
        borderColor: '#C8FF00',
        backgroundColor: 'rgba(200,255,0,0.07)',
        borderWidth: 2, fill: true, tension: 0.35,
        pointRadius: ptRadius, pointHoverRadius: 5,
        pointBackgroundColor: '#C8FF00',
      },
    ]

    if (dupSlots) {
      datasets.push({
        label: 'Opakované (≥2× na stanici)',
        data: dupSlots.map(s => s[1]),
        borderColor: '#FF4D6D',
        backgroundColor: 'rgba(255,77,109,0.07)',
        borderWidth: 2, fill: false, tension: 0.35,
        pointRadius: ptRadius, pointHoverRadius: 5,
        pointBackgroundColor: '#FF4D6D',
      })
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: { labels: slots.map(s => s[0]), datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        onClick: (evt, elements) => {
          if (!onSlotClick || !elements.length) return
          const idx = elements[0].index
          const label = slots[idx][0]
          const slotMin = slotMinsRef.current[idx]
          onSlotClick(slotMin, label, resolution)
        },
        plugins: {
          legend: {
            display: !!dupSlots,
            labels: { color: CHART_DEFAULTS.tick, font: { size: 12, family: 'DM Sans' }, boxWidth: 14, padding: 16 },
          },
          tooltip: {
            backgroundColor: CHART_DEFAULTS.tipBg,
            titleColor: CHART_DEFAULTS.tipTitle,
            bodyColor: CHART_DEFAULTS.tipBody,
            borderColor: CHART_DEFAULTS.tipBorder,
            borderWidth: 1,
          },
        },
        scales: {
          x: { grid: { color: CHART_DEFAULTS.grid }, ticks: { color: CHART_DEFAULTS.tick, font: { size: 11 }, maxTicksLimit: 24 } },
          y: { grid: { color: CHART_DEFAULTS.grid }, ticks: { color: CHART_DEFAULTS.tick, font: { size: 11 } }, beginAtZero: true },
        },
      },
    })

    return () => chartRef.current?.destroy()
  }, [data, resolution, showDuplicates, onSlotClick])

  return (
    <>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>
        📈 Počet priechodov v čase
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text2)' }}>Rozlíšenie:</span>
        {RES_OPTIONS.map(r => (
          <button key={r} className={`pill${resolution === r ? ' active' : ''}`} onClick={() => onResChange(r)}>
            {r < 60 ? `${r} min` : '1 hod'}
          </button>
        ))}
        <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={showDuplicates}
            onChange={e => onToggleDuplicates(e.target.checked)}
            style={{ accentColor: '#FF4D6D', width: 14, height: 14, cursor: 'pointer' }}
          />
          <span style={{ color: showDuplicates ? '#FF4D6D' : 'var(--text2)', transition: 'color var(--dur) var(--ease)' }}>
            Opakované priechody (≥2× na stanici)
          </span>
        </label>
      </div>
      <div style={{ height: 320, position: 'relative' }}><canvas ref={canvasRef} /></div>
    </>
  )
}
