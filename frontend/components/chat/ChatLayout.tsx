'use client'

import { useState, useRef, useEffect } from 'react'
import ChatHeader from './ChatHeader'
import ChatIntro from './ChatIntro'
import ChatBubble from './ChatBubble'
import ProductResult from './ProductResult'
import ChatInput from './ChatInput'
import { queryHalal, type ProductPayload, type QuerySummary } from '@/lib/api'

interface Message {
  id: number
  role: 'user' | 'ai'
  text?: string
  products?: ProductPayload[]
  summary?: QuerySummary | null
  webResults?: string | null
}

let nextId = 0

export default function ChatLayout() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend(text: string) {
    const userMsg: Message = { id: nextId++, role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await queryHalal(text)

      const aiMsg: Message = { id: nextId++, role: 'ai' }

      if (!res.success) {
        aiMsg.text = res.error || 'Something went wrong. Please try again.'
      } else if (res.notInDatabase && res.webResults) {
        aiMsg.text = "I couldn't find this in our verified database. Here's what I found online:\n\n" + res.webResults
      } else if (res.notInDatabase) {
        aiMsg.text = "I couldn't find any matching products in our verified database. Try rephrasing your query or being more specific."
      } else {
        const products = res.results
          ?.filter(r => r.payload)
          .map(r => r.payload) || []

        if (products.length > 0) {
          aiMsg.products = products
          aiMsg.summary = res.summary
        }

        if (res.summary) {
          const s = res.summary
          aiMsg.text = `Found products from ${s.company}: ${s.halal} Halal, ${s.haram} Haraam, ${s.mushbooh} Mushbooh.`
        } else if (products.length > 0) {
          aiMsg.text = `Found ${products.length} result${products.length === 1 ? '' : 's'}:`
        } else if (res.fuzzyWarning) {
          aiMsg.text = res.fuzzyWarning
        } else {
          aiMsg.text = "No results found. Try a different query."
        }
      }

      setMessages(prev => [...prev, aiMsg])
    } catch {
      setMessages(prev => [...prev, {
        id: nextId++,
        role: 'ai',
        text: 'Failed to connect to the server. Make sure the backend is running on port 8000.',
      }])
    } finally {
      setLoading(false)
    }
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

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl text-sm flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

        </div>
      </div>

      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  )
}
