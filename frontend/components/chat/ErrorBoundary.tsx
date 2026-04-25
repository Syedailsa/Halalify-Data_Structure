'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  crashed: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false }

  static getDerivedStateFromError(): State {
    return { crashed: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.crashed) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-xs">
            An unexpected error occurred. Your conversation is safe just reload to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition"
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
