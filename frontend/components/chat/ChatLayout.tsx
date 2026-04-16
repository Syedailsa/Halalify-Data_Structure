import ChatHeader from './ChatHeader'
import ChatIntro from './ChatIntro'
import ChatBubble from './ChatBubble'
import ProductResult from './ProductResult'
import ChatInput from './ChatInput'

// export default function ChatLayout() {
//   return (
//     <div className="h-screen flex flex-col">
//       <ChatHeader />

//       <div className="flex-1 overflow-y-auto p-4 space-y-4">
//         <ChatIntro />
//         <ChatBubble message="hello" isUser />
//         <ProductResult />
//       </div>

//       <ChatInput />
//     </div>
//   )
// }


export default function ChatLayout() {
  return (
    <div className="h-screen flex flex-col justify-between bg-gray-50">
      <ChatHeader />

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto">
        
        {/* CENTER WRAPPER */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          <ChatIntro />
          <ChatBubble message="hello" isUser />
          <ProductResult />

        </div>

      </div>
      <ChatInput />

    </div>
  )
}

