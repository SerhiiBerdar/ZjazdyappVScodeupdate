export default function Header({ recordCount, onOpenMenu, onToggleAI, aiOpen }) {
  const hasData = recordCount > 0

  return (
    <header style={{
      background: 'rgba(10,10,15,0.82)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: 62,
      display: 'flex', alignItems: 'center', gap: 14,
      position: 'sticky', top: 0, zIndex: 100,
    }}>

      {/* Logo */}
      <div style={{
        width: 36, height: 36, flexShrink: 0,
        background: 'var(--accent)',
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
        boxShadow: '0 0 22px var(--accent-glow)',
      }}>🚉</div>

      {/* Title */}
      <div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 21, fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text)',
          lineHeight: 1.1,
        }}>
          Analýza Vytaženosti Zjazdov
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1, letterSpacing: '0.02em' }}>
          Pohyb KLT prepraviek cez stanice v čase
        </div>
      </div>

      {/* Spacer */}
      <div style={{ marginLeft: 'auto' }} />

      {/* Record count badge */}
      <div style={{
        background: hasData ? 'var(--accent-dim)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hasData ? 'rgba(200,255,0,0.3)' : 'var(--border)'}`,
        color: hasData ? 'var(--accent)' : 'var(--text2)',
        fontSize: 11, fontWeight: 600,
        padding: '5px 14px', borderRadius: 20,
        transition: 'all var(--dur) var(--ease)',
        boxShadow: hasData ? '0 0 14px rgba(200,255,0,0.18)' : 'none',
        whiteSpace: 'nowrap',
      }}>
        {hasData ? `${recordCount.toLocaleString('sk')} záznamov` : 'Žiadne dáta'}
      </div>

      {/* AI toggle button */}
      <button
        onClick={onToggleAI}
        title="AI asistent"
        style={{
          background: aiOpen ? 'rgba(10,132,255,0.14)' : 'transparent',
          border: `1px solid ${aiOpen ? 'rgba(10,132,255,0.5)' : 'var(--border2)'}`,
          color: aiOpen ? '#0A84FF' : 'var(--text2)',
          borderRadius: 10,
          cursor: 'pointer',
          padding: '7px 16px',
          fontSize: 13, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 7,
          transition: 'all var(--dur) var(--ease)',
          fontFamily: 'var(--font-body)',
          boxShadow: aiOpen ? '0 0 14px rgba(10,132,255,0.18)' : 'none',
        }}
        onMouseEnter={e => {
          if (aiOpen) return
          const el = e.currentTarget
          el.style.borderColor = 'rgba(10,132,255,0.4)'
          el.style.color = '#0A84FF'
          el.style.background = 'rgba(10,132,255,0.08)'
        }}
        onMouseLeave={e => {
          if (aiOpen) return
          const el = e.currentTarget
          el.style.borderColor = 'var(--border2)'
          el.style.color = 'var(--text2)'
          el.style.background = 'transparent'
        }}
      >
        ✦ AI
      </button>

      {/* Menu button */}
      <button
        onClick={onOpenMenu}
        title="Hlavné menu"
        style={{
          background: 'transparent',
          border: '1px solid var(--border2)',
          color: 'var(--text2)',
          borderRadius: 10,
          cursor: 'pointer',
          padding: '7px 16px',
          fontSize: 13, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 7,
          transition: 'all var(--dur) var(--ease)',
          fontFamily: 'var(--font-body)',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.borderColor = 'rgba(200,255,0,0.45)'
          el.style.color = 'var(--accent)'
          el.style.background = 'var(--accent-dim)'
          el.style.boxShadow = '0 0 14px rgba(200,255,0,0.15)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.borderColor = 'var(--border2)'
          el.style.color = 'var(--text2)'
          el.style.background = 'transparent'
          el.style.boxShadow = 'none'
        }}
      >
        ☰ Menu
      </button>
    </header>
  )
}
