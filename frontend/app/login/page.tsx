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









// LOGIN PAGE BUTTONS + INPUTS PAR SAME NAVBAR JESA CURSOR HOVER EFFECT

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const dot = document.getElementById('cursor-dot')
    const ring = document.getElementById('cursor-ring')

    const moveCursor = (e: MouseEvent) => {
      if (dot) {
        dot.style.left = `${e.clientX}px`
        dot.style.top = `${e.clientY}px`
      }

      if (ring) {
        ring.style.left = `${e.clientX}px`
        ring.style.top = `${e.clientY}px`
      }
    }

    // SAME HOVER EFFECT AS NAVBAR
    const addHover = () => document.body.classList.add('cursor-hover')
    const removeHover = () => document.body.classList.remove('cursor-hover')

    window.addEventListener('mousemove', moveCursor)

    const hoverElements = document.querySelectorAll(
      'button, input, a, .hover-glow'
    )

    hoverElements.forEach((el) => {
      el.addEventListener('mouseenter', addHover)
      el.addEventListener('mouseleave', removeHover)
    })

    return () => {
      window.removeEventListener('mousemove', moveCursor)

      hoverElements.forEach((el) => {
        el.removeEventListener('mouseenter', addHover)
        el.removeEventListener('mouseleave', removeHover)
      })
    }
  }, [])

  const handleSubmit = (e: any) => {
    e.preventDefault()
    router.push('/chat')
  }

  return (
    <>
      {/* CUSTOM CURSOR */}
      <div id="cursor-dot"></div>
      <div id="cursor-ring"></div>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">

          {/* TITLE */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-gray-500 mt-2">
              {isLogin
                ? 'Sign in to continue your halal journey'
                : 'Join Halalify today'}
            </p>
          </div>

          {/* TOGGLE */}
          <div className="flex mb-6 rounded-2xl overflow-hidden border border-gray-200">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 font-semibold transition-all relative hover-glow ${
                isLogin
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <span className="nav-glow" />
              Sign In
            </button>

            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 font-semibold transition-all relative hover-glow ${
                !isLogin
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <span className="nav-glow" />
              Sign Up
            </button>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {!isLogin && (
              <div className="relative hover-glow">
                <span className="nav-glow" />
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full border border-gray-300 p-3 rounded-xl outline-none focus:border-green-500 transition-all"
                />
              </div>
            )}

            <div className="relative hover-glow">
              <span className="nav-glow" />
              <input
                type="email"
                placeholder="Email"
                className="w-full border border-gray-300 p-3 rounded-xl outline-none focus:border-green-500 transition-all"
              />
            </div>

            <div className="relative hover-glow">
              <span className="nav-glow" />
              <input
                type="password"
                placeholder="Password"
                className="w-full border border-gray-300 p-3 rounded-xl outline-none focus:border-green-500 transition-all"
              />
            </div>

            {/* MAIN BUTTON */}
            <button className="w-full bg-green-600 hover:bg-green-700 transition-all text-white py-3 rounded-xl font-semibold relative hover-glow overflow-hidden">
              <span className="nav-glow" />
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>

          </form>
        </div>
      </div>
    </>
  )
}
