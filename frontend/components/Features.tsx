// 'use client'

// import { useEffect, useRef, useState } from 'react'

// const features = [
//   {
//     icon: '📷',
//     title: 'Barcode Scan',
//     description: 'Instantly scan any product barcode to check its halal status in real-time.',
//     color: '#E8F5E9',
//     iconBg: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
//     delay: 0,
//   },
//   {
//     icon: '🖼️',
//     title: 'Image Upload',
//     description: 'Upload product images and let AI analyze ingredients and certifications.',
//     color: '#EFF6FF',
//     iconBg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
//     delay: 0.15,
//   },
//   {
//     icon: '🎙️',
//     title: 'Voice Chat with Agent',
//     description: 'Simply speak the product name and get instant verification results.',
//     color: '#FFF7ED',
//     iconBg: 'linear-gradient(135deg, #fed7aa, #fde68a)',
//     delay: 0.3,
//     faded: true,
//   },
//    {
//     icon: '🎙️',
//     title: 'Write Product or Ingredients Name',
//     description: 'Simply speak the product name and get instant verification results.',
//     color: '#FFF7ED',
//     iconBg: 'linear-gradient(135deg, #fed7aa, #fde68a)',
//     delay: 0.3,
//     faded: true,
//   },
// ]

// export default function Features() {
//   const [visible, setVisible] = useState(false)
//   const ref = useRef<HTMLElement>(null)

//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       ([entry]) => { if (entry.isIntersecting) setVisible(true) },
//       { threshold: 0.2 }
//     )
//     if (ref.current) observer.observe(ref.current)
//     return () => observer.disconnect()
//   }, [])

//   return (
//     <section
//       ref={ref}
//       id="features"
//       style={{
//         padding: '100px 24px',
//         background: 'white',
//       }}
//     >
//       <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
//         {/* Header */}
//         <div style={{ textAlign: 'center', marginBottom: '60px' }}>
//           <h2
//             style={{
//               fontSize: 'clamp(28px, 4vw, 40px)',
//               fontWeight: 800,
//               letterSpacing: '-0.02em',
//               color: '#0D1F17',
//               marginBottom: '12px',
//               opacity: visible ? 1 : 0,
//               transform: visible ? 'translateY(0)' : 'translateY(24px)',
//               transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1)',
//             }}
//           >
//             Verify Products Your Way
//           </h2>
//           <p
//             style={{
//               fontSize: '15px',
//               color: '#9CA3AF',
//               opacity: visible ? 1 : 0,
//               transform: visible ? 'translateY(0)' : 'translateY(16px)',
//               transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1) 0.15s',
//             }}
//           >
//             Multiple ways to check halal status — choose what works best for you
//           </p>
//         </div>

//         {/* Cards Grid */}
//         <div
//           style={{
//             display: 'grid',
//             gridTemplateColumns: 'repeat(3, 1fr)',
//             gap: '20px',
//           }}
//           className="features-grid"
//         >
//           {features.map((feature, i) => (
//             <div
//               key={i}
//               className="card-hover"
//               style={{
//                 background: feature.color,
//                 borderRadius: '20px',
//                 padding: '32px 28px',
//                 border: '1px solid rgba(0,0,0,0.04)',
//                 opacity: visible ? (feature.faded ? 0.65 : 1) : 0,
//                 transform: visible ? 'translateY(0)' : 'translateY(32px)',
//                 transition: `all 0.7s cubic-bezier(0.4,0,0.2,1) ${feature.delay + 0.3}s`,
//               }}
//             >
//               <div style={{
//                 width: '52px',
//                 height: '52px',
//                 borderRadius: '14px',
//                 background: feature.iconBg,
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 marginBottom: '20px',
//                 fontSize: '22px',
//                 boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
//               }}>
//                 {feature.icon}
//               </div>
//               <h3 style={{
//                 fontWeight: 700,
//                 fontSize: '16px',
//                 color: '#0D1F17',
//                 marginBottom: '8px',
//                 opacity: feature.faded ? 0.6 : 1,
//               }}>
//                 {feature.title}
//               </h3>
//               <p style={{
//                 fontSize: '13px',
//                 lineHeight: 1.65,
//                 color: feature.faded ? '#9CA3AF' : '#6B7280',
//               }}>
//                 {feature.description}
//               </p>
//             </div>
//           ))}
//         </div>
//       </div>

//       <style jsx>{`
//         @media (max-width: 768px) {
//           .features-grid {
//             grid-template-columns: 1fr !important;
//           }
//         }
//         @media (min-width: 769px) and (max-width: 1024px) {
//           .features-grid {
//             grid-template-columns: repeat(2, 1fr) !important;
//           }
//         }
//       `}</style>
//     </section>
//   )
// }
















'use client'

import { useEffect, useRef, useState } from 'react'

const features = [
  {
    title: 'Barcode Scan',
    description: 'Instantly scan any product barcode to check its halal status in real-time.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00A844" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="4" height="16" rx="0.5"/>
        <rect x="8" y="4" width="2" height="16" rx="0.5"/>
        <rect x="12" y="4" width="3" height="16" rx="0.5"/>
        <rect x="17" y="4" width="2" height="16" rx="0.5"/>
        <rect x="21" y="4" width="1" height="16" rx="0.5"/>
      </svg>
    ),
    delay: 0,
    accent: '#00C853',
    tag: 'Instant',
  },
  {
    title: 'Image Upload',
    description: 'Upload product images and let AI analyze ingredients and certifications.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00A844" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
    ),
    delay: 0.1,
    accent: '#00C853',
    tag: 'AI Powered',
  },
  {
    title: 'Voice Search',
    description: 'Simply speak the product name and get instant verification results.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00A844" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="2" width="6" height="11" rx="3"/>
        <path d="M5 10a7 7 0 0014 0"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
        <line x1="8" y1="22" x2="16" y2="22"/>
      </svg>
    ),
    delay: 0.2,
    accent: '#00C853',
    tag: 'Hands-Free',
  },
  {
    title: 'AI Chat',
    description: 'Ask questions about ingredients, certifications, and get detailed answers.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00A844" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        <line x1="9" y1="10" x2="15" y2="10"/>
        <line x1="9" y1="13" x2="13" y2="13"/>
      </svg>
    ),
    delay: 0.3,
    accent: '#00C853',
    tag: 'Smart',
  },
]

export default function Features() {
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState<number | null>(null)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      id="features"
      style={{
        padding: '100px 24px',
        background: '#F4F7F5',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0,200,83,0.1)',
            color: '#00A844',
            padding: '5px 14px',
            borderRadius: '100px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: '16px',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00C853', display: 'inline-block' }} />
            Multiple Methods
          </div>

          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 46px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#0D1F17',
            marginBottom: '14px',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1) 0.1s',
          }}>
            Verify Products{' '}
            <span style={{ color: '#00C853', position: 'relative' }}>Your Way</span>
          </h2>

          <p style={{
            fontSize: '16px',
            color: '#6B7280',
            maxWidth: '480px',
            margin: '0 auto',
            lineHeight: 1.6,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1) 0.2s',
          }}>
            Multiple ways to check halal status — choose what works best for you
          </p>
        </div>

        {/* Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
          }}
          className="features-grid"
        >
          {features.map((feature, i) => (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: hovered === i ? 'white' : 'white',
                borderRadius: '20px',
                padding: '28px 24px 24px',
                border: hovered === i
                  ? '1.5px solid rgba(0,200,83,0.4)'
                  : '1.5px solid rgba(0,0,0,0.06)',
                opacity: visible ? 1 : 0,
                transform: visible
                  ? hovered === i ? 'translateY(-6px)' : 'translateY(0)'
                  : 'translateY(32px)',
                transition: `all 0.5s cubic-bezier(0.4,0,0.2,1) ${feature.delay + 0.3}s, border 0.25s ease, box-shadow 0.25s ease`,
                boxShadow: hovered === i
                  ? '0 16px 48px rgba(0,200,83,0.12), 0 4px 16px rgba(0,0,0,0.06)'
                  : '0 2px 12px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Top accent line on hover */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #00C853, #00A344)',
                borderRadius: '20px 20px 0 0',
                opacity: hovered === i ? 1 : 0,
                transition: 'opacity 0.25s ease',
              }} />

              {/* Tag */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px',
              }}>
                {/* Icon box */}
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: hovered === i ? '#E8F5E9' : '#F0FBF4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.25s ease',
                }}>
                  {feature.icon}
                </div>

                {/* Badge */}
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#00A844',
                  background: 'rgba(0,200,83,0.08)',
                  padding: '4px 10px',
                  borderRadius: '100px',
                  letterSpacing: '0.02em',
                }}>
                  {feature.tag}
                </span>
              </div>

              <h3 style={{
                fontWeight: 700,
                fontSize: '16px',
                color: '#0D1F17',
                marginBottom: '10px',
                letterSpacing: '-0.01em',
              }}>
                {feature.title}
              </h3>

              <p style={{
                fontSize: '13px',
                lineHeight: 1.7,
                color: '#6B7280',
                margin: 0,
              }}>
                {feature.description}
              </p>

              {/* Bottom arrow on hover */}
              <div style={{
                marginTop: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#00A844',
                opacity: hovered === i ? 1 : 0,
                transform: hovered === i ? 'translateX(0)' : 'translateX(-8px)',
                transition: 'all 0.25s ease',
              }}>
                Try now
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00A844" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .features-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 641px) and (max-width: 900px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 901px) and (max-width: 1100px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </section>
  )
}