'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  PenTool, Type, Upload, Trash2, Download, 
  Save, RotateCcw, Palette, Check, X
} from 'lucide-react'

interface SignatureData {
  type: 'draw' | 'type' | 'upload'
  data: string
  name?: string
  date?: string
}

interface DigitalSignatureProps {
  onSignatureCreated: (signature: SignatureData) => void
  signerName?: string
}

const SIGNATURE_FONTS = [
  { name: 'Dancing Script', style: 'font-dancing' },
  { name: 'Great Vibes', style: 'font-great-vibes' },
  { name: 'Pacifico', style: 'font-pacifico' },
  { name: 'Satisfy', style: 'font-satisfy' },
]

const SIGNATURE_COLORS = [
  '#000000', // Black
  '#1a365d', // Navy
  '#2563eb', // Blue
  '#7c3aed', // Purple
]

export default function DigitalSignature({ onSignatureCreated, signerName = '' }: DigitalSignatureProps) {
  const [mode, setMode] = useState<'draw' | 'type' | 'upload'>('draw')
  const [typedName, setTypedName] = useState(signerName)
  const [selectedFont, setSelectedFont] = useState(0)
  const [selectedColor, setSelectedColor] = useState('#000000')
  const [isDrawing, setIsDrawing] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [savedSignatures, setSavedSignatures] = useState<SignatureData[]>([])
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)

  // Load saved signatures
  useEffect(() => {
    const saved = localStorage.getItem('savedSignatures')
    if (saved) {
      setSavedSignatures(JSON.parse(saved))
    }
  }, [])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    
    const context = canvas.getContext('2d')
    if (!context) return

    context.scale(2, 2)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle = selectedColor
    context.lineWidth = 2
    contextRef.current = context

    // Clear canvas
    context.fillStyle = 'white'
    context.fillRect(0, 0, canvas.width, canvas.height)
  }, [mode])

  // Update stroke color
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = selectedColor
    }
  }, [selectedColor])

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!contextRef.current || !canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = ('touches' in e) 
      ? e.touches[0].clientX - rect.left 
      : e.nativeEvent.offsetX
    const y = ('touches' in e)
      ? e.touches[0].clientY - rect.top
      : e.nativeEvent.offsetY

    contextRef.current.beginPath()
    contextRef.current.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = ('touches' in e)
      ? e.touches[0].clientX - rect.left
      : e.nativeEvent.offsetX
    const y = ('touches' in e)
      ? e.touches[0].clientY - rect.top
      : e.nativeEvent.offsetY

    contextRef.current.lineTo(x, y)
    contextRef.current.stroke()
  }

  const stopDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath()
    }
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const context = contextRef.current
    if (!canvas || !context) return

    context.fillStyle = 'white'
    context.fillRect(0, 0, canvas.width / 2, canvas.height / 2)
  }

  const getSignatureData = (): SignatureData | null => {
    if (mode === 'draw') {
      const canvas = canvasRef.current
      if (!canvas) return null
      
      return {
        type: 'draw',
        data: canvas.toDataURL('image/png'),
        name: signerName,
        date: new Date().toISOString()
      }
    } else if (mode === 'type') {
      if (!typedName.trim()) return null
      
      // Create canvas for typed signature
      const canvas = document.createElement('canvas')
      canvas.width = 400
      canvas.height = 100
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.fillStyle = selectedColor
      ctx.font = `italic 48px ${SIGNATURE_FONTS[selectedFont].name}, cursive`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(typedName, canvas.width / 2, canvas.height / 2)
      
      return {
        type: 'type',
        data: canvas.toDataURL('image/png'),
        name: typedName,
        date: new Date().toISOString()
      }
    } else if (mode === 'upload' && uploadedImage) {
      return {
        type: 'upload',
        data: uploadedImage,
        name: signerName,
        date: new Date().toISOString()
      }
    }
    
    return null
  }

  const handleApply = () => {
    const signature = getSignatureData()
    if (signature) {
      onSignatureCreated(signature)
    }
  }

  const handleSave = () => {
    const signature = getSignatureData()
    if (signature) {
      const updated = [signature, ...savedSignatures.filter((_, i) => i < 4)]
      setSavedSignatures(updated)
      localStorage.setItem('savedSignatures', JSON.stringify(updated))
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const useSavedSignature = (signature: SignatureData) => {
    onSignatureCreated(signature)
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4 text-white">
        <div className="flex items-center gap-3">
          <PenTool className="w-6 h-6" />
          <div>
            <h2 className="font-semibold text-lg">Digital Signature</h2>
            <p className="text-white/80 text-sm">Sign documents electronically</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Mode Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'draw', label: 'Draw', icon: PenTool },
            { id: 'type', label: 'Type', icon: Type },
            { id: 'upload', label: 'Upload', icon: Upload },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors ${
                mode === tab.id 
                  ? 'bg-violet-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Color Selection */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Color:</span>
          <div className="flex gap-2">
            {SIGNATURE_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${
                  selectedColor === color ? 'scale-110 border-violet-500' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Draw Mode */}
        {mode === 'draw' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Draw your signature below</p>
              <button onClick={clearCanvas} className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1">
                <RotateCcw className="w-4 h-4" /> Clear
              </button>
            </div>
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-crosshair bg-white touch-none"
              style={{ touchAction: 'none' }}
            />
          </div>
        )}

        {/* Type Mode */}
        {mode === 'type' && (
          <div className="space-y-4">
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Type your name"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-lg"
            />
            
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Choose a style:</p>
              <div className="grid grid-cols-2 gap-2">
                {SIGNATURE_FONTS.map((font, index) => (
                  <button
                    key={font.name}
                    onClick={() => setSelectedFont(index)}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      selectedFont === index 
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span 
                      className="text-2xl" 
                      style={{ 
                        fontFamily: `${font.name}, cursive`,
                        fontStyle: 'italic',
                        color: selectedColor 
                      }}
                    >
                      {typedName || 'Your Name'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center bg-white">
              <span 
                className="text-4xl"
                style={{ 
                  fontFamily: `${SIGNATURE_FONTS[selectedFont].name}, cursive`,
                  fontStyle: 'italic',
                  color: selectedColor 
                }}
              >
                {typedName || 'Your Name'}
              </span>
            </div>
          </div>
        )}

        {/* Upload Mode */}
        {mode === 'upload' && (
          <div className="space-y-4">
            {!uploadedImage ? (
              <label className="block border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-violet-400 transition-colors">
                <Upload className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-600 dark:text-gray-400">Upload signature image</p>
                <p className="text-xs text-gray-400 mt-1">PNG or JPG with transparent background works best</p>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            ) : (
              <div className="relative border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white">
                <img src={uploadedImage} alt="Uploaded signature" className="max-h-32 mx-auto" />
                <button
                  onClick={() => setUploadedImage(null)}
                  className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleApply}
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Apply Signature
          </button>
          <button
            onClick={handleSave}
            className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg"
            title="Save for later"
          >
            <Save className="w-5 h-5" />
          </button>
        </div>

        {/* Saved Signatures */}
        {savedSignatures.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Saved Signatures</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {savedSignatures.map((sig, index) => (
                <button
                  key={index}
                  onClick={() => useSavedSignature(sig)}
                  className="flex-shrink-0 p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-violet-400 bg-white"
                >
                  <img src={sig.data} alt="Saved signature" className="h-12 w-auto" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
