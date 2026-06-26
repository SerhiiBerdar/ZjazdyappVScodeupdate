export default function Header({ recordCount, onOpenMenu, onToggleAI, aiOpen }) {
  const hasData = recordCount > 0

  const iconBtn = (active) => ({
    background: active ? 'var(--accent-subtle)' : 'transparent',
    border: `1px solid ${active ? 'rgba(10,132,255,0.4)' : 'var(--border)'}`,
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    borderRadius: 'var(--radius-md)',
    width: 40, height: 40,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 15, fontWeight: 500,
    fontFamily: 'var(--font-body)',
    flexShrink: 0,
    transition: `background var(--duration-fast) var(--ease-apple),
                 border-color var(--duration-fast) var(--ease-apple),
                 color var(--duration-fast) var(--ease-apple)`,
  })

  return (
    <header style={{
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '1px solid var(--border)',
      padding: '0 20px',
      height: 52,
      display: 'flex', alignItems: 'center', gap: 12,
      position: 'sticky', top: 0, zIndex: 100,
    }}>

      {/* Logo mark */}
      <div style={{
        width: 28, height: 28, flexShrink: 0,
        background: 'var(--accent)',
        borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14,
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="6" width="12" height="4" rx="1.5" fill="white" opacity="0.9"/>
          <rect x="4" y="2" width="2" height="12" rx="1" fill="white"/>
          <rect x="10" y="2" width="2" height="12" rx="1" fill="white"/>
        </svg>
      </div>

      {/* Title */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 17, fontWeight: 700,
        color: 'var(--text-primary)',
        letterSpacing: '-0.2px',
        whiteSpace: 'nowrap',
      }}>
        ZjazdyApp
      </div>

      {/* Spacer */}
      <div style={{ marginLeft: 'auto' }} />

      {/* Record count badge */}
      <div style={{
        background: hasData ? 'var(--accent-subtle)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${hasData ? 'rgba(10,132,255,0.3)' : 'var(--border)'}`,
        color: hasData ? 'var(--accent)' : 'var(--text-tertiary)',
        fontSize: 12, fontWeight: 500,
        padding: '4px 12px', borderRadius: 20,
        whiteSpace: 'nowrap',
        transition: 'all var(--duration-base) var(--ease-apple)',
      }}>
        {hasData ? `${recordCount.toLocaleString('sk')} záznamov` : 'Žiadne dáta'}
      </div>

      {/* AI toggle */}
      <button
        onClick={onToggleAI}
        title="AI asistent"
        style={iconBtn(aiOpen)}
        onMouseEnter={e => {
          if (!aiOpen) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }
        }}
        onMouseLeave={e => {
          if (!aiOpen) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M5.5 9.5C5.5 9.5 6.5 11 8 11C9.5 11 10.5 9.5 10.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="6" cy="7" r="1" fill="currentColor"/>
          <circle cx="10" cy="7" r="1" fill="currentColor"/>
        </svg>
      </button>

      {/* Menu button */}
      <button
        onClick={onOpenMenu}
        title="Hlavné menu"
        style={iconBtn(false)}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.color = 'var(--text-primary)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </header>
  )
}
