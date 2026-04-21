// 'use client'

// import { useEffect, useState } from 'react'

// interface WebResultCardProps {
//   text: string
//   delay?: number
// }

// export default function WebResultCard({ text, delay = 0 }: WebResultCardProps) {
//   const [visible, setVisible] = useState(false)

//   useEffect(() => {
//     const t = setTimeout(() => setVisible(true), delay)
//     return () => clearTimeout(t)
//   }, [delay])

//   return (
//     <div style={{
//       opacity: visible ? 1 : 0,
//       transform: visible ? 'translateY(0)' : 'translateY(16px)',
//       transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
//     }}>
//       <div style={{
//         background: 'white',
//         borderRadius: '16px',
//         overflow: 'hidden',
//         border: '1.5px solid #fcd34d',   // amber — same as mushbooh/web
//       }}>

//         {/* Header */}
//         <div style={{
//           background: '#FFFBEB',
//           padding: '14px 16px',
//           display: 'flex',
//           alignItems: 'flex-start',
//           gap: '12px',
//           borderBottom: '1px solid #fde68a',
//         }}>
//           {/* Icon */}
//           <div style={{
//             width: '42px', height: '42px',
//             borderRadius: '10px',
//             background: '#fef3c7',
//             display: 'flex', alignItems: 'center',
//             justifyContent: 'center',
//             fontSize: '20px', flexShrink: 0,
//           }}>
//             🌐
//           </div>

//           <div>
//             <div style={{ fontWeight: 700, fontSize: '15px', color: '#0D1F17', marginBottom: '4px' }}>
//               Web Search Result
//             </div>
//             <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
//               {/* Unverified badge */}
//               <span style={{
//                 padding: '3px 12px',
//                 borderRadius: '20px',
//                 border: '1.5px solid #F59E0B',
//                 color: '#B45309',
//                 fontSize: '12px',
//                 fontWeight: 600,
//                 background: 'white',
//                 display: 'inline-flex', alignItems: 'center', gap: '4px',
//               }}>
//                 🌐 Web Search — Unverified
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Content */}
//         <div style={{ padding: '14px 16px' }}>
//           <p style={{
//             fontSize: '13px',
//             color: '#374151',
//             lineHeight: '1.7',
//             margin: 0,
//             whiteSpace: 'pre-wrap',
//           }}>
//             {text}
//           </p>
//         </div>

//         {/* Footer */}
//         <div style={{
//           background: '#FFFBEB',
//           padding: '9px 14px',
//           borderTop: '1px solid #fde68a',
//           fontSize: '12px',
//           color: '#92400e',
//           display: 'flex',
//           gap: '6px',
//           alignItems: 'flex-start',
//         }}>
//           <span style={{ fontSize: '13px', flexShrink: 0 }}>⚠️</span>
//           <span>
//             This result is from web search and is NOT verified. Always confirm halal 
//             certification from a trusted authority like JAKIM, IFANCA, or your local body.
//           </span>
//         </div>

//       </div>
//     </div>
//   )
// }

















'use client'

import { useEffect, useState } from 'react'

interface WebResult {
  title: string
  url: string
  snippet: string
  domain?: string
}

interface WebResultCardProps {
  text: string
  delay?: number
}

function parseResults(raw: string): WebResult[] {
  if (!raw) return []

  const blocks = raw.split(/\n(?=\s*\d+\.)/).filter(Boolean)

  return blocks.map(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)

    const titleMatch = lines.find(l => /^\d+\./.test(l))
    const title = titleMatch?.replace(/^\d+\.\s*/, '').trim() || ''

    const urlLine = lines.find(l => l.startsWith('http'))
    const url = urlLine?.trim() || ''

    const snippet = lines
      .filter(l => l !== titleMatch && l !== urlLine)
      .join(' ')
      .slice(0, 160)

    let domain = ''
    try {
      domain = new URL(url).hostname.replace('www.', '')
    } catch {}

    return { title, url, snippet, domain }
  }).filter(r => r.title && r.url)
}

export default function WebResultCard({ text, delay = 0 }: WebResultCardProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  const results = parseResults(text)

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '0.5px solid #fcd34d',
        }}
      >

        {/* Header */}
        <div
          style={{
            background: '#FFFBEB',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '0.5px solid #fde68a',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              flexShrink: 0,
            }}
          >
            🌐
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: '15px', margin: '0 0 4px', color: '#0D1F17' }}>
              Web Search Results
            </p>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 10px',
                borderRadius: '20px',
                border: '0.5px solid #F59E0B',
                color: '#92400e',
                background: 'white',
              }}
            >
              🌐 Web Search — Unverified
            </span>
          </div>
        </div>

        {/* Results */}
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {results.length > 0 ? (
            results.map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '0.5px solid #e5e7eb',
                  background: '#f9fafb',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#1d4ed8', margin: '0 0 3px' }}>
                  {r.title}
                </p>

                {r.domain && (
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 6px' }}>
                    {r.domain}
                  </p>
                )}

                {r.snippet && (
                  <p style={{ fontSize: '12px', color: '#374151', margin: 0, lineHeight: '1.6' }}>
                    {r.snippet}
                  </p>
                )}
              </a>
            ))
          ) : (
            <p style={{ fontSize: '13px', color: '#374151', whiteSpace: 'pre-wrap', margin: 0 }}>
              {text}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            background: '#FFFBEB',
            padding: '9px 14px',
            borderTop: '0.5px solid #fde68a',
            fontSize: '12px',
            color: '#92400e',
            display: 'flex',
            gap: '6px',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ flexShrink: 0 }}>⚠️</span>
          <span>
            Web results are unverified. Always confirm halal certification from JAKIM, IFANCA, or your local authority.
          </span>
        </div>
      </div>
    </div>
  )
}

