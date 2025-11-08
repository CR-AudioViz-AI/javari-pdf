import jsPDF from 'jspdf'
import { PDFDocument, DocumentElement } from '@/types/pdf'

interface PageDimensions {
  width: number
  height: number
}

const PAGE_SIZES: Record<string, PageDimensions> = {
  letter: { width: 612, height: 792 },
  a4: { width: 595, height: 842 },
  legal: { width: 612, height: 1008 },
  tabloid: { width: 792, height: 1224 }
}

export function generatePDF(document: PDFDocument): jsPDF {
  const { settings, pages } = document
  const pageSize = PAGE_SIZES[settings.pageSize]
  
  // Determine orientation and dimensions
  const isLandscape = settings.orientation === 'landscape'
  const width = isLandscape ? pageSize.height : pageSize.width
  const height = isLandscape ? pageSize.width : pageSize.height
  
  // Create PDF
  const pdf = new jsPDF({
    orientation: settings.orientation,
    unit: 'pt',
    format: [width, height]
  })

  // Process each page
  pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) {
      pdf.addPage()
    }

    // Sort elements by z-index (if present)
    const sortedElements = [...page.elements].sort((a, b) => {
      return (a.zIndex || 0) - (b.zIndex || 0)
    })

    // Render each element
    sortedElements.forEach(element => {
      switch (element.type) {
        case 'text':
          renderTextElement(pdf, element)
          break
        case 'image':
          renderImageElement(pdf, element)
          break
        case 'shape':
          renderShapeElement(pdf, element)
          break
        case 'line':
          renderLineElement(pdf, element)
          break
      }
    })

    // Add page number (optional)
    if (pages.length > 1) {
      pdf.setFontSize(10)
      pdf.setTextColor(128, 128, 128)
      pdf.text(
        `Page ${pageIndex + 1} of ${pages.length}`,
        width / 2,
        height - 30,
        { align: 'center' }
      )
    }
  })

  return pdf
}

function renderTextElement(pdf: jsPDF, element: DocumentElement) {
  if (!element.content) return

  const {
    x = 0,
    y = 0,
    width = 400,
    fontSize = 12,
    fontFamily = 'helvetica',
    fontWeight = 'normal',
    color = '#000000',
    align = 'left',
    opacity = 1
  } = element

  // Set font
  const fontStyle = fontWeight === 'bold' ? 'bold' : 'normal'
  pdf.setFont(fontFamily.toLowerCase(), fontStyle)
  pdf.setFontSize(fontSize)

  // Set color
  const rgb = hexToRgb(color)
  pdf.setTextColor(rgb.r, rgb.g, rgb.b)

  // Set opacity
  pdf.setGState(new (pdf as any).GState({ opacity }))

  // Split text into lines that fit within width
  const lines = pdf.splitTextToSize(element.content, width)

  // Render text
  pdf.text(lines, x, y, {
    align: align as 'left' | 'center' | 'right' | 'justify',
    maxWidth: width
  })

  // Reset opacity
  pdf.setGState(new (pdf as any).GState({ opacity: 1 }))
}

function renderImageElement(pdf: jsPDF, element: DocumentElement) {
  if (!element.imageUrl) return

  const {
    x = 0,
    y = 0,
    width = 200,
    height = 200,
    opacity = 1
  } = element

  try {
    // Set opacity
    if (opacity < 1) {
      pdf.setGState(new (pdf as any).GState({ opacity }))
    }

    // Add image (this would need actual image data in production)
    // For now, draw a placeholder rectangle
    pdf.setFillColor(240, 240, 240)
    pdf.rect(x, y, width, height, 'F')
    
    pdf.setFontSize(10)
    pdf.setTextColor(128, 128, 128)
    pdf.text('Image', x + width / 2, y + height / 2, { align: 'center' })

    // Reset opacity
    if (opacity < 1) {
      pdf.setGState(new (pdf as any).GState({ opacity: 1 }))
    }
  } catch (error) {
    console.error('Error rendering image:', error)
  }
}

function renderShapeElement(pdf: jsPDF, element: DocumentElement) {
  const {
    x = 0,
    y = 0,
    width = 100,
    height = 100,
    shape = 'rectangle',
    fill = '#CCCCCC',
    stroke = '#000000',
    strokeWidth = 1,
    opacity = 1
  } = element

  // Set opacity
  if (opacity < 1) {
    pdf.setGState(new (pdf as any).GState({ opacity }))
  }

  // Set colors
  const fillRgb = hexToRgb(fill)
  const strokeRgb = hexToRgb(stroke)
  
  pdf.setFillColor(fillRgb.r, fillRgb.g, fillRgb.b)
  pdf.setDrawColor(strokeRgb.r, strokeRgb.g, strokeRgb.b)
  pdf.setLineWidth(strokeWidth)

  // Draw shape
  switch (shape) {
    case 'rectangle':
      pdf.rect(x, y, width, height, 'FD')
      break
    case 'circle':
      const radius = Math.min(width, height) / 2
      pdf.circle(x + radius, y + radius, radius, 'FD')
      break
    case 'triangle':
      pdf.triangle(
        x + width / 2, y,
        x, y + height,
        x + width, y + height,
        'FD'
      )
      break
  }

  // Reset opacity
  if (opacity < 1) {
    pdf.setGState(new (pdf as any).GState({ opacity: 1 }))
  }
}

function renderLineElement(pdf: jsPDF, element: DocumentElement) {
  const {
    x = 0,
    y = 0,
    width = 100,
    stroke = '#000000',
    strokeWidth = 1,
    opacity = 1
  } = element

  // Set opacity
  if (opacity < 1) {
    pdf.setGState(new (pdf as any).GState({ opacity }))
  }

  // Set color
  const rgb = hexToRgb(stroke)
  pdf.setDrawColor(rgb.r, rgb.g, rgb.b)
  pdf.setLineWidth(strokeWidth)

  // Draw line
  pdf.line(x, y, x + width, y)

  // Reset opacity
  if (opacity < 1) {
    pdf.setGState(new (pdf as any).GState({ opacity: 1 }))
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 }
}