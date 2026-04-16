'use client'

import { useEffect, useRef, useState } from 'react'

const features = [
  {
    icon: '📷',
    title: 'Barcode Scan',
    description: 'Instantly scan any product barcode to check its halal status in real-time.',
    color: '#E8F5E9',
    iconBg: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
    delay: 0,
  },
  {
    icon: '🖼️',
    title: 'Image Upload',
    description: 'Upload product images and let AI analyze ingredients and certifications.',
    color: '#EFF6FF',
    iconBg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
    delay: 0.15,
  },
  {
    icon: '🎙️',
    title: 'Voice Chat with Agent',
    description: 'Simply speak the product name and get instant verification results.',
    color: '#FFF7ED',
    iconBg: 'linear-gradient(135deg, #fed7aa, #fde68a)',
    delay: 0.3,
    faded: true,
  },
]

export default function Features() {
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
      id="features"
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
            Verify Products Your Way
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
            Multiple ways to check halal status — choose what works best for you
          </p>
        </div>

        {/* Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
          }}
          className="features-grid"
        >
          {features.map((feature, i) => (
            <div
              key={i}
              className="card-hover"
              style={{
                background: feature.color,
                borderRadius: '20px',
                padding: '32px 28px',
                border: '1px solid rgba(0,0,0,0.04)',
                opacity: visible ? (feature.faded ? 0.65 : 1) : 0,
                transform: visible ? 'translateY(0)' : 'translateY(32px)',
                transition: `all 0.7s cubic-bezier(0.4,0,0.2,1) ${feature.delay + 0.3}s`,
              }}
            >
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: feature.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                fontSize: '22px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}>
                {feature.icon}
              </div>
              <h3 style={{
                fontWeight: 700,
                fontSize: '16px',
                color: '#0D1F17',
                marginBottom: '8px',
                opacity: feature.faded ? 0.6 : 1,
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: '13px',
                lineHeight: 1.65,
                color: feature.faded ? '#9CA3AF' : '#6B7280',
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .features-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </section>
  )
}
