'use client'

import { useEffect, useRef, useState } from 'react'
import mockup from '../assests/mokeup.png'

export default function Hero() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      paddingTop: '80px',
      paddingBottom: '60px',
      background: 'linear-gradient(160deg, #F0F7F4 0%, #E8F5E9 50%, #F5FAF7 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decorative circles */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,200,83,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-80px',
        left: '-80px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,200,83,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '60px',
        alignItems: 'center',
      }} className="hero-grid">
        {/* Left Content */}
        <div>
          {/* Tag */}
          <div
            className="section-tag"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s cubic-bezier(0.4,0,0.2,1) 0.1s',
              marginBottom: '24px',
            }}
          >
            <span style={{
              width: '6px', height: '6px',
              borderRadius: '50%',
              background: '#00C853',
              display: 'inline-block',
              animation: 'pulse-green 2s ease infinite'
            }} />
            AI-Powered Halal Verification
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#0D1F17',
              marginBottom: '20px',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1) 0.2s',
            }}
          >
            Know What You<br />
            Consume.{' '}
            <span style={{
              color: '#00C853',
              position: 'relative',
              display: 'inline-block',
            }}>
              Instantly.
              <svg
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  left: 0,
                  width: '100%',
                  height: '6px',
                  opacity: visible ? 1 : 0,
                  transition: 'opacity 0.5s ease 0.9s',
                }}
                viewBox="0 0 200 6" preserveAspectRatio="none"
              >
                <path d="M0,4 Q50,0 100,4 Q150,8 200,4" stroke="#00C853" strokeWidth="2.5" fill="none" opacity="0.5" />
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.7,
              color: '#6B7280',
              maxWidth: '420px',
              marginBottom: '36px',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1) 0.35s',
            }}
          >
            Verify whether products are Halal, Haram, or Mashbooh using AI-powered technology.
            Scan, search, or upload — get instant results.
          </p>

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.7s cubic-bezier(0.4,0,0.2,1) 0.5s',
            }}
          >
            <button className="btn-primary" style={{ fontSize: '14px', padding: '13px 24px' }}>
              Start Checking
            </button>
            <button className="btn-secondary" style={{ fontSize: '14px', padding: '13px 24px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="7" height="7" rx="1"/>
                <rect x="15" y="3" width="7" height="7" rx="1"/>
                <rect x="2" y="14" width="7" height="7" rx="1"/>
                <rect x="15" y="14" width="7" height="7" rx="1"/>
              </svg>
              Scan Product
            </button>
          </div>
        </div>

        {/* Right — Chat Interface Card */}
         {/* Right — Mockup Image */}
<div
  style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
    transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1) 0.6s',
  }}
>
  <div
    className="animate-float"
    style={{
      width: '100%',
      maxWidth: '880px',
    }}
  >
    <img
      src={mockup.src} 
      alt="Halalfy App Mockup"
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
      }}
    />
  </div>
</div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </section>
  )
}
