'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()

  const handleSubmit = (e: any) => {
    e.preventDefault()
    router.push('/chat') // direct chat (UI only)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">

      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow">

        {/* Toggle */}
        <div className="flex mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 ${isLogin ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
          >
            Sign In
          </button>

          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 ${!isLogin ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
          >
            Sign Up
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="email"
            placeholder="Email"
            className="w-full border p-3 rounded"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border p-3 rounded"
          />

          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              className="w-full border p-3 rounded"
            />
          )}

          <button className="w-full bg-green-600 text-white py-3 rounded-xl">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>

        </form>

      </div>
    </div>
  )
}