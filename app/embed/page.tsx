'use client'

import { useState, useRef, useEffect } from 'react'
import { FileText, Download, Trash2, Type, Image, Square, Circle, Minus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase-client'
import { jsPDF } from 'jspdf'

type ElementType = 'text' | 'image' | 'rectangle' | 'circle' | 'line'

interface PDFElement {
  id: string
  type: ElementType
  content: string
  x: number
  y: number
  width?: number
  height?: number
  fontSize?: number
  color?: string
}

interface PageData {
  elements: PDFElement[]
}

const CREDIT_COST = 5 // 5 credits per PDF export

export default function PDFBuilderEmbed() {
  const supabase = createClient()
  const [pages, setPages] = useState<PageData[]>([{ elements: [] }])
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Load user credits on mount
  useEffect(() => {
    loadUserCredits()
  }, [])

  const loadUserCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    setUserId(user.id)
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      setCredits(profile.credits || 0)
    }
  }

  const addElement = (type: ElementType) => {
    const newElement: PDFElement = {
      id: `${type}-${Date.now()}`,
      type,
      content: type === 'text' ? 'Sample Text' : '',
      x: 50,
      y: 50 + (pages[currentPage].elements.length * 30),
      width: type === 'rectangle' || type === 'circle' ? 100 : undefined,
      height: type === 'rectangle' || type === 'circle' ? 100 : undefined,
      fontSize: type === 'text' ? 16 : undefined,
      color: '#000000'
    }

    const updatedPages = [...pages]
    updatedPages[currentPage].elements.push(newElement)
    setPages(updatedPages)
    setSelectedElement(newElement.id)
  }

  const updateElement = (id: string, updates: Partial<PDFElement>) => {
    const updatedPages = [...pages]
    const elementIndex = updatedPages[currentPage].elements.findIndex(el => el.id === id)
    if (elementIndex !== -1) {
      updatedPages[currentPage].elements[elementIndex] = {
        ...updatedPages[currentPage].elements[elementIndex],
        ...updates
      }
      setPages(updatedPages)
    }
  }

  const deleteElement = (id: string) => {
    const updatedPages = [...pages]
    updatedPages[currentPage].elements = updatedPages[currentPage].elements.filter(el => el.id !== id)
    setPages(updatedPages)
    if (selectedElement === id) {
      setSelectedElement(null)
    }
  }

  const addPage = () => {
    setPages([...pages, { elements: [] }])
    setCurrentPage(pages.length)
  }

  const exportPDF = async () => {
    // Check credits
    if (credits === null || credits < CREDIT_COST) {
      alert(`Insufficient credits. You need ${CREDIT_COST} credits to export a PDF.`)
      return
    }

    if (!userId) {
      alert('Please log in to export PDFs.')
      return
    }

    setIsExporting(true)

    try {
      // Create PDF
      const pdf = new jsPDF()
      
      pages.forEach((page, pageIndex) => {
        if (pageIndex > 0) {
          pdf.addPage()
        }
        
        page.elements.forEach(element => {
          if (element.type === 'text' && element.content) {
            pdf.setFontSize(element.fontSize || 16)
            pdf.setTextColor(element.color || '#000000')
            pdf.text(element.content, element.x, element.y)
          } else if (element.type === 'rectangle' && element.width && element.height) {
            pdf.setDrawColor(element.color || '#000000')
            pdf.rect(element.x, element.y, element.width, element.height)
          } else if (element.type === 'circle' && element.width && element.height) {
            pdf.setDrawColor(element.color || '#000000')
            pdf.circle(element.x, element.y, element.width / 2)
          } else if (element.type === 'line') {
            pdf.setDrawColor(element.color || '#000000')
            pdf.line(element.x, element.y, element.x + 100, element.y)
          }
        })
      })

      // Deduct credits
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: credits - CREDIT_COST })
        .eq('id', userId)

      if (updateError) throw updateError

      // Log transaction
      await supabase.from('credit_transactions').insert({
        user_id: userId,
        amount: -CREDIT_COST,
        transaction_type: 'deduction',
        description: 'PDF Builder - Document Export',
        balance_after: credits - CREDIT_COST
      })

      // Update local credits
      setCredits(credits - CREDIT_COST)

      // Download PDF
      pdf.save('document.pdf')

      alert('PDF exported successfully! 5 credits deducted.')
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const currentPageData = pages[currentPage]
  const selectedElementData = selectedElement 
    ? currentPageData.elements.find(el => el.id === selectedElement)
    : null

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Minimal Toolbar */}
      <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => addElement('text')}
            className="gap-2"
          >
            <Type className="w-4 h-4" />
            Text
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => addElement('rectangle')}
            className="gap-2"
          >
            <Square className="w-4 h-4" />
            Rectangle
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => addElement('circle')}
            className="gap-2"
          >
            <Circle className="w-4 h-4" />
            Circle
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => addElement('line')}
            className="gap-2"
          >
            <Minus className="w-4 h-4" />
            Line
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {credits !== null && (
            <span className="text-sm text-gray-600">
              {credits} credits
            </span>
          )}
          <Button
            size="sm"
            onClick={exportPDF}
            disabled={isExporting || (credits !== null && credits < CREDIT_COST)}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF ({CREDIT_COST} credits)
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <div
            ref={canvasRef}
            className="bg-white shadow-lg relative"
            style={{ width: '210mm', height: '297mm' }}
          >
            {/* Page Content */}
            <div className="absolute inset-0 p-8">
              {currentPageData.elements.map((element) => (
                <div
                  key={element.id}
                  className={`absolute cursor-move border-2 ${
                    selectedElement === element.id ? 'border-blue-500' : 'border-transparent'
                  } hover:border-blue-300`}
                  style={{
                    left: `${element.x}px`,
                    top: `${element.y}px`,
                    width: element.width ? `${element.width}px` : 'auto',
                    height: element.height ? `${element.height}px` : 'auto'
                  }}
                  onClick={() => setSelectedElement(element.id)}
                >
                  {element.type === 'text' && (
                    <p
                      style={{
                        fontSize: `${element.fontSize}px`,
                        color: element.color
                      }}
                    >
                      {element.content}
                    </p>
                  )}
                  {element.type === 'rectangle' && (
                    <div
                      className="w-full h-full border-2"
                      style={{ borderColor: element.color }}
                    />
                  )}
                  {element.type === 'circle' && (
                    <div
                      className="w-full h-full rounded-full border-2"
                      style={{ borderColor: element.color }}
                    />
                  )}
                  {element.type === 'line' && (
                    <div
                      className="h-0.5"
                      style={{ backgroundColor: element.color, width: '100px' }}
                    />
                  )}

                  {selectedElement === element.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteElement(element.id)
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}

              {currentPageData.elements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p>Click tools to add content</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        {selectedElementData && (
          <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Properties</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedElement(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {selectedElementData.type === 'text' && (
                <>
                  <div>
                    <Label>Text Content</Label>
                    <Textarea
                      value={selectedElementData.content}
                      onChange={(e) =>
                        updateElement(selectedElementData.id, { content: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Font Size</Label>
                    <Input
                      type="number"
                      value={selectedElementData.fontSize}
                      onChange={(e) =>
                        updateElement(selectedElementData.id, { fontSize: parseInt(e.target.value) })
                      }
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={selectedElementData.color}
                  onChange={(e) =>
                    updateElement(selectedElementData.id, { color: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>X Position</Label>
                  <Input
                    type="number"
                    value={selectedElementData.x}
                    onChange={(e) =>
                      updateElement(selectedElementData.id, { x: parseInt(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Y Position</Label>
                  <Input
                    type="number"
                    value={selectedElementData.y}
                    onChange={(e) =>
                      updateElement(selectedElementData.id, { y: parseInt(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              {(selectedElementData.type === 'rectangle' || selectedElementData.type === 'circle') && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Width</Label>
                    <Input
                      type="number"
                      value={selectedElementData.width}
                      onChange={(e) =>
                        updateElement(selectedElementData.id, { width: parseInt(e.target.value) })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Height</Label>
                    <Input
                      type="number"
                      value={selectedElementData.height}
                      onChange={(e) =>
                        updateElement(selectedElementData.id, { height: parseInt(e.target.value) })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              <Button
                variant="destructive"
                onClick={() => deleteElement(selectedElementData.id)}
                className="w-full gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Element
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Page Navigation */}
      <div className="bg-white border-t border-gray-200 p-3 flex items-center justify-center gap-2">
        {pages.map((_, index) => (
          <Button
            key={index}
            size="sm"
            variant={currentPage === index ? 'default' : 'outline'}
            onClick={() => setCurrentPage(index)}
          >
            {index + 1}
          </Button>
        ))}
        <Button size="sm" variant="outline" onClick={addPage}>
          + Add Page
        </Button>
      </div>
    </div>
  )
}
