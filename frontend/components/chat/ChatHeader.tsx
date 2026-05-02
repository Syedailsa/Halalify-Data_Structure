// interface Props {
//   connected: boolean
// }

// export default function ChatHeader({ connected }: Props) {
//   return (
//     <div className="w-full flex justify-between items-center p-4 border-b">
//       <div className="flex items-center gap-2">
//         <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white">★</div>
//         <div>
//           <h2 className="font-semibold">Halalify AI</h2>
//           {connected ? (
//             <p className="text-xs text-green-600">● Online</p>
//           ) : (
//             <p className="text-xs text-amber-500">● Reconnecting...</p>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }


















interface Props {
  connected: boolean
}

export default function ChatHeader({ connected }: Props) {
  return (
    <div className="w-full flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">

      {/* LEFT SIDE */}
      <div className="flex items-center gap-3 group cursor-none">

        {/* AI ICON */}
        <div className="relative w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center text-white text-lg font-bold shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-green-300/40 overflow-hidden">

          {/* NAVBAR STYLE GLOW */}
          <span className="nav-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <span className="relative z-10">★</span>
        </div>

        {/* TEXT */}
        <div>
          <h2 className="font-bold text-gray-900 text-base tracking-tight">
            Halalify AI
          </h2>

          {connected ? (
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Online
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Reconnecting...
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE OPTIONAL ACTION */}
      <div className="hidden sm:flex items-center gap-3">

        {/* STATUS BADGE */}
        <div className="px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600 border border-gray-200 hover:border-green-300 hover:text-green-700 transition-all cursor-none">
          AI Assistant
        </div>
      </div>
    </div>
  )
}
