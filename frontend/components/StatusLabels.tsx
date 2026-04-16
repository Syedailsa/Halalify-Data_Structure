'use client'

import { useEffect, useRef, useState } from 'react'

const statuses = [
  {
    icon: '✓',
    label: 'Halal',
    desc: 'Verified safe and permissible for consumption according to Islamic law',
    bg: '#F0FFF4',
    border: 'rgba(0,200,83,0.2)',
    iconBg: '#E8F5E9',
    iconColor: '#00C853',
    badge: 'Permitted',
    badgeColor: '#00C853',
  },
  {
    icon: '✗',
    label: 'Haram',
    desc: 'Contains prohibited ingredients or substances not allowed in Islam',
    bg: '#FFF5F5',
    border: 'rgba(239,68,68,0.2)',
    iconBg: '#FEE2E2',
    iconColor: '#EF4444',
    badge: 'Prohibited',
    badgeColor: '#EF4444',
  },
  {
    icon: '?',
    label: 'Mashbooh',
    desc: 'Doubtful status — requires verification from local certifying bodies',
    bg: '#FFFBEB',
    border: 'rgba(245,158,11,0.2)',
    iconBg: '#FEF3C7',
    iconColor: '#F59E0B',
    badge: 'Doubtful',
    badgeColor: '#F59E0B',
  },
]

export default function StatusLabels() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      style={{
        padding: '100px 24px',
        background: 'white',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
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
            Understanding Status Labels
          </h2>
        </div>

        {/* Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
          }}
          className="status-grid"
        >
          {statuses.map((s, i) => (
            <div
              key={i}
              className="card-hover"
              style={{
                background: s.bg,
                borderRadius: '20px',
                padding: '32px 28px',
                border: `1.5px solid ${s.border}`,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.97)',
                transition: `all 0.7s cubic-bezier(0.4,0,0.2,1) ${0.15 + i * 0.15}s`,
              }}
            >
              {/* Icon */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: s.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                fontSize: '20px',
                fontWeight: 700,
                color: s.iconColor,
              }}>
                {s.icon}
              </div>

              {/* Label row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <h3 style={{ fontWeight: 700, fontSize: '17px', color: '#0D1F17' }}>
                  {s.label}
                </h3>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: s.badgeColor,
                  background: `${s.badgeColor}18`,
                  padding: '2px 8px',
                  borderRadius: '100px',
                  textTransform: 'uppercase',
                }}>
                  {s.badge}
                </span>
              </div>

              <p style={{
                fontSize: '13px',
                lineHeight: 1.65,
                color: '#6B7280',
              }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .status-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .status-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </section>
  )
}
