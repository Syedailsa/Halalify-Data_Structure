'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { X, Camera, ImageIcon } from 'lucide-react'

interface Props {
  onScan: (result: string, isImage?: boolean) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const controlsRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [flash, setFlash] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

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
              setFlash(true)
              setTimeout(() => {
                controlsRef.current?.stop?.()
                controlsRef.current = null
                onScan(result.getText(), false) // QR string, not an image
                onClose()
              }, 300)
            }
          }
        )
      } catch (err: any) {
        console.error('Scanner error:', err)
        const denied =
          err?.name === 'NotAllowedError' ||
          err?.name === 'PermissionDeniedError' ||
          (err?.message || '').toLowerCase().includes('permission')
        setCameraError(
          denied
            ? 'Camera access denied. Please allow camera permission in your browser settings.'
            : 'Could not start camera. Make sure no other app is using it.'
        )
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

  // Vision mode

  function handleCapturePhoto() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)

    const dataUri = canvas.toDataURL('image/jpeg', 0.85)

    controlsRef.current?.stop?.()
    controlsRef.current = null
    onScan(dataUri, true) // base64 image → vision
    onClose()
  }

  // ── Gallery picker ─────────────────────────────────────────────────────────
  const MAX_IMAGE_BYTES = 8 * 1024 * 1024 // 8 MB

  async function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_IMAGE_BYTES) {
      alert('Image is too large (max 8 MB). Please pick a smaller photo.')
      return
    }

    let dataUri: string
    try {
      dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('File read failed'))
        reader.readAsDataURL(file)
      })
    } catch {
      alert('Could not read the image file. Please try another.')
      return
    }

    // Try QR decode on the image first
    try {
      const img = new Image()
      img.src = dataUri
      await new Promise((res) => { img.onload = res })

      const offscreen = document.createElement('canvas')
      offscreen.width = img.naturalWidth
      offscreen.height = img.naturalHeight
      offscreen.getContext('2d')!.drawImage(img, 0, 0)

      const codeReader = new BrowserMultiFormatReader()
      const result = await codeReader.decodeFromCanvas(offscreen)

      controlsRef.current?.stop?.()
      controlsRef.current = null
      onScan(result.getText(), false) // it was a QR image
    } catch {
      // Not a QR — treat as vision image
      controlsRef.current?.stop?.()
      controlsRef.current = null
      onScan(dataUri, true)
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <span className="text-white text-sm font-medium">
          Scan barcode / QR — or take a photo
        </span>
        <button onClick={onClose} className="text-white p-1">
          <X size={22} />
        </button>
      </div>

      {/* Camera feed */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {cameraError ? (
          <div className="flex flex-col items-center gap-4 px-8 text-center">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-3xl">📷</div>
            <p className="text-white text-sm leading-relaxed">{cameraError}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white/20 text-white rounded-xl text-sm hover:bg-white/30 transition"
            >
              Pick from gallery instead
            </button>
          </div>
        ) : (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        )}

        {/* Scan-frame overlay */}
        {!cameraError && <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`relative w-64 h-64 rounded-xl transition-colors duration-300 ${
            flash ? 'bg-green-400/20' : ''
          }`}>
            <span className={`absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 rounded-tl-xl transition-colors ${flash ? 'border-green-300' : 'border-white'}`} />
            <span className={`absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 rounded-tr-xl transition-colors ${flash ? 'border-green-300' : 'border-white'}`} />
            <span className={`absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 rounded-bl-xl transition-colors ${flash ? 'border-green-300' : 'border-white'}`} />
            <span className={`absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 rounded-br-xl transition-colors ${flash ? 'border-green-300' : 'border-white'}`} />
          </div>
        </div>}

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom buttons */}
      <div className="bg-black/80 px-6 py-5 flex items-center justify-around">

        {/* Gallery */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <ImageIcon size={22} />
          </div>
          <span className="text-xs text-white/70">Gallery</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleGalleryChange}
        />

        {/* Capture / Analyze */}
        <button
          onClick={handleCapturePhoto}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border-4 border-green-400">
            <Camera size={28} className="text-black" />
          </div>
          <span className="text-xs text-white/70">Analyze</span>
        </button>

        {/* Spacer */}
        <div className="w-12" />
      </div>

    </div>
  )
}
