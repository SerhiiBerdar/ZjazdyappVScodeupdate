import { useState } from 'react'
import { readEvents, clearAllEvents } from '../utils/usageTracker'

const ADMIN_PASSWORD = 'ADMINISTRATOR1'

const EVENT_LABELS = {
  session_start: 'Spustenie aplikácie',
  data_loaded:   'Načítanie dát',
  data_cleared:  'Vymazanie dát',
  tab_changed:   'Prepnutie záložky',
}

const TAB_LABELS = {
  dashboard: 'Dashboard',
  mz:        'Manuálna zóna',
  exp:       'Expedičná časť',
}

const FAQ_SECTIONS = [
  {
    title: 'Vkladanie dát',
    items: [
      { sub: 'Ako vložiť dáta', text: 'Skopírujte dáta priamo z Microsoft Excel (Ctrl+C) a vložte ich do textového poľa na Dashboarde (Ctrl+V). Dáta musia byť v tvare troch stĺpcov oddelených tabulátorom: Čiarový kód KLT | Kód stanice | Dátum a čas.' },
      { sub: 'Formát dátumu', text: 'Systém akceptuje štandardný slovenský formát dátumu a času (napr. 1.1.2024 8:30:00). Záznamy s neplatným formátom sú automaticky preskočené.' },
      { sub: 'Tlačidlá Načítať / Vymazať', text: 'Po vložení textu stlačte "Analyzovať". Počet spracovaných záznamov sa zobrazí hneď pod poľom. "Vymazať" odstráni všetky dáta z pamäte.' },
    ],
  },
  {
    title: 'Filtre',
    items: [
      { sub: 'Čiarový kód', text: 'Zadajte časť alebo celý čiarový kód KLT. Systém filtruje záznamy obsahujúce zadaný text.' },
      { sub: 'Stanica', text: 'Rozbaľovací zoznam — vyberte konkrétnu stanicu. "Všetky stanice" zobrazuje záznamy zo všetkých staníc.' },
      { sub: 'Hodina', text: 'Obmedzí záznamy na konkrétnu hodinu dňa (0–23). "Všetky hodiny" neobmedzuje časový rozsah.' },
    ],
  },
  {
    title: 'Štatistické karty',
    items: [
      { sub: 'Celkový počet záznamov', text: 'Počet riadkov prešlých cez aktuálny filter. Každý záznam = jeden prechod KLT cez stanicu.' },
      { sub: 'Unikátne KLT', text: 'Počet jedinečných čiarových kódov KLT prepraviek vo filtrovaných dátach.' },
      { sub: 'Aktívne stanice', text: 'Počet staníc, cez ktoré prešlo aspoň jedno KLT v rámci filtrovaného výberu.' },
      { sub: 'Špičková hodina', text: 'Hodina dňa s najvyšším počtom pohybov KLT.' },
    ],
  },
  {
    title: 'Graf časovej osi',
    items: [
      { sub: 'Čo zobrazuje', text: 'Graf zobrazujúci počet pohybov KLT v čase. Os X = čas, os Y = počet záznamov v intervale.' },
      { sub: 'Granularita', text: 'Prepínačmi meníte interval: 15 min, 30 min, 1 hod, 2 hod, 4 hod.' },
    ],
  },
  {
    title: 'Top stanice',
    items: [
      { sub: 'Čo zobrazuje', text: 'Horizontálny stĺpcový graf N najvyťaženejších staníc zoradených podľa počtu pohybov.' },
      { sub: 'Kliknutie', text: 'Kliknutím na stĺpec nastavíte filter na danú stanicu.' },
    ],
  },
  {
    title: 'Heatmapa',
    items: [
      { sub: 'Čo zobrazuje', text: 'Mriežka zobrazujúca intenzitu pohybov podľa stanice a hodiny dňa. Riadky = stanice, stĺpce = hodiny (0–23).' },
    ],
  },
  {
    title: 'Flow graf',
    items: [
      { sub: 'Čo zobrazuje', text: 'Diagram tokov zobrazujúci, ako KLT prepravky putujú medzi stanicami. Hrúbka šípky = počet prechodov.' },
    ],
  },
  {
    title: 'KLT Trace',
    items: [
      { sub: 'Čo to je', text: 'Nástroj na sledovanie celej cesty konkrétnej KLT prepravky. Zobrazí zoradenú históriu prechodov v chronologickom poradí.' },
    ],
  },
  {
    title: 'Manuálna zóna',
    items: [
      { sub: 'Čo je to', text: 'Interaktívna mapa podlahy manuálnej zóny. Stanice sú farebne označené podľa vyťaženosti. Kliknutím sa otvorí detail.' },
    ],
  },
  {
    title: 'Expedičná časť',
    items: [
      { sub: 'Ovládanie', text: 'Ctrl + koliesko = zoom. Ľavé tlačidlo + ťahanie = posúvanie. Tlačidlo fullscreen = celá obrazovka.' },
    ],
  },
]

export default function MainMenu({ onClose }) {
  const [section, setSection]      = useState('faq')
  const [expandedIdx, setExpanded] = useState(null)
  const [adminAuth, setAdminAuth]  = useState(false)
  const [pw, setPw]                = useState('')
  const [pwErr, setPwErr]          = useState(false)
  const [events, setEvents]        = useState([])

  function handleLogin(e) {
    e.preventDefault()
    if (pw === ADMIN_PASSWORD) {
      setAdminAuth(true)
      setEvents([...readEvents()].reverse())
    } else {
      setPwErr(true)
      setPw('')
      setTimeout(() => setPwErr(false), 2000)
    }
  }

  function handleClearLog() {
    if (!window.confirm('Naozaj vymazať celú históriu používania?')) return
    clearAllEvents()
    setEvents([])
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 720, maxWidth: '94vw', maxHeight: '86vh',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: 17, fontWeight: 700,
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.2px',
          }}>Hlavné menu</span>

          {/* Section tabs */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {[
              { id: 'faq',   label: 'FAQ' },
              { id: 'admin', label: 'Admin' },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                style={{
                  padding: '6px 16px',
                  fontSize: 13, fontWeight: 500,
                  cursor: 'pointer',
                  background: section === s.id ? 'var(--accent-subtle)' : 'transparent',
                  border: `1px solid ${section === s.id ? 'rgba(10,132,255,0.35)' : 'var(--border)'}`,
                  color: section === s.id ? 'var(--accent)' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-body)',
                  transition: 'all var(--duration-fast) var(--ease-apple)',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            title="Zavrieť"
            style={{
              width: 28, height: 28, marginLeft: 4,
              background: 'transparent', border: 'none',
              color: 'var(--text-tertiary)', fontSize: 14,
              cursor: 'pointer', borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background var(--duration-fast) var(--ease-apple), color var(--duration-fast)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-tertiary)'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px', scrollbarWidth: 'none' }}>
          {section === 'faq' && (
            <FAQView expanded={expandedIdx} setExpanded={setExpanded} />
          )}
          {section === 'admin' && (adminAuth
            ? <AdminView events={events} onClear={handleClearLog} />
            : <AdminLogin pw={pw} setPw={setPw} pwErr={pwErr} onSubmit={handleLogin} />
          )}
        </div>
      </div>
    </div>
  )
}

function FAQView({ expanded, setExpanded }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
        Návod na použitie aplikácie — popis všetkých funkcií.
      </p>
      {FAQ_SECTIONS.map((sec, i) => (
        <div key={i} style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}>
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            style={{
              width: '100%', padding: '13px 16px',
              background: expanded === i ? 'rgba(255,255,255,0.03)' : 'transparent',
              border: 'none', cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 14, fontWeight: 600,
              fontFamily: 'var(--font-body)',
              transition: 'background var(--duration-fast)',
              textAlign: 'left',
            }}
          >
            <span style={{ flex: 1 }}>{sec.title}</span>
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none"
              style={{
                color: 'var(--text-secondary)',
                transform: expanded === i ? 'rotate(180deg)' : 'none',
                transition: 'transform var(--duration-fast) var(--ease-apple)',
              }}
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {expanded === i && (
            <div style={{
              padding: '0 16px 16px',
              borderTop: '1px solid var(--border)',
              background: 'rgba(0,0,0,0.15)',
            }}>
              {sec.items.map((item, j) => (
                <div key={j} style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent)', marginBottom: 4 }}>
                    {item.sub}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function AdminLogin({ pw, setPw, pwErr, onSubmit }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 16 }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="11" width="18" height="11" rx="2" stroke="var(--text-secondary)" strokeWidth="1.5"/>
          <path d="M7 11V7a5 5 0 0110 0v4" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="12" cy="16" r="1.5" fill="var(--text-secondary)"/>
        </svg>
      </div>

      <div style={{ fontWeight: 700, fontSize: 20, fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>
        Admin Panel
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
        Zadajte administrátorské heslo
      </div>

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 280 }}>
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          placeholder="Heslo..."
          autoFocus
          style={{
            width: '100%',
            background: `rgba(255,255,255,0.06)`,
            border: `1px solid ${pwErr ? 'var(--danger)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: 15, padding: '10px 14px',
            fontFamily: 'var(--font-body)',
            outline: 'none',
            textAlign: 'center',
            transition: 'border-color var(--duration-fast)',
          }}
        />
        {pwErr && (
          <div style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center' }}>
            Nesprávne heslo
          </div>
        )}
        <button type="submit" className="btn" style={{ justifyContent: 'center' }}>
          Prihlásiť sa
        </button>
      </form>
    </div>
  )
}

function AdminView({ events, onClear }) {
  const sessions   = events.filter(e => e.type === 'session_start').length
  const dataLoads  = events.filter(e => e.type === 'data_loaded').length
  const tabChanges = events.filter(e => e.type === 'tab_changed').length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 17, fontFamily: 'var(--font-display)', letterSpacing: '-0.2px' }}>
          Štatistiky používania
        </div>
        <button
          onClick={onClear}
          className="btn-danger"
          style={{ marginLeft: 'auto', fontSize: 13, padding: '6px 14px' }}
        >
          Vymazať log
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Spustení', value: sessions },
          { label: 'Načítaní dát', value: dataLoads },
          { label: 'Záložiek', value: tabChanges },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 30, fontWeight: 700, fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)', letterSpacing: '-0.5px',
            }}>
              {value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'var(--accent-subtle)',
        border: '1px solid rgba(10,132,255,0.2)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 14px',
        fontSize: 13, color: 'var(--text-secondary)',
        marginBottom: 16,
      }}>
        Dáta sú ukladané lokálne v prehliadači (localStorage).
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 40, fontSize: 14 }}>
          Žiadne záznamy v histórii
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['Čas', 'Udalosť', 'Detail'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontWeight: 600, fontSize: 11,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.7px',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) => (
                <tr
                  key={i}
                  style={{ borderTop: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '10px 16px', color: 'var(--text-primary)', fontSize: 13 }}>
                    {new Date(ev.ts).toLocaleString('sk')}
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-primary)', fontSize: 13 }}>
                    {EVENT_LABELS[ev.type] || ev.type}
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontSize: 13 }}>
                    {formatDetail(ev)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function formatDetail(ev) {
  if (ev.type === 'data_loaded') return `${ev.count?.toLocaleString('sk') ?? '?'} záznamov`
  if (ev.type === 'tab_changed') return TAB_LABELS[ev.tab] || ev.tab
  return ''
}
