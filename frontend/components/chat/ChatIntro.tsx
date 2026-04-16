// export default function ChatIntro() {
//   const items = [
//     "Typing product name",
//     "Scanning barcode",
//     "Uploading image",
//     "Using voice"
//   ]

//   return (
//     <div className="bg-green-50 border border-green-400 rounded-2xl p-6 max-w-xl mx-auto">
//       <h2 className="text-center font-semibold text-lg">
//         How can I help you today?
//       </h2>
//       <p className="text-center text-sm text-gray-500 mb-4">
//         You can check any product by:
//       </p>

//       <div className="grid grid-cols-2 gap-3">
//         {items.map((item, i) => (
//           <div key={i} className="bg-white rounded-xl p-3 text-sm shadow">
//             {item}
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }








export default function ChatIntro() {
  const items = [
    { icon: "✏️", label: "Typing product name" },
    { icon: "📷", label: "Scanning barcode" },
    { icon: "🖼️", label: "Uploading image" },
    { icon: "🎙️", label: "Using voice" },
  ]

  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 max-w-xl mx-auto">
      <h2 className="text-center font-semibold text-lg">
        How can I help you today?
      </h2>
      <p className="text-center text-sm text-gray-500 mb-4">
        You can check any product by:
      </p>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item, i) => (
          <div key={i} className="bg-white rounded-xl p-3 text-sm shadow flex items-center gap-3">
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}