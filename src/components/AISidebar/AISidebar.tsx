import React, { useState, useEffect, useRef } from 'react'
import { useAIChat } from '../../hooks/useAIChat'
import './AISidebar.css'

type DataRecord = { barcode: string; station: string; datetime: Date }
type StationStat = { station: string; count: number }

interface AISidebarProps {
  isOpen: boolean
  allData: DataRecord[]
  stStats: StationStat[]
}

function getTopBarcode(allData: DataRecord[]): string {
  if (!allData.length) return ''
  const counts: Record<string, number> = {}
  allData.forEach(d => { counts[d.barcode] = (counts[d.barcode] || 0) + 1 })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
}

export default function AISidebar({ isOpen, allData, stStats }: AISidebarProps) {
  const { messages, loading, sendMessage, resetChat } = useAIChat(allData, stStats)
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
    if (loading) return
    if (!hasData) return
    sendMessage(text)
  }

  const showChips = messages.length === 0 && !loading

  return (
    <div className={`ai-sidebar${isOpen ? ' ai-sidebar--open' : ''}`}>
      {/* Header */}
      <div className="ai-sidebar__header">
        <span className="ai-sidebar__icon">✦</span>
        <span className="ai-sidebar__title">AI asistent</span>
        <span className="ai-sidebar__dot" title="Online" />
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
            <div className={msg.role === 'user' ? 'user-bubble' : 'ai-bubble'}>
              {msg.content}
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
          ↑
        </button>
      </div>
    </div>
  )
}
