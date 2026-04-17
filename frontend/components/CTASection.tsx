'use client'

import { useEffect, useRef, useState } from 'react'

export default function CTASection() {
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
      style={{
        padding: '80px 24px 100px',
        background: 'white',
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #00C853 0%, #00A344 50%, #009138 100%)',
            borderRadius: '28px',
            padding: 'clamp(48px, 6vw, 80px) clamp(32px, 6vw, 80px)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.97)',
            transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: '0 32px 80px rgba(0,200,83,0.3)',
          }}
        >
          {/* Decorative orbs */}
          <div style={{
            position: 'absolute',
            top: '-60px', right: '-60px',
            width: '280px', height: '280px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-80px', left: '-40px',
            width: '300px', height: '300px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2
              style={{
                fontSize: 'clamp(24px, 4vw, 42px)',
                fontWeight: 800,
                color: 'white',
                letterSpacing: '-0.02em',
                marginBottom: '14px',
                lineHeight: 1.15,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1) 0.2s',
              }}
            >
              Start Verifying Your Food Today
            </h2>
            <p
              style={{
                fontSize: '15px',
                color: 'rgba(255,255,255,0.8)',
                marginBottom: '36px',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(16px)',
                transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1) 0.35s',
              }}
            >
              Join thousands of users making informed halal choices every day
            </p>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(16px)',
                transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1) 0.5s',
              }}
            >
              <button
                style={{
                  background: 'white',
                  color: '#00A344',
                  padding: '14px 32px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.16)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'
                }}
              >
                Get Started Free
              </button>
              <button
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  padding: '14px 32px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '14px',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.25)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer style={{
      background: 'rgba(248,246,246,1)',
      color: 'rgba(255,255,255,0.5)',
      textAlign: 'center',
      padding: '24px',
      fontSize: '13px',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' ,color:'black'}}>
        © 2024 Halalify. All rights reserved.
      </div>
    </footer>
  )
}
