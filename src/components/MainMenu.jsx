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
  dashboard: '📊 Dashboard',
  mz:        '🏭 Manuálna zóna',
  exp:       '📦 Expedičná časť',
}

const FAQ_SECTIONS = [
  {
    icon: '📥',
    title: 'Vkladanie dát',
    items: [
      {
        sub: 'Ako vložiť dáta',
        text: 'Skopírujte dáta priamo z Microsoft Excel (Ctrl+C) a vložte ich do sivého textového poľa na Dashboarde (Ctrl+V). Dáta musia byť v tvare troch stĺpcov oddelených tabulátorom: Čiarový kód KLT | Kód stanice | Dátum a čas.',
      },
      {
        sub: 'Formát dátumu',
        text: 'Systém akceptuje štandardný slovenský formát dátumu a času (napr. 1.1.2024 8:30:00). Záznamy s neplatným formátom sú automaticky preskočené a ich počet je zobrazený vedľa hlásenia.',
      },
      {
        sub: 'Tlačidlo Načítať / Vymazať',
        text: 'Po vložení textu stlačte "Načítať dáta". Počet úspešne spracovaných záznamov sa zobrazí hneď pod poľom. Tlačidlo "Vymazať" odstráni všetky dáta z pamäte a vynuluje všetky grafy.',
      },
    ],
  },
  {
    icon: '🔍',
    title: 'Filtre',
    items: [
      {
        sub: 'Filter: Čiarový kód (KLT)',
        text: 'Textové pole – zadajte časť alebo celý čiarový kód KLT prepravky. Systém filtruje záznamy obsahujúce zadaný text (nie je citlivé na veľkosť písmen).',
      },
      {
        sub: 'Filter: Stanica',
        text: 'Rozbaľovací zoznam – vyberte konkrétnu stanicu. Výber "Všetky stanice" zobrazuje záznamy zo všetkých staníc naraz.',
      },
      {
        sub: 'Filter: Hodina',
        text: 'Rozbaľovací zoznam – obmedzí záznamy na konkrétnu hodinu dňa (0–23). Výber "Všetky hodiny" neobmedzuje časový rozsah.',
      },
      {
        sub: 'Resetovanie filtrov',
        text: 'Tlačidlo "Resetovať" vráti všetky filtre do predvoleného stavu a zobrazí všetky dáta.',
      },
    ],
  },
  {
    icon: '📊',
    title: 'Štatistické karty',
    items: [
      {
        sub: 'Celkový počet záznamov',
        text: 'Počet riadkov prešlých cez aktuálny filter. Každý záznam = jeden prechod KLT cez stanicu.',
      },
      {
        sub: 'Unikátne KLT',
        text: 'Počet jedinečných čiarových kódov KLT prepraviek vo filtrovaných dátach.',
      },
      {
        sub: 'Aktívne stanice',
        text: 'Počet staníc, cez ktoré prešlo aspoň jedno KLT v rámci filtrovaného výberu.',
      },
      {
        sub: 'Špičková hodina',
        text: 'Hodina dňa s najvyšším počtom pohybov KLT – ukazuje, kedy je prevádzka najvyťaženejšia.',
      },
    ],
  },
  {
    icon: '📈',
    title: 'Graf časovej osi (Timeline)',
    items: [
      {
        sub: 'Čo zobrazuje',
        text: 'Graf zobrazujúci počet pohybov KLT v čase. Os X = čas, os Y = počet záznamov v danom intervale.',
      },
      {
        sub: 'Rozlíšenie (Granularita)',
        text: 'Prepínačmi meníte interval časových úsekov: 15 min, 30 min, 1 hod, 2 hod, 4 hod. Jemnejšie rozlíšenie odhaľuje krátkodobé výkyvy, hrubšie dáva celkový trend.',
      },
    ],
  },
  {
    icon: '🏆',
    title: 'Top stanice',
    items: [
      {
        sub: 'Čo zobrazuje',
        text: 'Horizontálny stĺpcový graf N najvyťaženejších staníc zoradených podľa celkového počtu pohybov KLT. Dĺžka stĺpca = relatívna vyťaženosť.',
      },
      {
        sub: 'Kliknutie na stanicu',
        text: 'Kliknutím na stĺpec v grafe nastavíte filter na danú stanicu a zobrazí sa jej detail nižšie.',
      },
    ],
  },
  {
    icon: '🔬',
    title: 'Detail stanice',
    items: [
      {
        sub: 'Čo zobrazuje',
        text: 'Po výbere konkrétnej stanice (filtrom alebo kliknutím v Top stanice) sa zobrazí detailný graf pohybov pre danú stanicu.',
      },
      {
        sub: 'Prepínanie: Hodiny / Dni',
        text: 'Graf možno prepnúť medzi hodinovým zobrazením (rozloženie počas dňa) a denným zobrazením (trend cez viac dní).',
      },
    ],
  },
  {
    icon: '🗺️',
    title: 'Heatmapa',
    items: [
      {
        sub: 'Čo zobrazuje',
        text: 'Mriežka zobrazujúca intenzitu pohybov podľa stanice a hodiny dňa. Riadky = stanice, stĺpce = hodiny (0–23). Intenzívnejšia farba = viac pohybov.',
      },
      {
        sub: 'Čítanie heatmapy',
        text: 'Bunka v riadku stanice "X" a stĺpci "8" zobrazuje počet pohybov cez stanicu X medzi 8:00 a 9:00.',
      },
    ],
  },
  {
    icon: '🔀',
    title: 'Flow graf (Sankey)',
    items: [
      {
        sub: 'Čo zobrazuje',
        text: 'Diagram tokov zobrazujúci, ako KLT prepravky putujú medzi stanicami. Každý uzol = stanica, každá šípka = smer pohybu. Hrúbka šípky = počet prechodov.',
      },
      {
        sub: 'Ako čítať diagram',
        text: 'Šípka A→B znamená, že KLT prešli zo stanice A na stanicu B. Čím hrubšia šípka, tým viac prechodov medzi danými stanicami.',
      },
    ],
  },
  {
    icon: '🔎',
    title: 'KLT Trace (Sledovanie prepravky)',
    items: [
      {
        sub: 'Čo to je',
        text: 'Nástroj na sledovanie celej cesty konkrétnej KLT prepravky. Zadajte čiarový kód do filtra a sekcia zobrazí zoradenú históriu prechodov: stanica → čas príchodu.',
      },
      {
        sub: 'Ako použiť',
        text: 'Zadajte čiarový kód do filtra "Čiarový kód". KLT Trace automaticky zobrazí všetky pohyby danej prepravky v chronologickom poradí.',
      },
    ],
  },
  {
    icon: '📋',
    title: 'Tabuľka staníc',
    items: [
      {
        sub: 'Čo zobrazuje',
        text: 'Prehľadná tabuľka všetkých aktívnych staníc so štatistikami: celkový počet pohybov, počet unikátnych KLT, čas prvého a posledného pohybu.',
      },
      {
        sub: 'Triedenie',
        text: 'Kliknutím na hlavičku stĺpca zoradíte tabuľku podľa daného atribútu (vzostupne / zostupne – opakovaným kliknutím sa smer zmení).',
      },
    ],
  },
  {
    icon: '🏭',
    title: 'Manuálna zóna (MZ Layout)',
    items: [
      {
        sub: 'Čo je to',
        text: 'Interaktívna mapa podlahy manuálnej zóny skladu. Stanice sú zobrazené na skutočných pozíciách a farebne označené podľa vyťaženosti.',
      },
      {
        sub: 'Typy staníc',
        text: 'D = Divertor (preraďovač), S = Stanica (spracovanie), X = Stacker (stohovač). Každý typ má odlišnú farbu v legende.',
      },
      {
        sub: 'Kliknutie na stanicu',
        text: 'Kliknutím na stanicu v mape sa otvorí popup s detailným hodinovým grafom aktivity pre danú stanicu.',
      },
      {
        sub: 'Heatmapa farieb',
        text: 'Intenzita farby odráža relatívnu vyťaženosť stanice. Sivá/tmavá = nízka alebo žiadna aktivita, jasná/intenzívna = vysoká aktivita.',
      },
    ],
  },
  {
    icon: '📦',
    title: 'Expedičná časť (Exp Layout)',
    items: [
      {
        sub: 'Čo je to',
        text: 'Interaktívna mapa expedičnej časti skladu so sortermi a výstupnými linkami (L01A–L57). Podporuje pokročilé ovládanie pohľadu.',
      },
      {
        sub: 'Zoom (priblíženie)',
        text: 'Použite Ctrl + koliesko myši na priblíženie/oddialenie. Tlačidlá "+" a "−" v paneli tiež menia zoom. Rozsah: 5 % – 500 %.',
      },
      {
        sub: 'Posúvanie (Pan)',
        text: 'Podržte ľavé tlačidlo myši a ťahajte na posúvanie mapy. Mapa sa pohybuje podľa kurzora.',
      },
      {
        sub: 'Celá obrazovka (Fullscreen)',
        text: 'Tlačidlo fullscreen roztiahne mapu na celú obrazovku pre lepší prehľad. Stlačte znova alebo Esc pre návrat do normálneho zobrazenia.',
      },
      {
        sub: 'Resetovanie pohľadu',
        text: 'Tlačidlo resetovania vráti zoom a pozíciu na predvolené hodnoty (100 %, stred).',
      },
      {
        sub: 'Kliknutie na stanicu',
        text: 'Rovnako ako v manuálnej zóne – kliknutím na stanicu sa otvorí detail s hodinovým grafom aktivity.',
      },
    ],
  },
]

// ─── Main export ─────────────────────────────────────────────────────────────

export default function MainMenu({ onClose }) {
  const [section, setSection]     = useState('faq')
  const [expandedIdx, setExpanded] = useState(null)

  // Admin state
  const [adminAuth, setAdminAuth] = useState(false)
  const [pw, setPw]               = useState('')
  const [pwErr, setPwErr]         = useState(false)
  const [events, setEvents]       = useState([])

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
      style={overlayStyle}
      onClick={onClose}
    >
      <div
        style={panelStyle}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={headerStyle}>
          <span style={{ fontSize: 18 }}>☰</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Hlavné menu</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button style={tabBtn(section === 'faq')}   onClick={() => setSection('faq')}>
              📖 FAQ
            </button>
            <button style={tabBtn(section === 'admin')} onClick={() => setSection('admin')}>
              🔐 Admin panel
            </button>
          </div>
          <button
            style={closeStyle}
            onClick={onClose}
            title="Zavrieť"
            onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >✕</button>
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
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

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function FAQView({ expanded, setExpanded }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 8 }}>
        Návod na použitie aplikácie – popis všetkých funkcií a nastavení.
      </p>
      {FAQ_SECTIONS.map((sec, i) => (
        <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            style={accordionHead(expanded === i)}
          >
            <span style={{ fontSize: 17 }}>{sec.icon}</span>
            <span style={{ flex: 1, textAlign: 'left' }}>{sec.title}</span>
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>{expanded === i ? '▲' : '▼'}</span>
          </button>
          {expanded === i && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)', background: 'var(--panel2)' }}>
              {sec.items.map((item, j) => (
                <div key={j} style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent4)', marginBottom: 4 }}>
                    {item.sub}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>
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

// ─── Admin login ──────────────────────────────────────────────────────────────

function AdminLogin({ pw, setPw, pwErr, onSubmit }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 16 }}>
      <div style={{ fontSize: 52 }}>🔐</div>
      <div style={{ fontWeight: 700, fontSize: 18 }}>Admin Panel</div>
      <div style={{ color: 'var(--text2)', fontSize: 13 }}>Zadajte administrátorské heslo pre prístup</div>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 280 }}>
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          placeholder="Heslo..."
          autoFocus
          style={{
            padding: '11px 14px', fontSize: 14, borderRadius: 8, textAlign: 'center',
            border: `1px solid ${pwErr ? '#f78166' : 'var(--border)'}`,
            background: 'var(--bg)', color: 'var(--text)', transition: 'border-color .2s',
            outline: 'none',
          }}
        />
        {pwErr && (
          <div style={{ color: '#f78166', fontSize: 12, textAlign: 'center' }}>❌ Nesprávne heslo</div>
        )}
        <button
          type="submit"
          style={{
            padding: '11px', background: 'var(--accent)', color: '#0d1117',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14,
          }}
        >
          Prihlásiť sa
        </button>
      </form>
    </div>
  )
}

// ─── Admin view ───────────────────────────────────────────────────────────────

function AdminView({ events, onClear }) {
  const sessions   = events.filter(e => e.type === 'session_start').length
  const dataLoads  = events.filter(e => e.type === 'data_loaded').length
  const tabChanges = events.filter(e => e.type === 'tab_changed').length

  return (
    <div>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>📊 Štatistiky používania</div>
        <button
          onClick={onClear}
          style={{
            marginLeft: 'auto', padding: '6px 14px', fontSize: 12, borderRadius: 7, cursor: 'pointer',
            background: 'rgba(247,129,102,.12)', border: '1px solid rgba(247,129,102,.4)', color: '#f78166',
          }}
        >🗑️ Vymazať log</button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Spustení aplikácie', value: sessions,   icon: '🚀' },
          { label: 'Načítaní dát',        value: dataLoads,  icon: '📥' },
          { label: 'Prepnutí záložiek',   value: tabChanges, icon: '🔀' },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{
            background: 'var(--panel2)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '14px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Info note */}
      <div style={{
        background: 'rgba(88,166,255,.08)', border: '1px solid rgba(88,166,255,.2)',
        borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--text2)', marginBottom: 16,
      }}>
        ℹ️ Dáta sú ukladané lokálne v prehliadači (localStorage) – zobrazujú aktivitu na tomto zariadení.
      </div>

      {/* Events table */}
      {events.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text2)', padding: 40, fontSize: 13 }}>
          Žiadne záznamy v histórii
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--panel2)' }}>
                {['Čas', 'Udalosť', 'Detail'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) => (
                <tr
                  key={i}
                  style={{ borderTop: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--panel2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={tdStyle}>{new Date(ev.ts).toLocaleString('sk')}</td>
                  <td style={tdStyle}>{EVENT_LABELS[ev.type] || ev.type}</td>
                  <td style={{ ...tdStyle, color: 'var(--text2)' }}>{formatDetail(ev)}</td>
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
  if (ev.type === 'data_loaded')  return `${ev.count?.toLocaleString('sk') ?? '?'} záznamov`
  if (ev.type === 'tab_changed')  return TAB_LABELS[ev.tab] || ev.tab
  return ''
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 1000,
  background: 'rgba(0,0,0,0.75)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const panelStyle = {
  width: 760, maxWidth: '96vw', maxHeight: '88vh',
  background: 'var(--panel)', border: '1px solid var(--border)',
  borderRadius: 14, display: 'flex', flexDirection: 'column',
  overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
}

const headerStyle = {
  padding: '14px 20px', borderBottom: '1px solid var(--border)',
  display: 'flex', alignItems: 'center', gap: 10,
  background: 'var(--panel2)', flexShrink: 0,
}

const closeStyle = {
  marginLeft: 8, background: 'transparent', border: 'none',
  color: 'var(--text2)', fontSize: 17, cursor: 'pointer',
  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: 6, transition: 'background .15s',
}

function tabBtn(active) {
  return {
    padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    background: active ? 'rgba(88,166,255,.15)' : 'transparent',
    border: `1px solid ${active ? 'rgba(88,166,255,.5)' : 'var(--border)'}`,
    color: active ? 'var(--accent)' : 'var(--text2)',
    borderRadius: 8, transition: 'all .15s',
  }
}

function accordionHead(active) {
  return {
    width: '100%', padding: '13px 16px',
    background: active ? 'var(--panel2)' : 'transparent',
    border: 'none', cursor: 'pointer', color: 'var(--text)',
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 14, fontWeight: 600, transition: 'background .15s',
  }
}

const thStyle = {
  padding: '10px 14px', textAlign: 'left', fontWeight: 600,
  color: 'var(--text2)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
}

const tdStyle = { padding: '9px 14px', color: 'var(--text)' }
