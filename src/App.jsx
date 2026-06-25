import React, { useState, useCallback, useEffect } from 'react'
import { parseData, buildStationStats, buildFlowPairs } from './utils/parser'
import { logEvent } from './utils/usageTracker'
import Header from './components/Header'
import TabBar from './components/TabBar'
import Dashboard from './components/Dashboard'
import MZLayout from './components/MZLayout'
import ExpLayout from './components/ExpLayout'
import MainMenu from './components/MainMenu'
import AISidebar from './components/AISidebar/AISidebar'

const TABS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'mz',        label: '🏭 Manuálna zóna' },
  { id: 'exp',       label: '📦 Expedičná časť' },
]

export default function App() {
  const [tab, setTab]               = useState('dashboard')
  const [allData, setAllData]       = useState([])
  const [stStats, setStStats]       = useState([])
  const [flowData, setFlowData]     = useState({ pairs: {}, kltStations: {} })
  const [parseStatus, setParseStatus] = useState({ msg: '', ok: true })
  const [menuOpen, setMenuOpen]     = useState(false)
  const [aiOpen, setAiOpen]         = useState(false)

  useEffect(() => { logEvent('session_start') }, [])

  // Recalculate derived stats whenever allData changes
  useEffect(() => {
    if (allData.length === 0) {
      setStStats([])
      setFlowData({ pairs: {}, kltStations: {} })
      return
    }
    setStStats(buildStationStats(allData))
    setFlowData(buildFlowPairs(allData))
  }, [allData])

  const handleTabChange = useCallback((newTab) => {
    logEvent('tab_changed', { tab: newTab })
    setTab(newTab)
  }, [])

  const handleParse = useCallback((raw) => {
    const { records, skipped } = parseData(raw)
    if (!records.length) {
      setParseStatus({ msg: '❌ Žiadne platné záznamy. Skopírujte priamo z Excelu (tab-oddelené).', ok: false })
      return
    }
    setAllData(records)
    setParseStatus({ msg: `✓ Načítaných ${records.length.toLocaleString('sk')} záznamov${skipped ? ` · preskočených: ${skipped}` : ''}`, ok: true })
    logEvent('data_loaded', { count: records.length })
  }, [])

  const handleClear = useCallback(() => {
    setAllData([])
    setParseStatus({ msg: '', ok: true })
    logEvent('data_cleared')
  }, [])

  const handleAddRecord = useCallback((record) => {
    setAllData(prev => [record, ...prev])
    setParseStatus({ msg: '✓ Záznam pridaný', ok: true })
    logEvent('record_added_manual')
  }, [])

  const handleImportRecords = useCallback((records, mode) => {
    if (mode === 'replace') {
      setAllData(records)
    } else {
      setAllData(prev => [...records, ...prev])
    }
    setParseStatus({
      msg: `✓ ${mode === 'replace' ? 'Importovaných' : 'Pridaných'} ${records.length.toLocaleString('sk')} záznamov`,
      ok: true,
    })
    logEvent('data_imported', { count: records.length, mode })
  }, [])

  return (
    <>
      <Header
        recordCount={allData.length}
        onOpenMenu={() => setMenuOpen(true)}
        onToggleAI={() => setAiOpen(o => !o)}
        aiOpen={aiOpen}
      />
      <TabBar tabs={TABS} active={tab} onChange={handleTabChange} />
      {menuOpen && <MainMenu onClose={() => setMenuOpen(false)} />}

      {tab === 'dashboard' && (
        <Dashboard
          allData={allData}
          stStats={stStats}
          flowData={flowData}
          parseStatus={parseStatus}
          onParse={handleParse}
          onClear={handleClear}
          onAddRecord={handleAddRecord}
          onImportRecords={handleImportRecords}
        />
      )}
      {tab === 'mz' && (
        <MZLayout allData={allData} stStats={stStats} />
      )}
      {tab === 'exp' && (
        <ExpLayout allData={allData} stStats={stStats} />
      )}

      <AISidebar isOpen={aiOpen} allData={allData} stStats={stStats} />
    </>
  )
}
