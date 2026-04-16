'use client'

import { useEffect, useRef, useState } from 'react'

const steps = [
  {
    num: '01',
    title: 'Input Product',
    desc: 'Scan barcode, upload image, type name, or use voice search',
    icon: '📦',
  },
  {
    num: '02',
    title: 'System Check',
    desc: 'Our database searches for verified halal certifications',
    icon: '🔍',
  },
  {
    num: '03',
    title: 'AI Analysis',
    desc: 'If not found, AI performs web search and ingredient analysis',
    icon: '🤖',
  },
  {
    num: '04',
    title: 'Get Results',
    desc: 'Receive instant halal, haram, or mashbooh status with details',
    icon: '✅',
  },
]

export default function HowItWorks() {
  const [visible, setVisible] = useState(false)
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
      id="how-it-works"
      style={{
        padding: '100px 24px',
        background: 'linear-gradient(160deg, #E8F5E9 0%, #F0FFF4 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '5%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,200,83,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '72px' }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#0D1F17',
              marginBottom: '12px',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            How It Works
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: '#9CA3AF',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1) 0.15s',
            }}
          >
            Simple, fast, and accurate verification in 4 easy steps
          </p>
        </div>

        {/* Steps */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '24px',
            position: 'relative',
          }}
          className="steps-grid"
        >
          {/* Connector Line */}
          <div
            className="steps-connector"
            style={{
              position: 'absolute',
              top: '28px',
              left: '12.5%',
              right: '12.5%',
              height: '1px',
              background: 'linear-gradient(90deg, #00C853, #C8E6C9, #00C853)',
              opacity: visible ? 0.4 : 0,
              transition: 'opacity 0.8s ease 0.8s',
            }}
          />

          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center',
                position: 'relative',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(32px)',
                transition: `all 0.7s cubic-bezier(0.4,0,0.2,1) ${0.2 + i * 0.15}s`,
              }}
            >
              {/* Step number badge */}
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: visible ? 'linear-gradient(135deg, rgba(0,200,83,0.15), rgba(0,200,83,0.05))' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                border: '2px solid rgba(0,200,83,0.2)',
                position: 'relative',
                zIndex: 1,
                transition: 'background 0.5s ease',
              }}>
                <span style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  color: 'rgba(0,200,83,0.4)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}>
                  {step.num}
                </span>
              </div>

              <h3 style={{
                fontWeight: 700,
                fontSize: '15px',
                color: '#0D1F17',
                marginBottom: '8px',
              }}>
                {step.title}
              </h3>
              <p style={{
                fontSize: '13px',
                lineHeight: 1.65,
                color: '#9CA3AF',
                maxWidth: '180px',
                margin: '0 auto',
              }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .steps-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .steps-connector {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .steps-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
