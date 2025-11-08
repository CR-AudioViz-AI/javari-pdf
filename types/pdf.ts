export interface PDFDocument {
  id: string
  title: string
  template: string
  pages: Page[]
  settings: DocumentSettings
}

export interface Page {
  id: string
  elements: DocumentElement[]
}

export interface DocumentElement {
  id: string
  type: 'text' | 'image' | 'shape' | 'line'
  x: number
  y: number
  width: number
  height: number
  
  // Text properties
  content?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  color?: string
  align?: 'left' | 'center' | 'right' | 'justify'
  
  // Image properties
  imageUrl?: string
  imageFit?: 'cover' | 'contain' | 'fill'
  
  // Shape properties
  shape?: 'rectangle' | 'circle' | 'triangle'
  fill?: string
  stroke?: string
  strokeWidth?: number
  
  // Common properties
  rotation?: number
  opacity?: number
  zIndex?: number
}

export interface DocumentSettings {
  pageSize: 'letter' | 'a4' | 'legal' | 'tabloid'
  orientation: 'portrait' | 'landscape'
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  font: string
  fontSize: number
  lineHeight: number
}

export interface Template {
  id: string
  name: string
  category: string
  description: string
  thumbnail: string
  defaultElements?: DocumentElement[]
}

export interface SavedDocument {
  id: string
  user_id: string
  title: string
  template: string
  content: PDFDocument
  created_at: string
  updated_at: string
}