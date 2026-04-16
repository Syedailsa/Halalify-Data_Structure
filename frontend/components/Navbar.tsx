'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '0 24px',
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        background: scrolled ? 'rgba(240,247,244,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        boxShadow: scrolled ? '0 1px 24px rgba(0,200,83,0.08)' : 'none',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-20px)',
      }}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #00C853, #00A344)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,200,83,0.35)',
          }}>
            <span style={{ fontSize: '18px' }}>✦</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: '18px', color: '#0D1F17', letterSpacing: '-0.02em' }}>
            Halalify
          </span>
        </div>

        {/* Desktop Nav Links */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
        }} className="hidden-mobile">
          {['Features', 'How It Works', 'Trust'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              style={{
                color: '#374151',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'color 0.2s',
                position: 'relative',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#00C853')}
              onMouseLeave={e => (e.currentTarget.style.color = '#374151')}
            >
              {item}
            </a>
          ))}
        </div>

        {/* Sign In */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-primary hidden-mobile" style={{ padding: '10px 20px', fontSize: '13px' }}>
              <Link href="/login">Sign In</Link>
          </button>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              flexDirection: 'column',
              gap: '5px',
            }}
            className="show-mobile"
          >
            <span style={{
              display: 'block', width: '22px', height: '2px',
              background: '#0D1F17',
              transition: 'all 0.3s',
              transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none'
            }} />
            <span style={{
              display: 'block', width: '22px', height: '2px',
              background: '#0D1F17',
              transition: 'all 0.3s',
              opacity: menuOpen ? 0 : 1
            }} />
            <span style={{
              display: 'block', width: '22px', height: '2px',
              background: '#0D1F17',
              transition: 'all 0.3s',
              transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none'
            }} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div style={{
        position: 'absolute',
        top: '64px',
        left: 0,
        right: 0,
        background: 'rgba(240,247,244,0.98)',
        backdropFilter: 'blur(16px)',
        padding: menuOpen ? '20px 24px 24px' : '0 24px',
        maxHeight: menuOpen ? '300px' : '0',
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        borderBottom: menuOpen ? '1px solid rgba(0,200,83,0.15)' : 'none',
      }}>
        {['Features', 'How It Works', 'Trust'].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase().replace(/ /g, '-')}`}
            onClick={() => setMenuOpen(false)}
            style={{
              display: 'block',
              padding: '12px 0',
              color: '#374151',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: 500,
              borderBottom: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            {item}
          </a>
        ))}
        
        <button className="btn-primary" style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }}>
          <Link href="/login">Sign In</Link>
        </button>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  )
}
