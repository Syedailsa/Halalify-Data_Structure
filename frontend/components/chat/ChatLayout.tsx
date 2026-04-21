// 'use client'

// import { useState, useRef, useEffect } from 'react'
// import ChatHeader from './ChatHeader'
// import ChatIntro from './ChatIntro'
// import ChatBubble from './ChatBubble'
// import ProductResult from './ProductResult'
// import ChatInput from './ChatInput'
// import { queryHalal, type ProductPayload, type QuerySummary } from '@/lib/api'

// // interface Message {
// //   id: number
// //   role: 'user' | 'ai'
// //   text?: string
// //   products?: ProductPayload[]
// //   summary?: QuerySummary | null
// //   webResults?: string | null
// // }


// interface Message {
//   id: number
//   role: 'user' | 'ai'
//   text?: string
//   products?: ProductPayload[]
//   summary?: QuerySummary | null
//   webResults?: string | null
//   fromWebSearch?: boolean   // 🔥 ADD THIS
// }


// let nextId = 0

// export default function ChatLayout() {
//   const [messages, setMessages] = useState<Message[]>([])
//   const [loading, setLoading] = useState(false)
//   const scrollRef = useRef<HTMLDivElement>(null)

//   useEffect(() => {
//     scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
//   }, [messages, loading])

//   async function handleSend(text: string) {
//     const userMsg: Message = { id: nextId++, role: 'user', text }
//     setMessages(prev => [...prev, userMsg])
//     setLoading(true)

//     try {
//       const res = await queryHalal(text)

//       // const aiMsg: Message = { id: nextId++, role: 'ai' }

//       const aiMsg: Message = { 
//   id: nextId++, 
//   role: 'ai',
//   fromWebSearch: res.fromWebSearch   // 🔥 ADD THIS
// }


//       if (!res.success) {
//         aiMsg.text = res.error || 'Something went wrong. Please try again.'
//       } else if (res.notInDatabase && res.webResults) {
//         aiMsg.text = "I couldn't find this in our verified database. Here's what I found online:\n\n" + res.webResults
//       } else if (res.notInDatabase) {
//         aiMsg.text = "I couldn't find any matching products in our verified database. Try rephrasing your query or being more specific."
//       } else {
//         const products = res.results
//           ?.filter(r => r.payload)
//           .map(r => r.payload) || []

//         if (products.length > 0) {
//           aiMsg.products = products
//           aiMsg.summary = res.summary
//         }

//         if (res.summary) {
//           const s = res.summary
//           aiMsg.text = `Found products from ${s.company}: ${s.halal} Halal, ${s.haram} Haraam, ${s.mushbooh} Mushbooh.`
//         } else if (products.length > 0) {
//           aiMsg.text = `Found ${products.length} result${products.length === 1 ? '' : 's'}:`
//         } else if (res.fuzzyWarning) {
//           aiMsg.text = res.fuzzyWarning
//         } else {
//           aiMsg.text = "No results found. Try a different query."
//         }
//       }

//       setMessages(prev => [...prev, aiMsg])
//     } catch {
//       setMessages(prev => [...prev, {
//         id: nextId++,
//         role: 'ai',
//         text: 'Failed to connect to the server. Make sure the backend is running on port 8000.',
//       }])
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="h-screen flex flex-col justify-between bg-gray-50">
//       <ChatHeader />

//       {/* CONTENT AREA */}
//       <div className="flex-1 overflow-y-auto" ref={scrollRef}>
//         <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

//           {messages.length === 0 && <ChatIntro />}

//           {messages.map(msg => (
//             <div key={msg.id}>
//               {msg.role === 'user' && msg.text && (
//                 <ChatBubble message={msg.text} isUser />
//               )}

//               {msg.role === 'ai' && (
//                 <>
//                   {msg.text && <ChatBubble message={msg.text} isUser={false} />}

//                   {msg.products && msg.products.length > 0 && (
//                     <div className="space-y-3 mt-2">
//                       {msg.products.slice(0, 5).map((product, i) => (
//                         // <ProductResult
//                         //   key={product.canonical_id || i}
//                         //   product={product}
//                         //   delay={i * 150}
//                         // />

//                        <ProductResult
//   key={product.canonical_id || i}
//   product={product}
//   delay={i * 150}
//   fromWebSearch={msg.fromWebSearch}   // 🔥 YAHAN MAIN FIX
// />

                        
//                       ))}
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           ))}

//           {/* Typing indicator */}
//           {loading && (
//             <div className="flex justify-start">
//               <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl text-sm flex items-center gap-1">
//                 <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
//                 <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
//                 <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
//               </div>
//             </div>
//           )}

//         </div>
//       </div>

//       <ChatInput onSend={handleSend} disabled={loading} />
//     </div>
//   )
// }






















// 'use client'

// import { useState, useRef, useEffect } from 'react'
// import ChatHeader from './ChatHeader'
// import ChatIntro from './ChatIntro'
// import ChatBubble from './ChatBubble'
// import ProductResult from './ProductResult'
// import ChatInput from './ChatInput'
// import { queryHalal, type ProductPayload, type QuerySummary } from '@/lib/api'
// import WebResultCard from './WebResultCard'

// interface Message {
//   id: number
//   role: 'user' | 'ai'
//   text?: string
//   products?: ProductPayload[]
//   summary?: QuerySummary | null
//   webResults?: string | null
//   fromWebSearch?: boolean
// }

// let nextId = 0

// export default function ChatLayout() {
//   const [messages, setMessages] = useState<Message[]>([])
//   const [loading, setLoading] = useState(false)
//   const scrollRef = useRef<HTMLDivElement>(null)

//   useEffect(() => {
//     scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
//   }, [messages, loading])

//   async function handleSend(text: string) {
//     const userMsg: Message = { id: nextId++, role: 'user', text }
//     setMessages(prev => [...prev, userMsg])
//     setLoading(true)

//     try {
//       const res = await queryHalal(text)

//       const aiMsg: Message = {
//         id: nextId++,
//         role: 'ai',
//         fromWebSearch: res.fromWebSearch ?? false,
//       }

//       if (!res.success) {
//         aiMsg.text = res.error || 'Something went wrong. Please try again.'
//       // } else if (res.notInDatabase && res.webResults) {
//       //   aiMsg.text = "I couldn't find this in our verified database. Here's what I found online:\n\n" + res.webResults

//        } else if (res.notInDatabase && res.webResults) {
//   aiMsg.text = "I couldn't find this in our verified database. Here's what I found online:"
//   aiMsg.webResults = res.webResults
//    aiMsg.fromWebSearch = true   // ← YEH LINE ADD KARO, yahi missing hai

//       } else if (res.notInDatabase) {
//         aiMsg.text = "I couldn't find any matching products in our verified database. Try rephrasing your query or being more specific."
//       } else {
//         const products = res.results
//           ?.filter(r => r.payload)
//           .map(r => r.payload) || []

//         if (products.length > 0) {
//           aiMsg.products = products
//           aiMsg.summary = res.summary
//         }

//         if (res.summary) {
//           const s = res.summary
//           aiMsg.text = `Found products from ${s.company}: ${s.halal} Halal, ${s.haram} Haraam, ${s.mushbooh} Mushbooh.`
//         } else if (products.length > 0) {
//           aiMsg.text = `Found ${products.length} result${products.length === 1 ? '' : 's'}:`
//         } else if (res.fuzzyWarning) {
//           aiMsg.text = res.fuzzyWarning
//         } else {
//           aiMsg.text = "No results found. Try a different query."
//         }
//       }

//       setMessages(prev => [...prev, aiMsg])
//     } catch {
//       setMessages(prev => [...prev, {
//         id: nextId++,
//         role: 'ai',
//         fromWebSearch: false,
//         text: 'Failed to connect to the server. Make sure the backend is running on port 8000.',
//       }])
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="h-screen flex flex-col justify-between bg-gray-50">
//       <ChatHeader />

//       {/* CONTENT AREA */}
//       <div className="flex-1 overflow-y-auto" ref={scrollRef}>
//         <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">

//           {messages.length === 0 && <ChatIntro />}

//           {messages.map(msg => (
//             <div key={msg.id}>

//               {/* USER MESSAGE */}
//               {msg.role === 'user' && msg.text && (
//                 <ChatBubble message={msg.text} isUser />
//               )}

//               {/* AI MESSAGE */}
//               {msg.role === 'ai' && (
//                 <>
//                   {/* ── SOURCE BADGE ── shows above every AI response */}
//                   <div style={{ marginBottom: '6px', paddingLeft: '4px' }}>
//                     {msg.fromWebSearch ? (
//                       <span style={{
//                         display: 'inline-flex',
//                         alignItems: 'center',
//                         gap: '5px',
//                         padding: '3px 10px',
//                         borderRadius: '20px',
//                         border: '1px solid #F59E0B',
//                         background: '#FFFBEB',
//                         fontSize: '11px',
//                         fontWeight: 600,
//                         color: '#B45309',
//                       }}>
//                         🌐 Web Search — Unverified
//                       </span>
//                     ) : (
//                       <span style={{
//                         display: 'inline-flex',
//                         alignItems: 'center',
//                         gap: '5px',
//                         padding: '3px 10px',
//                         borderRadius: '20px',
//                         border: '1px solid #00C853',
//                         background: '#F0FBF4',
//                         fontSize: '11px',
//                         fontWeight: 600,
//                         color: '#00A846',
//                       }}>
//                         ✅ Verified Database
//                       </span>
//                     )}
//                   </div>

//                   {/* ── TEXT BUBBLE ── */}
//                   {msg.text && <ChatBubble message={msg.text} isUser={false} />}

//                   {/* ── PRODUCT CARDS ── */}
//                   {msg.products && msg.products.length > 0 && (
//                     <div className="space-y-3 mt-2">
//                       {msg.products.slice(0, 5).map((product, i) => (
//                         <ProductResult
//                           key={product.canonical_id || i}
//                           product={product}
//                           delay={i * 150}
//                           fromWebSearch={msg.fromWebSearch}
//                         />
//                       ))}

//                     </div>
//                   )}

                  
//                       {/* ── WEB RESULT CARD ── */}
// {msg.webResults && (
//   <div className="mt-2">
//     <WebResultCard text={msg.webResults} />
//   </div>
// )}
//                 </>
//               )}

//             </div>
//           ))}

//           {/* Typing indicator */}
//           {loading && (
//             <div className="flex justify-start">
//               <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl text-sm flex items-center gap-1">
//                 <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
//                 <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
//                 <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
//               </div>
//             </div>
//           )}

//         </div>
//       </div>

//       <ChatInput onSend={handleSend} disabled={loading} />
//     </div>
//   )
// }
















































'use client'

import { useState, useRef, useEffect } from 'react'
import ChatHeader from './ChatHeader'
import ChatIntro from './ChatIntro'
import ChatBubble from './ChatBubble'
import ProductResult from './ProductResult'
import ChatInput from './ChatInput'
import { queryHalal, type ProductPayload, type QuerySummary } from '@/lib/api'
import WebResultCard from './WebResultCard'

interface Message {
  id: number
  role: 'user' | 'ai'
  text?: string
  products?: ProductPayload[]
  summary?: QuerySummary | null
  webResults?: string | null
  fromWebSearch?: boolean
}

let nextId = 0

export default function ChatLayout() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, loading])


//   async function handleBarcodeScan(scannedText: string) {
//   const userMsg: Message = { 
//     id: nextId++, 
//     role: 'user', 
//     text: `📷 Scanned: ${scannedText}` 
//   }
//   setMessages(prev => [...prev, userMsg])
//   setLoading(true)

//   try {
//     const res = await fetch('http://localhost:8000/api/websearch', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ query: scannedText })
//     })
//     const data = await res.json()

//     setMessages(prev => [...prev, {
//       id: nextId++,
//       role: 'ai',
//       fromWebSearch: true,
//       text: `Barcode "${scannedText}" ke liye web results:`,
//       webResults: data.results
//     }])

//   } catch (err) {
//     setMessages(prev => [...prev, {
//       id: nextId++,
//       role: 'ai',
//       fromWebSearch: true,
//       text: 'Web search fail ho gaya.'
//     }])
//   } finally {
//     setLoading(false)
//   }
// }

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
      text: `🔍 "${searchQuery.replace(' halal or haram', '')}" ke baare mein web results:`,
      // Parsed results as formatted string
      webResults: entries.length > 0 
        ? entries.map((e, i) => 
            `  ${i+1}. ${e.title}\n     ${e.url}\n     ${e.snippet}`
          ).join('\n\n')
        : 'Koi relevant results nahi mile.'
    }])

  } catch (err) {
    setMessages(prev => [...prev, {
      id: nextId++,
      role: 'ai',
      fromWebSearch: true,
      text: 'Web search fail ho gaya.'
    }])
  } finally {
    setLoading(false)
  }
}

  async function handleSend(text: string) {
    const userMsg: Message = { id: nextId++, role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await queryHalal(text)

      console.log("✅ API RESPONSE:", res) // 🔥 debug

      const aiMsg: Message = {
        id: nextId++,
        role: 'ai',
        fromWebSearch: res.fromWebSearch ?? false,
      }

      // ❌ ERROR CASE
      if (!res.success) {
        aiMsg.text = res.error || 'Something went wrong. Please try again.'
      }

      // 🌐 WEB SEARCH CASE
      else if (res.notInDatabase && res.webResults) {
        aiMsg.text = "I couldn't find this in our verified database. Here's what I found online:"
        aiMsg.webResults = res.webResults
        aiMsg.fromWebSearch = true
      }

      // ⚠️ NO DATA CASE
      else if (res.notInDatabase) {
        aiMsg.text =
          "I couldn't find any matching products in our verified database. Try rephrasing your query or being more specific."
      }

      // ✅ DATABASE RESULTS
      else {
        const products =
          res.results?.filter(r => r.payload).map(r => r.payload) || []

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
    } catch (err) {
      console.error("❌ FRONTEND ERROR:", err)

      setMessages(prev => [
        ...prev,
        {
          id: nextId++,
          role: 'ai',
          fromWebSearch: false,
          text: 'Failed to connect to the server. Make sure the backend is running on port 8000.',
        },
      ])
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

              {/* USER MESSAGE */}
              {msg.role === 'user' && msg.text && (
                <ChatBubble message={msg.text} isUser />
              )}

              {/* AI MESSAGE */}
              {msg.role === 'ai' && (
                <>
                  {/* 🔖 SOURCE BADGE */}
                  <div style={{ marginBottom: '6px', paddingLeft: '4px' }}>
                    {msg.fromWebSearch ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        border: '1px solid #F59E0B',
                        background: '#FFFBEB',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#B45309',
                      }}>
                        🌐 Web Search — Unverified
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        border: '1px solid #00C853',
                        background: '#F0FBF4',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#00A846',
                      }}>
                        ✅ Verified Database
                      </span>
                    )}
                  </div>

                  {/* TEXT */}
                  {msg.text && (
                    <ChatBubble message={msg.text} isUser={false} />
                  )}

                  {/* PRODUCTS */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="space-y-3 mt-2">
                      {msg.products.slice(0, 5).map((product, i) => (
                        <ProductResult
                          key={product.canonical_id || i}
                          product={product}
                          delay={i * 150}
                          fromWebSearch={msg.fromWebSearch}
                        />
                      ))}
                    </div>
                  )}

                  {/* 🌐 WEB RESULTS */}
                  {msg.webResults && (
                    <div className="mt-2">
                      <WebResultCard text={msg.webResults} />
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {/* ⏳ Typing Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl text-sm flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150" />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300" />
              </div>
            </div>
          )}

        </div>
      </div> 

      {/* <ChatInput onSend={handleSend} disabled={loading} /> */}
        
        <ChatInput 
  onSend={handleSend} 
  onBarcodeScan={handleBarcodeScan}  // ⭐ yeh add karo
  disabled={loading} 
/>


    </div>
  )
}
