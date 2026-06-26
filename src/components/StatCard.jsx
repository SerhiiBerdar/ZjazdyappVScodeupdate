const ACCENT_COLORS = [
  'var(--accent)',      /* blue  */
  'var(--success)',     /* green */
  'var(--warning)',     /* orange*/
  'var(--danger)',      /* red   */
]
const BG_COLORS = [
  'rgba(10,132,255,0.10)',
  'rgba(48,209,88,0.10)',
  'rgba(255,159,10,0.10)',
  'rgba(255,69,58,0.10)',
]

export default function StatCard({ label, value, sub, accent }) {
  const idx = typeof accent === 'number' ? accent : 0
  const aColor = ACCENT_COLORS[idx] ?? ACCENT_COLORS[0]
  const aBg    = BG_COLORS[idx]    ?? BG_COLORS[0]

  return (
    <div
      className="card"
      style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}
    >
      {/* Top accent stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: aColor,
        borderRadius: '16px 16px 0 0',
      }} />

      {/* Icon chip */}
      <div style={{
        width: 36, height: 36, borderRadius: 'var(--radius-sm)',
        background: aBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
      }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: aColor }} />
      </div>

      <div style={{
        fontSize: 11, fontWeight: 600,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        marginBottom: 8,
      }}>
        {label}
      </div>

      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 36, fontWeight: 700,
        color: 'var(--text-primary)',
        letterSpacing: '-0.5px',
        lineHeight: 1,
      }}>
        {value}
      </div>

      {sub && (
        <div style={{
          fontSize: 12, color: 'var(--text-tertiary)',
          marginTop: 6, letterSpacing: '0.1px',
        }}>
          {sub}
        </div>
      )}
    </div>
  )
}
