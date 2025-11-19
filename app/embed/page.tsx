'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { jsPDF } from 'jspdf'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

type ElementType = 'text' | 'rectangle' | 'circle' | 'line'

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

const CREDIT_COST = 5

export default function PDFBuilderEmbed() {
  const [pages, setPages] = useState<PageData[]>([{ elements: [] }])
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

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
    if (selectedElement === id) setSelectedElement(null)
  }

  const addPage = () => {
    setPages([...pages, { elements: [] }])
    setCurrentPage(pages.length)
  }

  const exportPDF = async () => {
    if (credits === null || credits < CREDIT_COST) {
      alert(`Insufficient credits. You need ${CREDIT_COST} credits to export.`)
      return
    }

    if (!userId) {
      alert('Please log in to export PDFs.')
      return
    }

    setIsExporting(true)

    try {
      const pdf = new jsPDF()
      
      pages.forEach((page, pageIndex) => {
        if (pageIndex > 0) pdf.addPage()
        
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

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: credits - CREDIT_COST })
        .eq('id', userId)

      if (updateError) throw updateError

      await supabase.from('credit_transactions').insert({
        user_id: userId,
        amount: -CREDIT_COST,
        transaction_type: 'deduction',
        description: 'PDF Builder - Document Export',
        balance_after: credits - CREDIT_COST
      })

      setCredits(credits - CREDIT_COST)
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f9fafb' }}>
      {/* Toolbar */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => addElement('text')} style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>✏️ Text</button>
          <button onClick={() => addElement('rectangle')} style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>⬜ Box</button>
          <button onClick={() => addElement('circle')} style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>⭕ Circle</button>
          <button onClick={() => addElement('line')} style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>➖ Line</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {credits !== null && <span style={{ fontSize: '14px', color: '#6b7280' }}>{credits} credits</span>}
          <button onClick={exportPDF} disabled={isExporting || (credits !== null && credits < CREDIT_COST)} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: isExporting || (credits !== null && credits < CREDIT_COST) ? 'not-allowed' : 'pointer', opacity: isExporting || (credits !== null && credits < CREDIT_COST) ? 0.5 : 1, fontSize: '14px' }}>
            {isExporting ? '⏳ Exporting...' : `📥 Export (${CREDIT_COST} credits)`}
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Canvas */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', overflow: 'auto' }}>
          <div style={{ width: '210mm', height: '297mm', backgroundColor: 'white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, padding: '32px' }}>
              {currentPageData.elements.map((element) => (
                <div key={element.id} onClick={() => setSelectedElement(element.id)} style={{ position: 'absolute', left: `${element.x}px`, top: `${element.y}px`, width: element.width ? `${element.width}px` : 'auto', height: element.height ? `${element.height}px` : 'auto', border: selectedElement === element.id ? '2px solid #3b82f6' : '2px solid transparent', cursor: 'move', transition: 'border-color 0.2s' }}>
                  {element.type === 'text' && <p style={{ fontSize: `${element.fontSize}px`, color: element.color, margin: 0, whiteSpace: 'pre-wrap' }}>{element.content}</p>}
                  {element.type === 'rectangle' && <div style={{ width: '100%', height: '100%', border: `2px solid ${element.color}` }} />}
                  {element.type === 'circle' && <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: `2px solid ${element.color}` }} />}
                  {element.type === 'line' && <div style={{ height: '2px', backgroundColor: element.color, width: '100px' }} />}
                  {selectedElement === element.id && (
                    <button onClick={(e) => { e.stopPropagation(); deleteElement(element.id); }} style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>✕</button>
                  )}
                </div>
              ))}
              {currentPageData.elements.length === 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: '64px', marginBottom: '8px' }}>📄</div><p style={{ fontSize: '16px' }}>Click tools above to add content</p></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        {selectedElementData && (
          <div style={{ width: '280px', backgroundColor: 'white', borderLeft: '1px solid #e5e7eb', padding: '16px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Properties</h3>
              <button onClick={() => setSelectedElement(null)} style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#6b7280' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedElementData.type === 'text' && (
                <>
                  <div><label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Text</label><textarea value={selectedElementData.content} onChange={(e) => updateElement(selectedElementData.id, { content: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', minHeight: '80px' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Font Size</label><input type="number" value={selectedElementData.fontSize} onChange={(e) => updateElement(selectedElementData.id, { fontSize: parseInt(e.target.value) })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }} /></div>
                </>
              )}
              <div><label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Color</label><input type="color" value={selectedElementData.color} onChange={(e) => updateElement(selectedElementData.id, { color: e.target.value })} style={{ width: '100%', height: '40px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>X</label><input type="number" value={selectedElementData.x} onChange={(e) => updateElement(selectedElementData.id, { x: parseInt(e.target.value) })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }} /></div>
                <div><label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Y</label><input type="number" value={selectedElementData.y} onChange={(e) => updateElement(selectedElementData.id, { y: parseInt(e.target.value) })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }} /></div>
              </div>
              {(selectedElementData.type === 'rectangle' || selectedElementData.type === 'circle') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div><label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Width</label><input type="number" value={selectedElementData.width} onChange={(e) => updateElement(selectedElementData.id, { width: parseInt(e.target.value) })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }} /></div>
                  <div><label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Height</label><input type="number" value={selectedElementData.height} onChange={(e) => updateElement(selectedElementData.id, { height: parseInt(e.target.value) })} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }} /></div>
                </div>
              )}
              <button onClick={() => deleteElement(selectedElementData.id)} style={{ width: '100%', padding: '10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>🗑️ Delete</button>
            </div>
          </div>
        )}
      </div>

      {/* Page Navigation */}
      <div style={{ backgroundColor: 'white', borderTop: '1px solid #e5e7eb', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        {pages.map((_, index) => (
          <button key={index} onClick={() => setCurrentPage(index)} style={{ padding: '6px 12px', backgroundColor: currentPage === index ? '#3b82f6' : 'white', color: currentPage === index ? 'white' : '#374151', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', minWidth: '40px' }}>{index + 1}</button>
        ))}
        <button onClick={addPage} style={{ padding: '6px 12px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>+ Page</button>
      </div>
    </div>
  )
}
