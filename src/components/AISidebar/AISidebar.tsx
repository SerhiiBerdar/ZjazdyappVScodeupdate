import React, { useState, useEffect, useRef } from 'react'
import { useAIChat } from '../../hooks/useAIChat'
import './AISidebar.css'

type DataRecord = { barcode: string; station: string; datetime: Date }
type StationStat = { station: string; count: number }

interface AISidebarProps {
  isOpen: boolean
  onClose: () => void
  allData: DataRecord[]
  stStats: StationStat[]
}

function getTopBarcode(allData: DataRecord[]): string {
  if (!allData.length) return ''
  const counts: Record<string, number> = {}
  allData.forEach(d => { counts[d.barcode] = (counts[d.barcode] || 0) + 1 })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
}

export default function AISidebar({ isOpen, onClose, allData, stStats }: AISidebarProps) {
  const { messages, loading, sendMessage, resetChat, retryLast } = useAIChat(allData, stStats)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevDataLenRef = useRef(allData.length)

  const hasData = allData.length > 0
  const topBarcode = getTopBarcode(allData)
  const uniqueStations = new Set(allData.map(d => d.station)).size

  const greeting = hasData
    ? `Zdravím! Analyzujem ${allData.length.toLocaleString('sk')} záznamov z ${uniqueStations} staníc. Na čo sa chcete opýtať?`
    : 'Zdravím! Žiadne dáta nie sú načítané. Načítajte dáta z Excelu a potom sa ma opýtajte čokoľvek.'

  const suggestions = hasData
    ? [
        'Ktorá stanica má najviac priechodov?',
        topBarcode ? `Ukáž pohyb vagóna ${topBarcode}` : 'Aké vagóny sú najaktívnejšie?',
        'Koľko záznamov je z posledného dňa?',
      ]
    : ['Najprv načítajte dáta.']

  /* reset chat when data set changes */
  useEffect(() => {
    if (prevDataLenRef.current !== allData.length) {
      prevDataLenRef.current = allData.length
      resetChat()
    }
  }, [allData.length, resetChat])

  /* auto-scroll on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  /* focus input when sidebar opens */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 260)
    }
  }, [isOpen])

  function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    sendMessage(text)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleChip(text: string) {
    if (loading || !hasData) return
    sendMessage(text)
  }

  const showChips = messages.length === 0 && !loading

  return (
    <div className={`ai-sidebar${isOpen ? ' ai-sidebar--open' : ''}`}>

      {/* Header */}
      <div className="ai-sidebar__header">
        <span className="ai-sidebar__icon" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M4 7C4 7 4.8 8.5 6 8.5C7.2 8.5 8 7 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="4.5" cy="5" r="0.75" fill="currentColor"/>
            <circle cx="7.5" cy="5" r="0.75" fill="currentColor"/>
          </svg>
        </span>
        <span className="ai-sidebar__title">AI asistent</span>
        <span className="ai-sidebar__dot" title="Online" />
        <button
          className="ai-sidebar__close"
          onClick={onClose}
          title="Zavrieť"
          aria-label="Zavrieť AI asistenta"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Messages area */}
      <div className="ai-sidebar__messages">

        {/* Static greeting bubble */}
        <div className="ai-sidebar__msg">
          <div className="ai-bubble">{greeting}</div>
        </div>

        {/* Conversation messages */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`ai-sidebar__msg${msg.role === 'user' ? ' ai-sidebar__msg--user' : ''}`}
          >
            <div className={msg.role === 'user' ? 'user-bubble' : `ai-bubble${msg.isError ? ' ai-bubble--error' : ''}`}>
              {msg.content}
              {msg.isError && (
                <button
                  className="ai-retry-btn"
                  onClick={retryLast}
                  disabled={loading}
                  title="Skúsiť znova"
                >
                  ↺ Skúsiť znova
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="ai-sidebar__msg">
            <div className="ai-bubble ai-bubble--typing">
              <span className="ai-dot" />
              <span className="ai-dot" />
              <span className="ai-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips */}
      {showChips && (
        <div className="ai-sidebar__chips">
          {suggestions.map((s, i) => (
            <button
              key={i}
              className="ai-chip"
              onClick={() => handleChip(s)}
              disabled={!hasData || loading}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="ai-sidebar__input-area">
        <input
          ref={inputRef}
          type="text"
          className="ai-sidebar__input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Napíšte otázku..."
          disabled={loading}
        />
        <button
          className="ai-sidebar__send"
          onClick={handleSend}
          disabled={!input.trim() || loading}
          title="Odoslať"
          aria-label="Odoslať"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 11V3M3 7l4-4 4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
