'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  message: string
  isUser: boolean
}

export default function ChatBubble({ message, isUser }: Props) {
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="px-4 py-2.5 rounded-xl text-sm max-w-sm bg-green-600 text-white whitespace-pre-wrap break-words">
          {message}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="px-4 py-3 rounded-xl text-sm max-w-2xl bg-gray-200 text-gray-800 break-words prose-ai">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => (
              <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-900">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic text-gray-700">{children}</em>
            ),
            ul: ({ children }) => (
              <ul className="mt-1 mb-2 space-y-1 pl-4 list-disc">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mt-1 mb-2 space-y-1 pl-4 list-decimal">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed">{children}</li>
            ),
            h1: ({ children }) => (
              <h1 className="text-base font-bold text-gray-900 mt-3 mb-1 first:mt-0">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-sm font-bold text-gray-900 mt-3 mb-1 first:mt-0">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold text-gray-800 mt-2 mb-1 first:mt-0">{children}</h3>
            ),
            code: ({ children, className }) => {
              const isBlock = className?.includes('language-')
              return isBlock ? (
                <code className="block bg-gray-100 text-gray-800 text-xs rounded-lg px-3 py-2 my-2 overflow-x-auto font-mono">
                  {children}
                </code>
              ) : (
                <code className="bg-gray-100 text-gray-800 text-xs rounded px-1.5 py-0.5 font-mono">
                  {children}
                </code>
              )
            },
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-green-500 pl-3 my-2 text-gray-600 italic">
                {children}
              </blockquote>
            ),
            hr: () => <hr className="my-3 border-gray-300" />,
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-700 underline underline-offset-2 hover:text-green-900"
              >
                {children}
              </a>
            ),
          }}
        >
          {message}
        </ReactMarkdown>
      </div>
    </div>
  )
}
