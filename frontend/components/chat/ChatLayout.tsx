// 'use client'

// import { useState, useRef, useEffect, useCallback } from 'react'
// import ChatHeader from './ChatHeader'
// import ChatIntro from './ChatIntro'
// import ChatBubble from './ChatBubble'
// import ProductResult from './ProductResult'
// import WebResultCard from './WebResultCard'
// import ChatInput from './ChatInput'
// import { useWebSocket, type WSIncoming } from '@/lib/useWebSocket'
// import type { ProductPayload, QuerySummary } from '@/lib/api'

// interface Message {
//   id: number
//   role: 'user' | 'ai'
//   text?: string
//   products?: ProductPayload[]
//   summary?: QuerySummary | null
//   webResults?: string | null
//   status?: 'thinking' | 'streaming' | 'complete'
//   imageThumbnail?: string
// }

// let nextId = 0

// export default function ChatLayout() {
//   const [messages, setMessages] = useState<Message[]>([])
//   const [loading, setLoading] = useState(false)
//   const [thinkingText, setThinkingText] = useState<string | null>(null)
//   const scrollRef = useRef<HTMLDivElement>(null)
//   const currentAiId = useRef<number | null>(null)
//   const { connected, sendMessage, sendJson, setOnMessage, setOnDisconnect } = useWebSocket()




//   useEffect(() => {
//     scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
//   }, [messages, loading, thinkingText])

//   const handleMessage = useCallback((msg: WSIncoming) => {
//     switch (msg.type) {
//       case 'thinking':
//         setThinkingText(msg.content || 'Thinking...')
//         break

//       case 'tool_call':
//         setThinkingText(`Searching: ${msg.tool || 'database'}...`)
//         break

//       case 'products': {
//         const aiId = currentAiId.current
//         if (aiId == null) break

//         setMessages(prev => prev.map(m => {
//           if (m.id !== aiId) return m
//           return {
//             ...m,
//             products: msg.products?.length ? msg.products : m.products,
//             summary: msg.summary ?? m.summary,
//             webResults: msg.web_results ?? m.webResults,
//           }
//         }))
//         break
//       }

//       case 'token': {
//         setThinkingText(null)
//         const aiId = currentAiId.current
//         if (aiId == null) break

//         setMessages(prev => prev.map(m => {
//           if (m.id !== aiId) return m
//           return {
//             ...m,
//             text: (m.text || '') + (msg.content || ''),
//             status: 'streaming',
//           }
//         }))
//         break
//       }

//       case 'done': {
//         const aiId = currentAiId.current
//         if (aiId == null) break

//         setMessages(prev => prev.map(m => {
//           if (m.id !== aiId) return m
//           return { ...m, status: 'complete' }
//         }))
//         setLoading(false)
//         setThinkingText(null)
//         currentAiId.current = null
//         break
//       }

//       case 'error': {
//         const errorText = msg.content || 'Something went wrong. Please try again.'
//         const aiId = currentAiId.current

//         if (aiId != null) {
//           setMessages(prev => prev.map(m => {
//             if (m.id !== aiId) return m
//             return { ...m, text: errorText, status: 'complete' }
//           }))
//         } else {
//           setMessages(prev => [...prev, {
//             id: nextId++,
//             role: 'ai',
//             text: errorText,
//             status: 'complete',
//           }])
//         }
//         setLoading(false)
//         setThinkingText(null)
//         currentAiId.current = null
//         break
//       }
//     }
//   }, [])

//   useEffect(() => {
//     setOnMessage(handleMessage)
//   }, [handleMessage, setOnMessage])

//   // Reset in-flight state when the socket drops so input doesn't stay disabled
//   useEffect(() => {
//     setOnDisconnect(() => {
//       const aiId = currentAiId.current
//       if (aiId != null) {
//         setMessages(prev => prev.map(m => {
//           if (m.id !== aiId) return m
//           return {
//             ...m,
//             text: (m.text || '') + (m.text ? '\n\n' : '') + 'Connection lost. Please try again.',
//             status: 'complete',
//           }
//         }))
//         currentAiId.current = null
//       }
//       setLoading(false)
//       setThinkingText(null)
//     })
//   }, [setOnDisconnect])

//   function startAiMessage(imageThumbnail?: string) {
//     if (!connected) {
//       setMessages(prev => [...prev, {
//         id: nextId++, role: 'ai',
//         text: 'Not connected to server. Please wait or refresh.',
//         status: 'complete',
//       }])
//       return null
//     }
//     const aiId = nextId++
//     currentAiId.current = aiId
//     setMessages(prev => [...prev, { id: aiId, role: 'ai', text: '', status: 'thinking', imageThumbnail }])
//     setLoading(true)
//     return aiId
//   }

//   function handleSend(text: string) {
//     setMessages(prev => [...prev, { id: nextId++, role: 'user', text }])
//     const aiId = startAiMessage()
//     if (aiId == null) return
//     setThinkingText('Classifying your query...')
//     sendMessage(text)
//   }

//   // ── Barcode / QR scan ─────────────────────────────────────────────────────
//   function handleBarcodeScan(scannedText: string) {
//     setMessages(prev => [...prev, { id: nextId++, role: 'user', text: '📷 Scanned barcode' }])

//     if (!connected) {
//       setMessages(prev => [...prev, {
//         id: nextId++, role: 'ai',
//         text: 'Not connected to server. Please wait or refresh.',
//         status: 'complete',
//       }])
//       return
//     }

//     const aiId = nextId++
//     currentAiId.current = aiId
//     setMessages(prev => [...prev, { id: aiId, role: 'ai', text: '', status: 'thinking' }])
//     setLoading(true)
//     setThinkingText('Looking up product...')

//     // type: "barcode" → handler.py skips DB and goes straight to web_search
//     sendJson({ type: 'barcode', content: scannedText })
//   }

//   function handleImageScan(base64DataUri: string) {
//     setMessages(prev => [...prev, {
//       id: nextId++,
//       role: 'user',
//       text: '📷 Sent an image for analysis',
//       imageThumbnail: base64DataUri,
//     }])

//     if (!connected) {
//       setMessages(prev => [...prev, {
//         id: nextId++, role: 'ai',
//         text: 'Not connected to server. Please wait or refresh.',
//         status: 'complete',
//       }])
//       return
//     }

//     const aiId = nextId++
//     currentAiId.current = aiId
//     setMessages(prev => [...prev, { id: aiId, role: 'ai', text: '', status: 'thinking' }])
//     setLoading(true)
//     setThinkingText('Analyzing image...')

//     // type: "image" → handler.py routes to vision_service.analyze_image
//     sendJson({ type: 'image', image: base64DataUri })
//   }

//   return (
//     <div className="h-screen flex flex-col justify-between bg-gray-50">
//       <ChatHeader connected={connected} />

//       {/* CONTENT AREA */}
//       <div className="flex-1 overflow-y-auto" ref={scrollRef}>
//         <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

//           {messages.length === 0 && <ChatIntro />}

//           {messages.map(msg => (
//             <div key={msg.id}>
//               {msg.role === 'user' && (
//                 <>
//                   {msg.text && <ChatBubble message={msg.text} isUser />}
//                   {msg.imageThumbnail && (
//                     <div className="flex justify-end mt-1">
//                       {/* eslint-disable-next-line @next/next/no-img-element */}
//                       <img
//                         src={msg.imageThumbnail}
//                         alt="uploaded"
//                         className="max-w-[200px] max-h-[200px] rounded-xl border border-gray-200 object-cover"
//                       />
//                     </div>
//                   )}
//                 </>
//               )}

//               {msg.role === 'ai' && (
//                 <>
//                   {msg.text && <ChatBubble message={msg.text} isUser={false} />}

//                   {msg.webResults && !msg.products?.length && (
//                     <WebResultCard text={msg.webResults} delay={100} />
//                   )}

//                   {msg.products && msg.products.length > 0 && (
//                     <div className="space-y-3 mt-2">
//                       {msg.products.slice(0, 5).map((product, i) => (
//                         <ProductResult
//                           key={product.canonical_id || i}
//                           product={product}
//                           delay={i * 150}
//                         />
//                       ))}
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           ))}

//           {/* Thinking / streaming indicator */}
//           {loading && thinkingText && (
//             <div className="flex justify-start">
//               <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl text-sm flex items-center gap-2">
//                 <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
//                 <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
//                 <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
//                 <span className="ml-1 text-gray-600">{thinkingText}</span>
//               </div>
//             </div>
//           )}

//         </div>
//       </div>

//       <ChatInput 
//         onSend={handleSend} 
//         onBarcodeScan={handleBarcodeScan} 
//         onImageScan={handleImageScan} 
//         disabled={loading} 
//       />
//     </div>
//   )
// }














// 'use client'

// import { useState, useRef, useEffect, useCallback } from 'react'
// import ChatHeader from './ChatHeader'
// import ChatIntro from './ChatIntro'
// import ChatBubble from './ChatBubble'
// import ProductResult from './ProductResult'
// import WebResultCard from './WebResultCard'
// import ChatInput from './ChatInput'
// import { useWebSocket, type WSIncoming } from '@/lib/useWebSocket'
// import type { ProductPayload, QuerySummary } from '@/lib/api'

// interface Message {
//   id: number
//   role: 'user' | 'ai'
//   text?: string
//   products?: ProductPayload[]
//   summary?: QuerySummary | null
//   webResults?: string | null
//   status?: 'thinking' | 'streaming' | 'complete'
//   imageThumbnail?: string
// }

// let nextId = 0

// export default function ChatLayout() {
//   const [messages, setMessages] = useState<Message[]>([])
//   const [loading, setLoading] = useState(false)
//   const [thinkingText, setThinkingText] = useState<string | null>(null)
//   const scrollRef = useRef<HTMLDivElement>(null)
//   const currentAiId = useRef<number | null>(null)

//   const { connected, sendMessage, sendJson, setOnMessage, setOnDisconnect } = useWebSocket()

//   useEffect(() => {
//     scrollRef.current?.scrollTo({
//       top: scrollRef.current.scrollHeight,
//       behavior: 'smooth'
//     })
//   }, [messages, loading, thinkingText])

//   const handleMessage = useCallback((msg: WSIncoming) => {
//     switch (msg.type) {

//       case 'thinking':
//         setThinkingText(msg.content || 'Thinking...')
//         break

//       case 'tool_call':
//         setThinkingText(`Searching database...`)
//         break

//       case 'products': {
//         const aiId = currentAiId.current
//         if (aiId == null) break

//         setMessages(prev =>
//           prev.map(m =>
//             m.id === aiId
//               ? {
//                   ...m,
//                   products: msg.products?.length ? msg.products : m.products,
//                   summary: msg.summary ?? m.summary,
//                   webResults: msg.web_results ?? m.webResults,
//                 }
//               : m
//           )
//         )
//         break
//       }

//       case 'token': {
//         setThinkingText(null)
//         const aiId = currentAiId.current
//         if (aiId == null) break

//         setMessages(prev =>
//           prev.map(m =>
//             m.id === aiId
//               ? {
//                   ...m,
//                   text: (m.text || '') + (msg.content || ''),
//                   status: 'streaming',
//                 }
//               : m
//           )
//         )
//         break
//       }

//       case 'done': {
//         const aiId = currentAiId.current
//         if (aiId == null) break

//         setMessages(prev =>
//           prev.map(m =>
//             m.id === aiId ? { ...m, status: 'complete' } : m
//           )
//         )

//         setLoading(false)
//         setThinkingText(null)
//         currentAiId.current = null
//         break
//       }
//     }
//   }, [])

//   useEffect(() => {
//     setOnMessage(handleMessage)
//   }, [handleMessage, setOnMessage])

//   return (
//     <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white cursor-none">

//       {/* HEADER */}
//       <ChatHeader connected={connected} />

//       {/* CHAT AREA */}
//       <div
//         ref={scrollRef}
//         className="flex-1 overflow-y-auto scroll-smooth"
//       >
//         <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

//           {/* INTRO */}
//           {messages.length === 0 && (
//             <div className="animate-fade-in-up">
//               <ChatIntro />
//             </div>
//           )}

//           {/* MESSAGES */}
//           {messages.map(msg => (
//             <div key={msg.id} className="animate-fade-in-up">

//               {msg.role === 'user' && (
//                 <>
//                   {msg.text && <ChatBubble message={msg.text} isUser />}
//                   {msg.imageThumbnail && (
//                     <div className="flex justify-end mt-2">
//                       <img
//                         src={msg.imageThumbnail}
//                         className="max-w-[220px] rounded-2xl border shadow-sm hover:scale-105 transition"
//                       />
//                     </div>
//                   )}
//                 </>
//               )}

//               {msg.role === 'ai' && (
//                 <>
//                   {msg.text && <ChatBubble message={msg.text} isUser={false} />}

//                   {msg.webResults && !msg.products?.length && (
//                     <div className="mt-2">
//                       <WebResultCard text={msg.webResults} delay={100} />
//                     </div>
//                   )}

//                   {msg.products?.length ? (
//                     <div className="space-y-3 mt-2">
//                       {msg.products.slice(0, 5).map((product, i) => (
//                         <ProductResult
//                           key={product.canonical_id || i}
//                           product={product}
//                           delay={i * 120}
//                         />
//                       ))}
//                     </div>
//                   ) : null}
//                 </>
//               )}
//             </div>
//           ))}

//           {/* TYPING INDICATOR */}
//           {loading && thinkingText && (
//             <div className="flex justify-start animate-fade-in-up">
//               <div className="relative overflow-hidden bg-gray-100 border border-gray-200 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm group">

//                 <span className="nav-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

//                 <div className="flex gap-1 relative z-10">
//                   <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
//                   <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]"></span>
//                   <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]"></span>
//                 </div>

//                 <span className="text-sm text-gray-600 relative z-10">
//                   {thinkingText}
//                 </span>

//               </div>
//             </div>
//           )}

//         </div>
//       </div>

//       {/* INPUT */}
//       <ChatInput
//         onSend={(text) => {
//           setMessages(prev => [...prev, { id: nextId++, role: 'user', text }])
//           sendMessage(text)
//           setLoading(true)
//         }}
//         onBarcodeScan={(code) => sendJson({ type: 'barcode', content: code })}
//         onImageScan={(img) => sendJson({ type: 'image', image: img })}
//         disabled={loading}
//       />
//     </div>
//   )
// }











// 'use client'

// import { useState, useRef, useEffect, useCallback } from 'react'
// import ChatHeader from './ChatHeader'
// import ChatIntro from './ChatIntro'
// import ChatBubble from './ChatBubble'
// import ProductResult from './ProductResult'
// import WebResultCard from './WebResultCard'
// import ChatInput from './ChatInput'
// import { useWebSocket, type WSIncoming } from '@/lib/useWebSocket'
// import type { ProductPayload, QuerySummary } from '@/lib/api'

// interface Message {
//   id: number
//   role: 'user' | 'ai'
//   text?: string
//   products?: ProductPayload[]
//   summary?: QuerySummary | null
//   webResults?: string | null
//   status?: 'thinking' | 'streaming' | 'complete'
//   imageThumbnail?: string
// }

// let nextId = 0

// export default function ChatLayout() {
//   const [messages, setMessages] = useState<Message[]>([])
//   const [loading, setLoading] = useState(false)
//   const [thinkingText, setThinkingText] = useState<string | null>(null)

//   const scrollRef = useRef<HTMLDivElement>(null)
//   const currentAiId = useRef<number | null>(null)

//   const { connected, sendMessage, sendJson, setOnMessage } = useWebSocket()

//   // -----------------------------
//   // SCROLL
//   // -----------------------------
//   useEffect(() => {
//     scrollRef.current?.scrollTo({
//       top: scrollRef.current.scrollHeight,
//       behavior: 'smooth'
//     })
//   }, [messages, loading, thinkingText])

//   // -----------------------------
//   // CURSOR (ONLY CHAT PAGE FIX)
//   // -----------------------------
//   useEffect(() => {
//     const dot = document.getElementById('cursor-dot')
//     const ring = document.getElementById('cursor-ring')

//     const moveCursor = (e: MouseEvent) => {
//       if (dot) {
//         dot.style.left = `${e.clientX}px`
//         dot.style.top = `${e.clientY}px`
//       }

//       if (ring) {
//         ring.style.left = `${e.clientX}px`
//         ring.style.top = `${e.clientY}px`
//       }
//     }

//     const addHover = () => document.body.classList.add('cursor-hover')
//     const removeHover = () => document.body.classList.remove('cursor-hover')

//     window.addEventListener('mousemove', moveCursor)

//     const hoverElements = document.querySelectorAll(
//       'button, input, a, .hover-glow'
//     )

//     hoverElements.forEach(el => {
//       el.addEventListener('mouseenter', addHover)
//       el.addEventListener('mouseleave', removeHover)
//     })

//     return () => {
//       window.removeEventListener('mousemove', moveCursor)

//       hoverElements.forEach(el => {
//         el.removeEventListener('mouseenter', addHover)
//         el.removeEventListener('mouseleave', removeHover)
//       })
//     }
//   }, [])

//   // -----------------------------
//   // WS MESSAGE HANDLER
//   // -----------------------------
//   const handleMessage = useCallback((msg: WSIncoming) => {
//     switch (msg.type) {

//       case 'thinking':
//         setThinkingText(msg.content || 'Thinking...')
//         break

//       case 'tool_call':
//         setThinkingText('Searching database...')
//         break

//       case 'products': {
//         const aiId = currentAiId.current
//         if (aiId == null) break

//         setMessages(prev =>
//           prev.map(m =>
//             m.id === aiId
//               ? {
//                   ...m,
//                   products: msg.products?.length ? msg.products : m.products,
//                   summary: msg.summary ?? m.summary,
//                   webResults: msg.web_results ?? m.webResults,
//                 }
//               : m
//           )
//         )
//         break
//       }

//       case 'token': {
//         setThinkingText(null)
//         const aiId = currentAiId.current
//         if (aiId == null) break

//         setMessages(prev =>
//           prev.map(m =>
//             m.id === aiId
//               ? {
//                   ...m,
//                   text: (m.text || '') + (msg.content || ''),
//                   status: 'streaming',
//                 }
//               : m
//           )
//         )
//         break
//       }

//       case 'done': {
//         const aiId = currentAiId.current
//         if (aiId == null) break

//         setMessages(prev =>
//           prev.map(m =>
//             m.id === aiId ? { ...m, status: 'complete' } : m
//           )
//         )

//         setLoading(false)
//         setThinkingText(null)
//         currentAiId.current = null
//         break
//       }
//     }
//   }, [])

//   useEffect(() => {
//     setOnMessage(handleMessage)
//   }, [handleMessage, setOnMessage])

//   // -----------------------------
//   // UI
//   // -----------------------------
//   return (
//     <>
//       {/* CUSTOM CURSOR (ONLY CHAT PAGE) */}
//       <div id="cursor-dot"></div>
//       <div id="cursor-ring"></div>

//       <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white cursor-none">

//         {/* HEADER */}
//         <ChatHeader connected={connected} />

//         {/* CHAT AREA */}
//         <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
//           <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

//             {messages.length === 0 && <ChatIntro />}

//             {messages.map(msg => (
//               <div key={msg.id}>

//                 {msg.role === 'user' && (
//                   <>
//                     {msg.text && <ChatBubble message={msg.text} isUser />}
//                     {msg.imageThumbnail && (
//                       <div className="flex justify-end mt-2">
//                         <img
//                           src={msg.imageThumbnail}
//                           className="max-w-[220px] rounded-2xl border shadow-sm"
//                         />
//                       </div>
//                     )}
//                   </>
//                 )}

//                 {msg.role === 'ai' && (
//                   <>
//                     {msg.text && <ChatBubble message={msg.text} isUser={false} />}

//                     {msg.webResults && !msg.products?.length && (
//                       <WebResultCard text={msg.webResults} delay={100} />
//                     )}

//                     {msg.products?.length ? (
//                       <div className="space-y-3 mt-2">
//                         {msg.products.slice(0, 5).map((product, i) => (
//                           <ProductResult
//                             key={product.canonical_id || i}
//                             product={product}
//                             delay={i * 120}
//                           />
//                         ))}
//                       </div>
//                     ) : null}
//                   </>
//                 )}
//               </div>
//             ))}

//             {/* TYPING */}
//             {loading && thinkingText && (
//               <div className="flex justify-start">
//                 <div className="bg-gray-100 px-4 py-2 rounded-2xl text-sm text-gray-600">
//                   {thinkingText}
//                 </div>
//               </div>
//             )}

//           </div>
//         </div>

//         {/* INPUT */}
//         <ChatInput
//           onSend={(text) => {
//             setMessages(prev => [...prev, { id: nextId++, role: 'user', text }])
//             sendMessage(text)
//             setLoading(true)
//           }}
//           onBarcodeScan={(code) =>
//             sendJson({ type: 'barcode', content: code })
//           }
//           onImageScan={(img) =>
//             sendJson({ type: 'image', image: img })
//           }
//           disabled={loading}
//         />

//       </div>
//     </>
//   )
// }










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
  imageThumbnail?: string
}

let nextId = 0

export default function ChatLayout() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [thinkingText, setThinkingText] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const currentAiId = useRef<number | null>(null)
  const { connected, sendMessage, sendJson, setOnMessage, setOnDisconnect } = useWebSocket()

  // async function handleBarcodeScan(scannedText: string) {
  //   const userMsg: Message = { 
  //     id: nextId++, 
  //     role: 'user', 
  //     text: `📷 Scanned barcode` 
  //   }
  //   setMessages(prev => [...prev, userMsg])
  //   setLoading(true)

  //   try {
  //     // ⭐ URL se product name nikalo, barcode number use karo
  //     let searchQuery = scannedText

  //     // Agar URL hai to domain se brand nikalo
  //     if (scannedText.startsWith('http')) {
  //       const domain = new URL(scannedText).hostname
  //         .replace('wap.', '')
  //         .replace('www.', '')
  //         .split('.')[0]  // "pepsi.co.uk" → "pepsi"
  //       searchQuery = domain
  //     }

  //     // Clean search query
  //     searchQuery = `${searchQuery} halal or haram`

  //     const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/websearch`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ query: searchQuery })
  //     })
  //     const data = await res.json()

  //     // Web results parse karo
  //     const rawText: string = data.results || ''
      
  //     // Results ko lines mein todo
  //     const entries = rawText
  //       .split(/\n\n/)
  //       .map((block: string) => {
  //         const lines = block.split('\n').map((l: string) => l.trim()).filter(Boolean)
  //         const titleLine = lines.find((l: string) => /^\d+\./.test(l))
  //         const urlLine = lines.find((l: string) => l.startsWith('http'))
  //         const snippetLine = lines.find((l: string) => !(/^\d+\./.test(l)) && !l.startsWith('http'))
          
  //         return {
  //           title: titleLine?.replace(/^\d+\.\s*/, '') || '',
  //           url: urlLine || '',
  //           snippet: snippetLine || ''
  //         }
  //       })
  //       .filter(e => e.title && e.url)

  //     setMessages(prev => [...prev, {
  //       id: nextId++,
  //       role: 'ai',
  //       fromWebSearch: true,
  //       text: `🔍 "${searchQuery.replace(' halal or haram', '')}" related web results:`,
  //       // Parsed results as formatted string
  //       webResults: entries.length > 0 
  //         ? entries.map((e, i) => 
  //             `  ${i+1}. ${e.title}\n     ${e.url}\n     ${e.snippet}`
  //           ).join('\n\n')
  //         : 'No relevant results found.'
  //     }])

  //   } catch (err) {
  //     setMessages(prev => [...prev, {
  //       id: nextId++,
  //       role: 'ai',
  //       fromWebSearch: true,
  //       text: 'Web search failed.'
  //     }])
  //   } finally {
  //     setLoading(false)
  //   }
  // }


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

  // Reset in-flight state when the socket drops so input doesn't stay disabled
  useEffect(() => {
    setOnDisconnect(() => {
      const aiId = currentAiId.current
      if (aiId != null) {
        setMessages(prev => prev.map(m => {
          if (m.id !== aiId) return m
          return {
            ...m,
            text: (m.text || '') + (m.text ? '\n\n' : '') + 'Connection lost. Please try again.',
            status: 'complete',
          }
        }))
        currentAiId.current = null
      }
      setLoading(false)
      setThinkingText(null)
    })
  }, [setOnDisconnect])

  function startAiMessage(imageThumbnail?: string) {
    if (!connected) {
      setMessages(prev => [...prev, {
        id: nextId++, role: 'ai',
        text: 'Not connected to server. Please wait or refresh.',
        status: 'complete',
      }])
      return null
    }
    const aiId = nextId++
    currentAiId.current = aiId
    setMessages(prev => [...prev, { id: aiId, role: 'ai', text: '', status: 'thinking', imageThumbnail }])
    setLoading(true)
    return aiId
  }

  function handleSend(text: string) {
    setMessages(prev => [...prev, { id: nextId++, role: 'user', text }])
    const aiId = startAiMessage()
    if (aiId == null) return
    setThinkingText('Classifying your query...')
    sendMessage(text)
  }

  // ── Barcode / QR scan ─────────────────────────────────────────────────────
  function handleBarcodeScan(scannedText: string) {
    setMessages(prev => [...prev, { id: nextId++, role: 'user', text: '📷 Scanned barcode' }])

    if (!connected) {
      setMessages(prev => [...prev, {
        id: nextId++, role: 'ai',
        text: 'Not connected to server. Please wait or refresh.',
        status: 'complete',
      }])
      return
    }

    const aiId = nextId++
    currentAiId.current = aiId
    setMessages(prev => [...prev, { id: aiId, role: 'ai', text: '', status: 'thinking' }])
    setLoading(true)
    setThinkingText('Looking up product...')

    // type: "barcode" → handler.py skips DB and goes straight to web_search
    sendJson({ type: 'barcode', content: scannedText })
  }

  function handleImageScan(base64DataUri: string) {
    setMessages(prev => [...prev, {
      id: nextId++,
      role: 'user',
      text: '📷 Sent an image for analysis',
      imageThumbnail: base64DataUri,
    }])

    if (!connected) {
      setMessages(prev => [...prev, {
        id: nextId++, role: 'ai',
        text: 'Not connected to server. Please wait or refresh.',
        status: 'complete',
      }])
      return
    }

    const aiId = nextId++
    currentAiId.current = aiId
    setMessages(prev => [...prev, { id: aiId, role: 'ai', text: '', status: 'thinking' }])
    setLoading(true)
    setThinkingText('Analyzing image...')

    // type: "image" → handler.py routes to vision_service.analyze_image
    sendJson({ type: 'image', image: base64DataUri })
  }

  return (
    <div className="h-screen flex flex-col justify-between bg-gray-50">
      <ChatHeader connected={connected} />

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

          {messages.length === 0 && <ChatIntro />}

          {messages.map(msg => (
            <div key={msg.id}>
              {msg.role === 'user' && (
                <>
                  {msg.text && <ChatBubble message={msg.text} isUser />}
                  {msg.imageThumbnail && (
                    <div className="flex justify-end mt-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={msg.imageThumbnail}
                        alt="uploaded"
                        className="max-w-[200px] max-h-[200px] rounded-xl border border-gray-200 object-cover"
                      />
                    </div>
                  )}
                </>
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

      <ChatInput 
        onSend={handleSend} 
        onBarcodeScan={handleBarcodeScan} 
        onImageScan={handleImageScan} 
        disabled={loading} 
      />
    </div>
  )
}