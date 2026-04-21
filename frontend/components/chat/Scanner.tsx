// 'use client'

// import { useEffect } from 'react'
// import { Html5QrcodeScanner } from 'html5-qrcode'

// interface Props {
//   onScan: (data: string) => void
//   onClose: () => void
// }

// export default function BarcodeScanner({ onScan, onClose }: Props) {
//   useEffect(() => {
//     const scanner = new Html5QrcodeScanner(
//       'reader',
//       { fps: 10, qrbox: 250 },
//       false
//     )

//     scanner.render(
//       (decodedText) => {
//         onScan(decodedText)
//         scanner.clear()
//         onClose()
//       },
//       (error) => {
//         // ignore scan errors
//       }
//     )

//     return () => {
//       scanner.clear().catch(() => {})
//     }
//   }, [])

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
//       <div className="bg-white p-4 rounded-lg w-[320px]">
//         <div id="reader" />
//         <button
//           onClick={onClose}
//           className="mt-3 w-full bg-red-500 text-white py-2 rounded"
//         >
//           Close
//         </button>
//       </div>
//     </div>
//   )
// }








'use client'

import { useEffect, useRef } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

interface Props {
  onScan: (code: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    let mounted = true

    const startScanner = async () => {
      try {
        const codeReader = new BrowserMultiFormatReader()

        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        const deviceId = devices?.[0]?.deviceId

        if (!videoRef.current || !mounted) return

        controlsRef.current = await codeReader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result) => {
            if (result) {
              onScan(result.getText())

              // STOP SCANNER PROPERLY
              controlsRef.current?.stop?.()
              controlsRef.current = null

              onClose()
            }
          }
        )
      } catch (err) {
        console.error('Scanner error:', err)
      }
    }

    // IMPORTANT: delay for DOM mount
    const timer = setTimeout(() => {
      startScanner()
    }, 200)

    return () => {
      mounted = false

      clearTimeout(timer)

      // STOP CAMERA STREAM
      controlsRef.current?.stop?.()
      controlsRef.current = null
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white p-3 rounded-lg w-[320px]">

        <video
          ref={videoRef}
          className="w-full rounded"
          autoPlay
          playsInline
          muted
        />

        <button
          onClick={onClose}
          className="mt-3 w-full bg-red-500 text-white py-2 rounded"
        >
          Close
        </button>

      </div>
    </div>
  )
}
