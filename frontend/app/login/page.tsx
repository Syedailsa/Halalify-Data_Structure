// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'

// export default function LoginPage() {
//   const [isLogin, setIsLogin] = useState(true)
//   const router = useRouter()

//   const handleSubmit = (e: any) => {
//     e.preventDefault()
//     router.push('/chat') // direct chat (UI only)
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50">

//       <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow">

//         {/* Toggle */}
//         <div className="flex mb-6">
//           <button
//             onClick={() => setIsLogin(true)}
//             className={`flex-1 py-2 ${isLogin ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
//           >
//             Sign In
//           </button>

//           <button
//             onClick={() => setIsLogin(false)}
//             className={`flex-1 py-2 ${!isLogin ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
//           >
//             Sign Up
//           </button>
//         </div>

//         {/* FORM */}
//         <form onSubmit={handleSubmit} className="space-y-4">

//           <input
//             type="email"
//             placeholder="Email"
//             className="w-full border p-3 rounded"
//           />

//           <input
//             type="password"
//             placeholder="Password"
//             className="w-full border p-3 rounded"
//           />

//           {!isLogin && (
//             <input
//               type="text"
//               placeholder="Full Name"
//               className="w-full border p-3 rounded"
//             />
//           )}

//           <button className="w-full bg-green-600 text-white py-3 rounded-xl">
//             {isLogin ? 'Sign In' : 'Create Account'}
//           </button>

//         </form>

//       </div>
//     </div>
//   )
// }












'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPass, setShowPass] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push('/chat')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0F4F8',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>

      {/* Logo */}
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '18px',
        background: 'linear-gradient(135deg, #00C853, #00A344)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        boxShadow: '0 8px 24px rgba(0,200,83,0.35)',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: '26px',
        fontWeight: 800,
        color: '#0D1F17',
        letterSpacing: '-0.02em',
        marginBottom: '8px',
        textAlign: 'center',
      }}>
        {isLogin ? 'Welcome Back' : 'Create Account'}
      </h1>
      <p style={{
        fontSize: '14px',
        color: '#6B7280',
        marginBottom: '28px',
        textAlign: 'center',
      }}>
        {isLogin
          ? 'Sign in to continue verifying halal products'
          : 'Start verifying halal products today'}
      </p>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'white',
        borderRadius: '24px',
        padding: '28px 24px',
        boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
      }}>

        <form onSubmit={handleSubmit}>

          {/* Sign Up only: Full Name */}
          {!isLogin && (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                placeholder="Ahmed Khan"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#00C853')}
                onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#00C853')}
              onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: isLogin ? '8px' : '16px' }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                style={{ ...inputStyle, paddingRight: '44px' }}
                onFocus={e => (e.target.style.borderColor = '#00C853')}
                onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                  fontSize: '16px',
                  padding: 0,
                }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Forgot Password — Login only */}
          {isLogin && (
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <button type="button" style={{
                background: 'none',
                border: 'none',
                color: '#00A844',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}>
                Forgot Password?
              </button>
            </div>
          )}

          {/* Agree Terms — Signup only */}
          {!isLogin && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}>
              <div
                onClick={() => setAgreed(!agreed)}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: `2px solid ${agreed ? '#00C853' : '#9CA3AF'}`,
                  background: agreed ? '#00C853' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
              >
                {agreed && (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="white">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <span style={{ fontSize: '13px', color: '#374151' }}>
                I agree to the{' '}
                <span style={{ color: '#00A844', fontWeight: 600, cursor: 'pointer' }}>Terms of Service</span>
                {' '}and{' '}
                <span style={{ color: '#00A844', fontWeight: 600, cursor: 'pointer' }}>Privacy Policy</span>
              </span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #00C853, #00A344)',
              color: 'white',
              fontWeight: 700,
              fontSize: '15px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(0,200,83,0.4)',
              transition: 'all 0.2s',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 28px rgba(0,200,83,0.5)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(0,200,83,0.4)'
            }}
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '20px 0',
        }}>
          <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }} />
        </div>

        {/* Google Button */}
        <button
          type="button"
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: '14px',
            background: 'white',
            border: '1.5px solid #E5E7EB',
            color: '#374151',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#00C853'
            ;(e.currentTarget as HTMLButtonElement).style.background = '#F9FFFE'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'white'
          }}
        >
          {/* Google SVG icon */}
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Toggle Link */}
        <p style={{
          textAlign: 'center',
          fontSize: '13px',
          color: '#6B7280',
          marginTop: '20px',
          marginBottom: 0,
        }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: 'none',
              border: 'none',
              color: '#00A844',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>

      {/* Back to Home */}
      <button
        type="button"
        onClick={() => router.push('/')}
        style={{
          marginTop: '24px',
          background: 'none',
          border: 'none',
          color: '#6B7280',
          fontSize: '13px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'inherit',
        }}
      >
        ← Back to Home
      </button>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: '#0D1F17',
  marginBottom: '8px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 16px',
  borderRadius: '12px',
  border: '1.5px solid #E5E7EB',
  fontSize: '14px',
  color: '#0D1F17',
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: 'inherit',
  background: '#FAFAFA',
  boxSizing: 'border-box',
}