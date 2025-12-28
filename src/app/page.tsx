'use client'

import { useState } from 'react'
import { 
  FileText, Upload, Download, Merge, Split, Lock,
  Unlock, Compress, ScanLine, PenTool, Layers,
  Settings, FileCheck, Trash2, Eye
} from 'lucide-react'

// Import all new components
import OCRScanner from '@/components/OCRScanner'
import DigitalSignature from '@/components/DigitalSignature'
import BatchPDFProcessor from '@/components/BatchPDFProcessor'

type ActiveTool = 'home' | 'ocr' | 'signature' | 'batch' | 'merge' | 'split' | 'compress' | 'protect'

interface RecentFile {
  id: string
  name: string
  size: number
  processedAt: string
  operation: string
}

export default function PDFBuilderPage() {
  const [activeTool, setActiveTool] = useState<ActiveTool>('home')
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([])
  const [extractedText, setExtractedText] = useState<string>('')
  const [signatureData, setSignatureData] = useState<any>(null)

  const handleTextExtracted = (text: string) => {
    setExtractedText(text)
    console.log('Extracted text:', text)
  }

  const handleSignatureCreated = (signature: any) => {
    setSignatureData(signature)
    console.log('Signature created:', signature)
  }

  const handleBatchComplete = (results: any[]) => {
    console.log('Batch processing complete:', results)
    const newFiles = results.map((r, i) => ({
      id: Date.now().toString() + i,
      name: r.name,
      size: 0,
      processedAt: new Date().toISOString(),
      operation: 'batch'
    }))
    setRecentFiles(prev => [...newFiles, ...prev].slice(0, 10))
  }

  const tools = [
    { id: 'home', label: 'Home', icon: FileText, color: 'from-blue-500 to-indigo-600' },
    { id: 'ocr', label: 'OCR Scanner', icon: ScanLine, color: 'from-cyan-500 to-blue-600' },
    { id: 'signature', label: 'Sign PDF', icon: PenTool, color: 'from-violet-500 to-purple-600' },
    { id: 'batch', label: 'Batch Process', icon: Layers, color: 'from-orange-500 to-red-600' },
    { id: 'merge', label: 'Merge PDFs', icon: Merge, color: 'from-green-500 to-emerald-600' },
    { id: 'split', label: 'Split PDF', icon: Split, color: 'from-amber-500 to-orange-600' },
    { id: 'compress', label: 'Compress', icon: Compress, color: 'from-pink-500 to-rose-600' },
    { id: 'protect', label: 'Protect', icon: Lock, color: 'from-gray-500 to-slate-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">PDF Builder Pro</h1>
                <p className="text-sm text-gray-500">All-in-one PDF toolkit</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tool Selection Grid - Home */}
        {activeTool === 'home' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tools.filter(t => t.id !== 'home').map(tool => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id as ActiveTool)}
                  className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow text-center group"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <tool.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{tool.label}</h3>
                </button>
              ))}
            </div>

            {/* Quick Upload */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm">
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Drop a PDF here or click to upload
                </p>
                <label className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg cursor-pointer">
                  <Upload className="w-5 h-5" />
                  Choose PDF
                  <input type="file" accept=".pdf" className="hidden" />
                </label>
              </div>
            </div>

            {/* Recent Files */}
            {recentFiles.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Recent Files</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {recentFiles.map(file => (
                    <div key={file.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-red-500" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                          <p className="text-sm text-gray-500">{file.operation}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                          <Download className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* OCR Scanner Tool */}
        {activeTool === 'ocr' && (
          <div className="space-y-4">
            <button 
              onClick={() => setActiveTool('home')}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
            >
              ← Back to Tools
            </button>
            <OCRScanner onTextExtracted={handleTextExtracted} />
            
            {extractedText && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Extracted Text Preview</h3>
                <pre className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-auto max-h-48">
                  {extractedText}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Digital Signature Tool */}
        {activeTool === 'signature' && (
          <div className="space-y-4">
            <button 
              onClick={() => setActiveTool('home')}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
            >
              ← Back to Tools
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DigitalSignature 
                onSignatureCreated={handleSignatureCreated}
                signerName="Roy"
              />
              
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">How to Sign a PDF</h3>
                <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">1</span>
                    <span>Create your signature using draw, type, or upload</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">2</span>
                    <span>Upload your PDF document</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">3</span>
                    <span>Click where you want to place your signature</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">4</span>
                    <span>Download your signed PDF</span>
                  </li>
                </ol>
                
                {signatureData && (
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
                      <FileCheck className="w-4 h-4" />
                      Signature ready! Upload a PDF to sign.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Batch Processor Tool */}
        {activeTool === 'batch' && (
          <div className="space-y-4">
            <button 
              onClick={() => setActiveTool('home')}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
            >
              ← Back to Tools
            </button>
            <BatchPDFProcessor onProcessComplete={handleBatchComplete} />
          </div>
        )}

        {/* Merge Tool Placeholder */}
        {activeTool === 'merge' && (
          <div className="space-y-4">
            <button onClick={() => setActiveTool('home')} className="text-gray-500 hover:text-gray-700 flex items-center gap-2">
              ← Back to Tools
            </button>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm text-center">
              <Merge className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Merge PDFs</h2>
              <p className="text-gray-500 mb-6">Combine multiple PDFs into a single document</p>
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8">
                <Upload className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Drop PDFs here or click to upload</p>
              </div>
            </div>
          </div>
        )}

        {/* Split Tool Placeholder */}
        {activeTool === 'split' && (
          <div className="space-y-4">
            <button onClick={() => setActiveTool('home')} className="text-gray-500 hover:text-gray-700 flex items-center gap-2">
              ← Back to Tools
            </button>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm text-center">
              <Split className="w-16 h-16 mx-auto text-amber-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Split PDF</h2>
              <p className="text-gray-500 mb-6">Extract pages or split into multiple PDFs</p>
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8">
                <Upload className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Drop a PDF here to split</p>
              </div>
            </div>
          </div>
        )}

        {/* Compress Tool Placeholder */}
        {activeTool === 'compress' && (
          <div className="space-y-4">
            <button onClick={() => setActiveTool('home')} className="text-gray-500 hover:text-gray-700 flex items-center gap-2">
              ← Back to Tools
            </button>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm text-center">
              <Compress className="w-16 h-16 mx-auto text-pink-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Compress PDF</h2>
              <p className="text-gray-500 mb-6">Reduce PDF file size without losing quality</p>
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8">
                <Upload className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Drop a PDF here to compress</p>
              </div>
            </div>
          </div>
        )}

        {/* Protect Tool Placeholder */}
        {activeTool === 'protect' && (
          <div className="space-y-4">
            <button onClick={() => setActiveTool('home')} className="text-gray-500 hover:text-gray-700 flex items-center gap-2">
              ← Back to Tools
            </button>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm text-center">
              <Lock className="w-16 h-16 mx-auto text-gray-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Protect PDF</h2>
              <p className="text-gray-500 mb-6">Add password protection to your PDF</p>
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8">
                <Upload className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Drop a PDF here to protect</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
