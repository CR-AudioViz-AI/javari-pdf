'use client'

import { useState, useEffect } from 'react'
import { FileText, Download, Save, Sparkles, Plus, Trash2, Type, Image, Layout } from 'lucide-react'
import { PDFDocument, DocumentElement, Template } from '@/types/pdf'
import { generatePDF } from '@/lib/pdf-generator'
import { supabase } from '@/lib/supabase'
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

export default function PDFBuilderPro() {
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
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

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

    setDocument(prev => {
      const newPages = [...prev.pages]
      newPages[currentPage].elements.push(newElement)
      return { ...prev, pages: newPages }
    })
    setSelectedElement(newElement.id)
  }

  function addImageElement() {
    const newElement: DocumentElement = {
      id: Date.now().toString(),
      type: 'image',
      x: 100,
      y: 100 + (document.pages[currentPage].elements.length * 50),
      width: 200,
      height: 200,
      imageUrl: '/placeholder-image.png'
    }

    setDocument(prev => {
      const newPages = [...prev.pages]
      newPages[currentPage].elements.push(newElement)
      return { ...prev, pages: newPages }
    })
    setSelectedElement(newElement.id)
  }

  function addHeadingElement() {
    const newElement: DocumentElement = {
      id: Date.now().toString(),
      type: 'text',
      content: 'Heading Text',
      x: 100,
      y: 100 + (document.pages[currentPage].elements.length * 50),
      width: 500,
      height: 60,
      fontSize: 32,
      fontFamily: 'Helvetica',
      fontWeight: 'bold',
      color: '#003366',
      align: 'left'
    }

    setDocument(prev => {
      const newPages = [...prev.pages]
      newPages[currentPage].elements.push(newElement)
      return { ...prev, pages: newPages }
    })
    setSelectedElement(newElement.id)
  }

  function deleteElement(elementId: string) {
    setDocument(prev => {
      const newPages = [...prev.pages]
      newPages[currentPage].elements = newPages[currentPage].elements.filter(
        el => el.id !== elementId
      )
      return { ...prev, pages: newPages }
    })
    setSelectedElement(null)
  }

  function updateElement(elementId: string, updates: Partial<DocumentElement>) {
    setDocument(prev => {
      const newPages = [...prev.pages]
      const elementIndex = newPages[currentPage].elements.findIndex(el => el.id === elementId)
      if (elementIndex !== -1) {
        newPages[currentPage].elements[elementIndex] = {
          ...newPages[currentPage].elements[elementIndex],
          ...updates
        }
      }
      return { ...prev, pages: newPages }
    })
  }

  async function generateWithAI() {
    if (!aiPrompt.trim()) {
      setMessage({ type: 'error', text: 'Please enter a prompt' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: aiPrompt,
          template: document.template
        })
      })

      if (!response.ok) throw new Error('AI generation failed')
      
      const data = await response.json()
      
      // Add generated content as text elements
      const newElements: DocumentElement[] = data.sections.map((section: any, index: number) => ({
        id: `ai-${Date.now()}-${index}`,
        type: 'text',
        content: section.content,
        x: 72,
        y: 72 + (index * 150),
        width: 468, // Letter width (612) - margins (72*2)
        height: 100,
        fontSize: section.isHeading ? 24 : 12,
        fontFamily: 'Helvetica',
        fontWeight: section.isHeading ? 'bold' : 'normal',
        color: section.isHeading ? '#003366' : '#000000',
        align: 'left'
      }))

      setDocument(prev => {
        const newPages = [...prev.pages]
        newPages[currentPage].elements = [...newPages[currentPage].elements, ...newElements]
        return { ...prev, pages: newPages }
      })

      setMessage({ type: 'success', text: 'Content generated successfully!' })
      setAiPrompt('')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'AI generation failed' })
    } finally {
      setGenerating(false)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  async function saveDocument() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in to save')

      const { error } = await supabase
        .from('pdf_documents')
        .insert({
          user_id: user.id,
          title: document.title,
          template: document.template,
          content: document,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // Deduct credits
      await fetch('/api/credits/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.id,
          amount: 20,
          reason: 'PDF Document Saved'
        })
      })

      setMessage({ type: 'success', text: 'Document saved! (20 credits used)' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save document' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  function exportPDF() {
    try {
      const pdf = generatePDF(document)
      pdf.save(`${document.title.replace(/\s+/g, '-').toLowerCase()}.pdf`)
      setMessage({ type: 'success', text: 'PDF exported successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to export PDF' })
      setTimeout(() => setMessage(null), 5000)
    }
  }

  if (showTemplates) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-primary rounded-xl">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900">PDF Builder Pro</h1>
            </div>
            <p className="text-xl text-gray-600">Create professional PDFs with AI-powered content</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => selectTemplate(template)}
                className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="aspect-[8.5/11] bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                  <FileText className="w-20 h-20 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-gray-600 text-sm">{template.description}</p>
                <span className="inline-block mt-3 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {template.category}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowTemplates(true)}
                className="text-gray-600 hover:text-gray-900"
              >
                <Layout className="w-6 h-6" />
              </button>
              <input
                type="text"
                value={document.title}
                onChange={(e) => setDocument(prev => ({ ...prev, title: e.target.value }))}
                className="text-2xl font-bold border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-primary rounded px-2"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={saveDocument}
                disabled={saving}
                className="btn-secondary flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save (20 credits)'}
              </button>
              <button
                onClick={exportPDF}
                className="btn-primary flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export PDF
              </button>
            </div>
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}
        </div>
      </header>

      <div className="flex h-[calc(100vh-89px)]">
        {/* Left Sidebar - Tools */}
        <aside className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <h3 className="font-bold text-gray-900 mb-4">Add Elements</h3>
          
          <div className="space-y-2">
            <button
              onClick={addHeadingElement}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Type className="w-5 h-5 text-primary" />
              <span className="font-medium">Heading</span>
            </button>

            <button
              onClick={addTextElement}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Type className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Text Block</span>
            </button>

            <button
              onClick={addImageElement}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Image className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Image</span>
            </button>
          </div>

          <div className="mt-8">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              AI Content Generator
            </h3>
            
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe what content you need..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={4}
            />
            
            <button
              onClick={generateWithAI}
              disabled={generating || !aiPrompt.trim()}
              className="w-full mt-3 btn-primary flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {generating ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 overflow-auto bg-gray-200 p-8">
          <div 
            className="bg-white shadow-2xl mx-auto"
            style={{
              width: document.settings.orientation === 'portrait' ? '816px' : '1056px',
              minHeight: document.settings.orientation === 'portrait' ? '1056px' : '816px'
            }}
          >
            {/* Page Canvas */}
            <div className="relative" style={{ padding: `${document.settings.margins.top}px ${document.settings.margins.right}px ${document.settings.margins.bottom}px ${document.settings.margins.left}px` }}>
              {document.pages[currentPage].elements.map(element => (
                <div
                  key={element.id}
                  onClick={() => setSelectedElement(element.id)}
                  className={`absolute cursor-move ${selectedElement === element.id ? 'ring-2 ring-primary' : ''}`}
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height
                  }}
                >
                  {element.type === 'text' && (
                    <div
                      contentEditable
                      onBlur={(e) => updateElement(element.id, { content: e.currentTarget.textContent || '' })}
                      style={{
                        fontSize: element.fontSize,
                        fontFamily: element.fontFamily,
                        fontWeight: element.fontWeight,
                        color: element.color,
                        textAlign: element.align,
                        lineHeight: 1.5
                      }}
                      className="outline-none"
                    >
                      {element.content}
                    </div>
                  )}

                  {element.type === 'image' && (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded">
                      <Image className="w-12 h-12 text-gray-400" />
                    </div>
                  )}

                  {selectedElement === element.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteElement(element.id)
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 bg-white rounded-lg shadow disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {currentPage + 1} of {document.pages.length}
            </span>
            <button
              onClick={() => {
                if (currentPage === document.pages.length - 1) {
                  setDocument(prev => ({
                    ...prev,
                    pages: [...prev.pages, { id: Date.now().toString(), elements: [] }]
                  }))
                }
                setCurrentPage(prev => prev + 1)
              }}
              className="px-4 py-2 bg-white rounded-lg shadow"
            >
              Next / Add Page
            </button>
          </div>
        </main>

        {/* Right Sidebar - Properties */}
        {selectedElement && (
          <aside className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-bold text-gray-900 mb-4">Element Properties</h3>
            {(() => {
              const element = document.pages[currentPage].elements.find(el => el.id === selectedElement)
              if (!element) return null

              return (
                <div className="space-y-4">
                  {element.type === 'text' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Font Size
                        </label>
                        <input
                          type="number"
                          value={element.fontSize}
                          onChange={(e) => updateElement(element.id, { fontSize: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Color
                        </label>
                        <input
                          type="color"
                          value={element.color}
                          onChange={(e) => updateElement(element.id, { color: e.target.value })}
                          className="w-full h-10 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alignment
                        </label>
                        <select
                          value={element.align}
                          onChange={(e) => updateElement(element.id, { align: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                          <option value="justify">Justify</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width
                    </label>
                    <input
                      type="number"
                      value={element.width}
                      onChange={(e) => updateElement(element.id, { width: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height
                    </label>
                    <input
                      type="number"
                      value={element.height}
                      onChange={(e) => updateElement(element.id, { height: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )
            })()}
          </aside>
        )}
      </div>
    </div>
  )
}