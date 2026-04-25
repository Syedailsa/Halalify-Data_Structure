interface Props {
  connected: boolean
}

export default function ChatHeader({ connected }: Props) {
  return (
    <div className="w-full flex justify-between items-center p-4 border-b">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white">★</div>
        <div>
          <h2 className="font-semibold">Halalify AI</h2>
          {connected ? (
            <p className="text-xs text-green-600">● Online</p>
          ) : (
            <p className="text-xs text-amber-500">● Reconnecting...</p>
          )}
        </div>
      </div>
    </div>
  )
}
