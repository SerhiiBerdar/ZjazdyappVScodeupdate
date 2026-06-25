import { useState, useCallback, useRef } from 'react'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  isError?: boolean
}

type DataRecord = { barcode: string; station: string; datetime: Date }
type StationStat = { station: string; count: number }

const SYSTEM_PROMPT = `Si dátový asistent pre ZjazdyApp.
Analyzuješ pohyb vagónov cez železničné stanice.
Dáta obsahujú: čiarový kód vagóna, stanicu, čas prechodu, poznámky.
Aktuálny súhrn dát: {DATA_SUMMARY}
Odpovedaj v slovenčine. Buď stručný, max 80 slov.`

function buildDataSummary(allData: DataRecord[], stStats: StationStat[]): string {
  if (!allData.length) return 'Žiadne dáta nie sú načítané.'

  const total = allData.length

  const stationLines = stStats
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(s => `${s.station}(${s.count})`)
    .join(', ')

  const times = allData
    .map(d => d.datetime?.getTime())
    .filter((t): t is number => typeof t === 'number' && !isNaN(t))
  const minDate = new Date(times.reduce((a, b) => a < b ? a : b))
  const maxDate = new Date(times.reduce((a, b) => a > b ? a : b))
  const dateRange = `${minDate.toLocaleDateString('sk')} – ${maxDate.toLocaleDateString('sk')}`

  const barcodeCount: Record<string, number> = {}
  allData.forEach(d => { barcodeCount[d.barcode] = (barcodeCount[d.barcode] || 0) + 1 })
  const top3 = Object.entries(barcodeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([bc, cnt]) => `${bc}(${cnt}x)`)
    .join(', ')

  return `Celkovo ${total} záznamov. Stanice: ${stationLines}. Dátumový rozsah: ${dateRange}. Top 3 vagóny: ${top3}.`
}

export function useAIChat(allData: DataRecord[], stStats: StationStat[]) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const historyRef = useRef<ChatMessage[]>([])

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = { role: 'user', content: text }
    const newHistory = [...historyRef.current, userMsg]
    historyRef.current = newHistory
    setMessages([...newHistory])
    setLoading(true)

    const apiKey = (import.meta as any).env.VITE_OPENAI_API_KEY
    if (!apiKey) {
      const err: ChatMessage = { role: 'assistant', content: 'API kľúč nie je nastavený v .env súbore.', isError: true }
      historyRef.current = [...newHistory, err]
      setMessages([...historyRef.current])
      setLoading(false)
      return
    }

    try {
      const dataSummary = buildDataSummary(allData, stStats)
      const systemContent = SYSTEM_PROMPT.replace('{DATA_SUMMARY}', dataSummary)

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 500,
          messages: [
            { role: 'system', content: systemContent },
            ...newHistory
          ]
        })
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        const openAIMsg = (errBody as any)?.error?.message ?? ''
        console.error('[AI] OpenAI error', response.status, errBody)
        let display = `Chyba ${response.status}. Skúste znova.`
        if (response.status === 401) display = 'Neplatný API kľúč (401). Skontrolujte .env súbor.'
        if (response.status === 429) display = 'Limit požiadaviek prekročený (429). Skúste o chvíľu.'
        if (response.status === 403) display = 'Prístup zamietnutý (403). Skontrolujte API kľúč.'
        if (openAIMsg) display += `\n${openAIMsg}`
        throw Object.assign(new Error(display), { display })
      }

      const data = await response.json()
      const reply = data.choices[0].message.content
      const assistantMsg: ChatMessage = { role: 'assistant', content: reply }
      historyRef.current = [...newHistory, assistantMsg]
      setMessages([...historyRef.current])
    } catch (rawErr: unknown) {
      const display =
        rawErr instanceof Error && (rawErr as any).display
          ? (rawErr as any).display
          : rawErr instanceof TypeError
            ? 'Sieť nedostupná. Skontrolujte pripojenie.'
            : 'Chyba pripojenia. Skúste znova.'
      console.error('[AI] sendMessage error:', rawErr)
      const err: ChatMessage = { role: 'assistant', content: display, isError: true }
      historyRef.current = [...newHistory, err]
      setMessages([...historyRef.current])
    } finally {
      setLoading(false)
    }
  }, [allData, stStats])

  const resetChat = useCallback(() => {
    historyRef.current = []
    setMessages([])
  }, [])

  const retryLast = useCallback(() => {
    const msgs = historyRef.current
    const last = msgs[msgs.length - 1]
    const prev = msgs[msgs.length - 2]
    if (!last?.isError || prev?.role !== 'user') return
    const trimmed = msgs.slice(0, msgs.length - 2)
    historyRef.current = trimmed
    setMessages([...trimmed])
    sendMessage(prev.content)
  }, [sendMessage])

  return { messages, loading, sendMessage, resetChat, retryLast }
}
