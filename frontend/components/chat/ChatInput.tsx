'use client'

import { useState, useRef } from 'react'
import { Mic, Image as ImageIcon, Camera, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import BarcodeScanner from './Scanner'

interface ChatInputProps {
  onSend: (message: string) => void
  onBarcodeScan: (code: string) => void 
  onImageScan: (base64DataUri: string) => void
  disabled?: boolean
}

function VoiceButton() {
  return (
    <div className="w-11 h-11 rounded-full bg-green-600 flex items-center justify-center">
      <div className="flex items-end gap-[2px]">
        <span className="w-[2px] h-2 bg-white rounded animate-wave"></span>
        <span className="w-[2px] h-4 bg-white rounded animate-wave delay-75"></span>
        <span className="w-[2px] h-6 bg-white rounded animate-wave delay-150"></span>
        <span className="w-[2px] h-4 bg-white rounded animate-wave delay-200"></span>
        <span className="w-[2px] h-2 bg-white rounded animate-wave delay-300"></span>
      </div>
    </div>
  )
}

export default function ChatInput({ onSend, disabled = false, onBarcodeScan, onImageScan }: ChatInputProps) {
  const [text, setText] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const isTyping = text.trim().length > 0

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleScanResult(result: string, isImage = false) {
    setScannerOpen(false)
    if (isImage) {
      onImageScan(result)
    } else {
      onBarcodeScan(result)
    }
  }

  const MAX_IMAGE_BYTES = 8 * 1024 * 1024 // 8 MB

  function handleGalleryPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_IMAGE_BYTES) {
      alert('Image is too large (max 8 MB). Please pick a smaller photo.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => onImageScan(reader.result as string)
    reader.onerror = () => alert('Could not read the image file. Please try another.')
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="border-t bg-white">
      <div className="max-w-3xl mx-auto px-4 py-4">

        <div className="flex items-center gap-3">

          {/* Input Box */}
          <div className="flex-1 bg-gray-100 rounded-xl flex items-center px-4 py-3 gap-3">

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              type="text"
              placeholder="Ask anything or scan product..."
              className="flex-1 bg-transparent outline-none text-sm"
              disabled={disabled}
            />

            {/* Right Icons */}
            <div className="flex items-center gap-2 text-gray-500">

              {/* Gallery shortcut — opens file picker directly */}
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="hover:text-black transition"
                title="Pick from gallery"
              >
                <ImageIcon size={18} />
              </button>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleGalleryPick}
              />

              <button 
               onClick={() => setScannerOpen(true)}         
               className="hover:text-black transition"
               title="Scan or take photo"
              >
                <Camera size={18} />
              </button>

            </div>
          </div>

          {/* Dynamic Button (Mic / Send) */}
          <div className="w-12 h-12 flex items-center justify-center">

            <AnimatePresence mode="wait">

              {!isTyping ? (
                <motion.button
                  key="mic"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700"
                >
                  <VoiceButton />
                </motion.button>
              ) : (
                <motion.button
                  key="send"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={handleSend}
                  disabled={disabled}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <Send size={18} />
                </motion.button>
              )}

            </AnimatePresence>

          </div>

        </div>

      </div>

      {scannerOpen && (
        <BarcodeScanner
          onScan={handleScanResult}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  )
}
