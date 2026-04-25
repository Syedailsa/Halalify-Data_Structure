import ChatLayout from '@/components/chat/ChatLayout'
import ErrorBoundary from '@/components/chat/ErrorBoundary'

export default function ChatPage() {
  return (
    <ErrorBoundary>
      <ChatLayout />
    </ErrorBoundary>
  )
}
