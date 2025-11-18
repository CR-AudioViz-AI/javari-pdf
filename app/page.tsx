'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Download, Save, Sparkles, Plus, Trash2, Type, Image, Layout, CreditCard, AlertCircle, Loader2 } from 'lucide-react'
import { PDFDocument, DocumentElement, Template } from '@/types/pdf'
import { generatePDF } from '@/lib/pdf-generator'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { format } from 'date-fns'

const TEMPLATES: Template[] = [
  {
    id: 'business-proposal',
    name: 'Business Proposal',
    category: 'business',
    description: 'Professional business proposal template',
    thumbnail: '/templates/business-proposal.png'
  },
  {
    id: 'technical-report',
    name: 'Technical Report',
    category: 'technical',
    description: 'Detailed technical documentation template',
    thumbnail: '/templates/technical-report.png'
  },
  {
    id: 'creative-portfolio',
    name: 'Creative Portfolio',
    category: 'creative',
    description: 'Showcase your work beautifully',
    thumbnail: '/templates/creative-portfolio.png'
  },
  {
    id: 'resume-professional',
    name: 'Professional Resume',
    category: 'resume',
    description: 'ATS-friendly professional resume',
    thumbnail: '/templates/resume-professional.png'
  },
  {
    id: 'blank',
    name: 'Blank Document',
    category: 'blank',
    description: 'Start from scratch',
    thumbnail: '/templates/blank.png'
  }
]

const CREDIT_COST = 5 // Credits per save

export default function PDFBuilderPro() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [credits, setCredits] = useState<number>(0)
  const [loadingCredits, setLoadingCredits] = useState(false)

  const [document, setDocument] = useState<PDFDocument>({
    id: '',
    title: 'Untitled Document',
    template: 'blank',
    pages: [
      {
        id: '1',
        elements: []
      }
    ],
    settings: {
      pageSize: 'letter',
      orientation: 'portrait',
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
      font: 'Helvetica',
      fontSize: 12,
      lineHeight: 1.5
    }
  })

  const [currentPage, setCurrentPage] = useState(0)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(true)
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null)

  // AUTH GUARD - Check authentication on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createSupabaseBrowserClient()
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session) {
          // Redirect to login page
          router.push('/login?redirect=/apps/pdf-builder')
          return
        }

        setAuthToken(session.access_token)
        setIsAuthenticated(true)
        
        // Load credit balance
        await fetchCredits(session.access_token)

      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Fetch user's credit balance
  async function fetchCredits(token: string) {
    if (!token) return
    
    setLoadingCredits(true)
    try {
      const response = await fetch('/api/credits/balance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCredits(data.credits || 0)
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    } finally {
      setLoadingCredits(false)
    }
  }

  function selectTemplate(template: Template) {
    setDocument(prev => ({
      ...prev,
      template: template.id,
      title: template.name
    }))
    setShowTemplates(false)
  }

  function addTextElement() {
    const newElement: DocumentElement = {
      id: Date.now().toString(),
      type: 'text',
      content: 'Double-click to edit text',
      x: 100,
      y: 100 + (document.pages[currentPage].elements.length * 50),
      width: 400,
      height: 40,
      fontSize: 16,
      fontFamily: 'Helvetica',
      color: '#000000',
      align: 'left'
    }

    setDocument(prev => ({
      ...prev,
      pages: prev.pages.map((page, idx) =>
        idx === currentPage
          ? { ...page, elements: [...page.elements, newElement] }
          : page
      )
    }))
  }

  function addImageElement() {
    const newElement: DocumentElement = {
      id: Date.now().toString(),
      type: 'image',
      content: 'https://via.placeholder.com/300x200',
      x: 100,
      y: 100 + (document.pages[currentPage].elements.length * 50),
      width: 300,
      height: 200
    }

    setDocument(prev => ({
      ...prev,
      pages: prev.pages.map((page, idx) =>
        idx === currentPage
          ? { ...page, elements: [...page.elements, newElement] }
          : page
      )
    }))
  }

  function deleteElement(elementId: string) {
    setDocument(prev => ({
      ...prev,
      pages: prev.pages.map((page, idx) =>
        idx === currentPage
          ? { ...page, elements: page.elements.filter(el => el.id !== elementId) }
          : page
      )
    }))
    setSelectedElement(null)
  }

  function updateElement(elementId: string, updates: Partial<DocumentElement>) {
    setDocument(prev => ({
      ...prev,
      pages: prev.pages.map((page, idx) =>
        idx === currentPage
          ? {
              ...page,
              elements: page.elements.map(el =>
                el.id === elementId ? { ...el, ...updates } : el
              )
            }
          : page
      )
    }))
  }

  function addPage() {
    setDocument(prev => ({
      ...prev,
      pages: [
        ...prev.pages,
        {
          id: Date.now().toString(),
          elements: []
        }
      ]
    }))
    setCurrentPage(document.pages.length)
  }

  async function generateContent() {
    if (!aiPrompt.trim()) {
      setMessage({ type: 'warning', text: 'Please enter a prompt for AI generation' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ prompt: aiPrompt })
      })

      if (!response.ok) throw new Error('Generation failed')

      const data = await response.json()
      
      // Add generated text as new element
      const newElement: DocumentElement = {
        id: Date.now().toString(),
        type: 'text',
        content: data.content,
        x: 100,
        y: 100,
        width: 400,
        height: 200,
        fontSize: 14,
        fontFamily: 'Helvetica',
        color: '#000000',
        align: 'left'
      }

      setDocument(prev => ({
        ...prev,
        pages: prev.pages.map((page, idx) =>
          idx === currentPage
            ? { ...page, elements: [...page.elements, newElement] }
            : page
        )
      }))

      setMessage({ type: 'success', text: 'AI content generated!' })
      setAiPrompt('')

    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to generate content' })
    } finally {
      setGenerating(false)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  async function saveDocument() {
    // PRE-FLIGHT: Check credits before attempting save
    if (credits < CREDIT_COST) {
      setMessage({ 
        type: 'error', 
        text: `Insufficient credits. Need ${CREDIT_COST}, have ${credits}. Please purchase more credits.` 
      })
      setTimeout(() => setMessage(null), 5000)
      return
    }

    if (!authToken) {
      setMessage({ type: 'error', text: 'Authentication required' })
      return
    }

    setSaving(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('User not authenticated')

      // Save document to database
      const { error: saveError } = await supabase
        .from('pdf_documents')
        .insert({
          user_id: user.id,
          title: document.title,
          template: document.template,
          content: document,
          created_at: new Date().toISOString()
        })

      if (saveError) throw saveError

      // ATOMIC: Deduct credits with proper error handling
      const deductResponse = await fetch('/api/credits/deduct', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ 
          amount: CREDIT_COST,
          reason: `PDF Document Saved: ${document.title}`
        })
      })

      if (!deductResponse.ok) {
        const errorData = await deductResponse.json()
        throw new Error(errorData.error || 'Credit deduction failed')
      }

      const deductData = await deductResponse.json()
      
      // Update local credit balance
      setCredits(deductData.remaining)

      setMessage({ 
        type: 'success', 
        text: `Document saved! ${CREDIT_COST} credits used. ${deductData.remaining} credits remaining.` 
      })

    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to save document' 
      })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  function exportPDF() {
    try {
      const pdf = generatePDF(document)
      pdf.save(`${document.title.replace(/\s+/g, '-').toLowerCase()}.pdf`)
      setMessage({ type: 'success', text: 'PDF exported successfully! (Free - no credits used)' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to export PDF' })
      setTimeout(() => setMessage(null), 5000)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading PDF Builder...</p>
        </div>
      </div>
    )
  }

  // Auth required state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Template selection screen
  if (showTemplates) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header with Credit Balance */}
          <div className="flex items-center justify-between mb-12">
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-blue-600 rounded-xl">
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-5xl font-bold text-gray-900">PDF Builder Pro</h1>
              </div>
              <p className="text-xl text-gray-600">Create professional PDFs with AI assistance</p>
            </div>
            
            {/* Credit Balance Badge */}
            <div className="bg-white rounded-xl shadow-lg px-6 py-3 border-2 border-blue-200">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Credits</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loadingCredits ? (
                      <Loader2 className="w-5 h-5 animate-spin inline" />
                    ) : (
                      credits
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => selectTemplate(template)}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 text-left border-2 border-transparent hover:border-blue-500"
              >
                <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <Layout className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-gray-600 text-sm">{template.description}</p>
                <div className="mt-4 inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                  {template.category}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Main editor view
  const currentPageData = document.pages[currentPage]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowTemplates(true)}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <Layout className="w-5 h-5" />
              Templates
            </button>
            <input
              type="text"
              value={document.title}
              onChange={(e) => setDocument(prev => ({ ...prev, title: e.target.value }))}
              className="text-xl font-semibold px-3 py-1 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 outline-none"
              placeholder="Document Title"
            />
          </div>

          {/* Credit Balance & Actions */}
          <div className="flex items-center gap-4">
            {/* Credit Display */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <CreditCard className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">
                {loadingCredits ? '...' : credits} credits
              </span>
            </div>

            {/* Action Buttons */}
            <button
              onClick={saveDocument}
              disabled={saving || credits < CREDIT_COST}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title={credits < CREDIT_COST ? `Need ${CREDIT_COST} credits to save` : ''}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save ({CREDIT_COST} credits)
                </>
              )}
            </button>
            <button
              onClick={exportPDF}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export PDF (Free)
            </button>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`px-6 py-3 text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border-b border-green-200' :
          message.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border-b border-yellow-200' :
          'bg-red-50 text-red-800 border-b border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {message.text}
          </div>
        </div>
      )}

      <div className="flex">
        {/* Left Sidebar - Tools */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <div className="space-y-2">
            <button
              onClick={addTextElement}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Type className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Add Text</span>
            </button>
            <button
              onClick={addImageElement}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Image className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Add Image</span>
            </button>
            <button
              onClick={addPage}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Add Page</span>
            </button>
          </div>

          {/* AI Generator */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              AI Generator
            </h3>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe what you want to create..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
            <button
              onClick={generateContent}
              disabled={generating || !aiPrompt.trim()}
              className="w-full mt-2 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {/* Page Tabs */}
            <div className="flex gap-2 mb-4">
              {document.pages.map((page, idx) => (
                <button
                  key={page.id}
                  onClick={() => setCurrentPage(idx)}
                  className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                    idx === currentPage
                      ? 'bg-white text-blue-600 border-t-2 border-l-2 border-r-2 border-blue-600'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  Page {idx + 1}
                </button>
              ))}
            </div>

            {/* Canvas */}
            <div 
              className="bg-white shadow-2xl rounded-lg overflow-hidden"
              style={{ 
                width: '816px', // 8.5" at 96 DPI
                minHeight: '1056px', // 11" at 96 DPI
                position: 'relative'
              }}
            >
              {/* Page Elements */}
              {currentPageData.elements.map(element => (
                <div
                  key={element.id}
                  onClick={() => setSelectedElement(element.id)}
                  className={`absolute cursor-pointer transition-all ${
                    selectedElement === element.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height
                  }}
                >
                  {element.type === 'text' && (
                    <div
                      style={{
                        fontSize: element.fontSize,
                        fontFamily: element.fontFamily,
                        color: element.color,
                        textAlign: element.align,
                        lineHeight: '1.5'
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        const newContent = prompt('Edit text:', element.content)
                        if (newContent !== null) {
                          updateElement(element.id, { content: newContent })
                        }
                      }}
                    >
                      {element.content}
                    </div>
                  )}
                  {element.type === 'image' && (
                    <img 
                      src={element.content} 
                      alt="Document element"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Delete button for selected element */}
                  {selectedElement === element.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteElement(element.id)
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}

              {/* Empty state */}
              {currentPageData.elements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p>Click tools on the left to add content</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
