'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ChatHeader from './ChatHeader'
import ChatIntro from './ChatIntro'
import ChatBubble from './ChatBubble'
import ProductResult from './ProductResult'
import WebResultCard from './WebResultCard'
import ChatInput from './ChatInput'
import { useWebSocket, type WSIncoming } from '@/lib/useWebSocket'
import type { ProductPayload, QuerySummary } from '@/lib/api'

interface Message {
  id: number
  role: 'user' | 'ai'
  text?: string
  products?: ProductPayload[]
  summary?: QuerySummary | null
  webResults?: string | null
  status?: 'thinking' | 'streaming' | 'complete'
}

let nextId = 0

export default function ChatLayout() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [thinkingText, setThinkingText] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const currentAiId = useRef<number | null>(null)
  const { connected, sendMessage, setOnMessage } = useWebSocket()

  async function handleBarcodeScan(scannedText: string) {
    const userMsg: Message = { 
      id: nextId++, 
      role: 'user', 
      text: `📷 Scanned barcode` 
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      // ⭐ URL se product name nikalo, barcode number use karo
      let searchQuery = scannedText

      // Agar URL hai to domain se brand nikalo
      if (scannedText.startsWith('http')) {
        const domain = new URL(scannedText).hostname
          .replace('wap.', '')
          .replace('www.', '')
          .split('.')[0]  // "pepsi.co.uk" → "pepsi"
        searchQuery = domain
      }

      // Clean search query
      searchQuery = `${searchQuery} halal or haram`

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/websearch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      })
      const data = await res.json()

      // Web results parse karo
      const rawText: string = data.results || ''
      
      // Results ko lines mein todo
      const entries = rawText
        .split(/\n\n/)
        .map((block: string) => {
          const lines = block.split('\n').map((l: string) => l.trim()).filter(Boolean)
          const titleLine = lines.find((l: string) => /^\d+\./.test(l))
          const urlLine = lines.find((l: string) => l.startsWith('http'))
          const snippetLine = lines.find((l: string) => !(/^\d+\./.test(l)) && !l.startsWith('http'))
          
          return {
            title: titleLine?.replace(/^\d+\.\s*/, '') || '',
            url: urlLine || '',
            snippet: snippetLine || ''
          }
        })
        .filter(e => e.title && e.url)

      setMessages(prev => [...prev, {
        id: nextId++,
        role: 'ai',
        fromWebSearch: true,
        text: `🔍 "${searchQuery.replace(' halal or haram', '')}" related web results:`,
        // Parsed results as formatted string
        webResults: entries.length > 0 
          ? entries.map((e, i) => 
              `  ${i+1}. ${e.title}\n     ${e.url}\n     ${e.snippet}`
            ).join('\n\n')
          : 'No relevant results found.'
      }])

    } catch (err) {
      setMessages(prev => [...prev, {
        id: nextId++,
        role: 'ai',
        fromWebSearch: true,
        text: 'Web search failed.'
      }])
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading, thinkingText])

  const handleMessage = useCallback((msg: WSIncoming) => {
    switch (msg.type) {
      case 'thinking':
        setThinkingText(msg.content || 'Thinking...')
        break

      case 'tool_call':
        setThinkingText(`Searching: ${msg.tool || 'database'}...`)
        break

      case 'products': {
        const aiId = currentAiId.current
        if (aiId == null) break

        setMessages(prev => prev.map(m => {
          if (m.id !== aiId) return m
          return {
            ...m,
            products: msg.products?.length ? msg.products : m.products,
            summary: msg.summary ?? m.summary,
            webResults: msg.web_results ?? m.webResults,
          }
        }))
        break
      }

      case 'token': {
        setThinkingText(null)
        const aiId = currentAiId.current
        if (aiId == null) break

        setMessages(prev => prev.map(m => {
          if (m.id !== aiId) return m
          return {
            ...m,
            text: (m.text || '') + (msg.content || ''),
            status: 'streaming',
          }
        }))
        break
      }

      case 'done': {
        const aiId = currentAiId.current
        if (aiId == null) break

        setMessages(prev => prev.map(m => {
          if (m.id !== aiId) return m
          return { ...m, status: 'complete' }
        }))
        setLoading(false)
        setThinkingText(null)
        currentAiId.current = null
        break
      }

      case 'error': {
        const errorText = msg.content || 'Something went wrong. Please try again.'
        const aiId = currentAiId.current

        if (aiId != null) {
          setMessages(prev => prev.map(m => {
            if (m.id !== aiId) return m
            return { ...m, text: errorText, status: 'complete' }
          }))
        } else {
          setMessages(prev => [...prev, {
            id: nextId++,
            role: 'ai',
            text: errorText,
            status: 'complete',
          }])
        }
        setLoading(false)
        setThinkingText(null)
        currentAiId.current = null
        break
      }
    }
  }, [])

  useEffect(() => {
    setOnMessage(handleMessage)
  }, [handleMessage, setOnMessage])

  function handleSend(text: string) {
    if (!connected) {
      setMessages(prev => [...prev, {
        id: nextId++,
        role: 'ai',
        text: 'Not connected to server. Please wait or refresh.',
        status: 'complete',
      }])
      return
    }

    // User message
    setMessages(prev => [...prev, { id: nextId++, role: 'user', text }])

    // Placeholder AI message
    const aiId = nextId++
    currentAiId.current = aiId
    setMessages(prev => [...prev, { id: aiId, role: 'ai', text: '', status: 'thinking' }])
    setLoading(true)
    setThinkingText('Classifying your query...')

    sendMessage(text)
  }

  return (
    <div className="h-screen flex flex-col justify-between bg-gray-50">
      <ChatHeader />

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

          {messages.length === 0 && <ChatIntro />}

          {messages.map(msg => (
            <div key={msg.id}>
              {msg.role === 'user' && msg.text && (
                <ChatBubble message={msg.text} isUser />
              )}

              {msg.role === 'ai' && (
                <>
                  {msg.text && <ChatBubble message={msg.text} isUser={false} />}

                  {msg.webResults && !msg.products?.length && (
                    <WebResultCard text={msg.webResults} delay={100} />
                  )}

                  {msg.products && msg.products.length > 0 && (
                    <div className="space-y-3 mt-2">
                      {msg.products.slice(0, 5).map((product, i) => (
                        <ProductResult
                          key={product.canonical_id || i}
                          product={product}
                          delay={i * 150}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Thinking / streaming indicator */}
          {loading && thinkingText && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-1 text-gray-600">{thinkingText}</span>
              </div>
            </div>
          )}

        </div>
      </div>

      <ChatInput onSend={handleSend} onBarcodeScan={handleBarcodeScan} disabled={loading} />
    </div>
  )
}
