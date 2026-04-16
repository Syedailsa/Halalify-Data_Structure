export default function ChatBubble({ message, isUser }: any) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`px-4 py-2 rounded-xl text-sm max-w-xs ${
          isUser
            ? 'bg-green-600 text-white'
            : 'bg-gray-200 text-gray-800'
        }`}
      >
        {message}
      </div>
    </div>
  )
}
