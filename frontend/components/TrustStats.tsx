'use client'

import { useEffect, useRef, useState } from 'react'

const stats = [
  { value: '50,000+', label: 'Verified Products' },
  { value: '100K+', label: 'Active Users' },
  { value: '25+', label: 'Certification Bodies' },
  { value: '< 1 sec', label: 'Average Response' },
]

export default function TrustStats() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.25 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      id="trust"
      style={{
        padding: '100px 24px',
        background: 'linear-gradient(160deg, #F0F7F4 0%, #E8F5E9 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative */}
      <div style={{
        position: 'absolute',
        top: '-60px',
        right: '-60px',
        width: '360px',
        height: '360px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,200,83,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#0D1F17',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            Trusted by Thousands
          </h2>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '24px',
          }}
          className="stats-grid"
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center',
                background: 'white',
                borderRadius: '20px',
                padding: '36px 24px',
                boxShadow: '0 4px 24px rgba(0,200,83,0.08)',
                border: '1px solid rgba(0,200,83,0.1)',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.95)',
                transition: `all 0.7s cubic-bezier(0.4,0,0.2,1) ${0.1 + i * 0.12}s`,
              }}
              className="card-hover"
            >
              <div style={{
                fontSize: 'clamp(28px, 3.5vw, 38px)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: '#0D1F17',
                marginBottom: '8px',
                lineHeight: 1,
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#9CA3AF',
                fontWeight: 500,
                letterSpacing: '0.01em',
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 420px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
