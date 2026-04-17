// import { Mic, Image as ImageIcon, Camera, Send } from 'lucide-react'

// export default function ChatInput() {
//   return (
//     <div className="border-t bg-white">
//       <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
//         <div className="flex items-center gap-3">
          
//           {/* Voice Agent Button (LEFT) */}
      

//           {/* Input Box */}
//           <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-3 gap-3">
            
//             <input
//               type="text"
//               placeholder="Type product name or ask anything..."
//               className="flex-1 bg-transparent outline-none text-sm"
//             />

//             {/* Right Icons */}
//             <div className="flex items-center gap-2 text-gray-500">
              
//               <button className="hover:text-black transition">
//                 <ImageIcon size={18} />
//               </button>

//               <button className="hover:text-black transition">
//                 <Camera size={18} />
//               </button>
// {/* 
//               <button className="hover:text-black transition">
//                 <Mic size={18} />
//               </button> */}

//             </div>
            
//           </div>

//           {/* Send Button */}
//           <button className="w-10 h-10 flex items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 transition">
//             <Send size={18} />
//           </button>

//         </div>

//       </div>
//     </div>
//   )
// }











'use client'

import { useState } from 'react'
import { Mic, Image as ImageIcon, Camera, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'






export default function ChatInput() {

 function VoiceButton() {
  return (
    <div className="w-11 h-11 rounded-full bg-green-600 flex items-center justify-center">
      <div className="flex items-end gap-[2px]">
        <span className="w-[2px] h-2 bg-white rounded animate-wave"></span>
        <span className="w-[2px] h-3 bg-white rounded animate-wave delay-75"></span>
        <span className="w-[2px] h-4 bg-white rounded animate-wave delay-150"></span>
        <span className="w-[2px] h-3 bg-white rounded animate-wave delay-200"></span>
        <span className="w-[2px] h-2 bg-white rounded animate-wave delay-300"></span>
      </div>
    </div>
  )
}


  const [text, setText] = useState('')

  const isTyping = text.trim().length > 0

  return (
    <div className="border-t bg-white">
      <div className="max-w-3xl mx-auto px-4 py-4">

        <div className="flex items-center gap-3">

          {/* Input Box */}
          <div className="flex-1 bg-gray-100 rounded-xl flex items-center px-4 py-3 gap-3">

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              type="text"
              placeholder="Ask anything or scan product..."
              className="flex-1 bg-transparent outline-none text-sm"
            />

            {/* Right Icons */}
            <div className="flex items-center gap-2 text-gray-500">

              <button className="hover:text-black transition">
                <ImageIcon size={18} />
              </button>

              <button className="hover:text-black transition">
                <Camera size={18} />
              </button>

            </div>
          </div>

          {/* Dynamic Button (Mic ↔ Send) */}
          <div className="w-12 h-12 flex items-center justify-center">

            <AnimatePresence mode="wait">

              {!isTyping ? (
                // 🎤 VOICE MODE
                <motion.button
                  key="mic"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-11 h-11 flex items-center justify-center rounded-full  bg-green-600 text-white hover:bg-green-700"
                >
                  <VoiceButton />
                </motion.button>
              ) : (
                // 🚀 SEND MODE
                <motion.button
                  key="send"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700"
                >
                  <Send size={18} />
                </motion.button>
              )}

            </AnimatePresence>

          </div>

        </div>

      </div>
    </div>
  )
}

