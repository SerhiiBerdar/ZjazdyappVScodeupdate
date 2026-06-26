export default function TabBar({ tabs, active, onChange }) {
  const ICONS = {
    dashboard: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="1" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="8" y="1" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="1" y="8" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="8" y="8" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    ),
    mz: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M1 11V5l3-3h6l3 3v6a1 1 0 01-1 1H2a1 1 0 01-1-1z" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M5 12V8h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
    exp: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="4" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M4 4V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M1 7h12" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    ),
  }

  const LABELS = {
    dashboard: 'Dashboard',
    mz: 'Manuálna zóna',
    exp: 'Expedičná časť',
  }

  return (
    <div style={{
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      position: 'sticky', top: 52, zIndex: 99,
      padding: '0 20px',
      gap: 0,
    }}>
      {tabs.map(t => {
        const isActive = active === t.id
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '13px 18px',
              fontSize: 13, fontWeight: isActive ? 600 : 500,
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: `color var(--duration-fast) var(--ease-apple),
                           border-color var(--duration-fast) var(--ease-apple)`,
              fontFamily: 'var(--font-body)',
              letterSpacing: '-0.1px',
              marginBottom: '-1px',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            <span style={{ color: isActive ? 'var(--accent)' : 'inherit', display: 'flex' }}>
              {ICONS[t.id]}
            </span>
            {LABELS[t.id] || t.label}
          </button>
        )
      })}
    </div>
  )
}
