/**
 * PDF BUILDER PRO - TOOLS DASHBOARD
 * Comprehensive PDF manipulation tools UI
 * 
 * CR AudioViz AI - Fortune 50 Quality Standards
 * @version 2.0.0
 * @date December 27, 2025
 */

'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FileText, Merge, Scissors, RotateCw, Minimize2, Droplet,
  Lock, FileSignature, FileInput, FileOutput, Image, Hash,
  Trash2, ArrowUpDown, Loader2, Download, CreditCard,
  CheckCircle, AlertCircle, X
} from 'lucide-react';

// Tool definitions
const PDF_TOOLS = [
  // ORGANIZE
  { id: 'merge', name: 'Merge PDFs', description: 'Combine multiple PDFs into one', icon: <Merge className="w-6 h-6" />, credits: 2, category: 'organize', endpoint: '/api/pdf-operations', operation: 'merge', acceptMultiple: true },
  { id: 'split', name: 'Split PDF', description: 'Extract pages or split into files', icon: <Scissors className="w-6 h-6" />, credits: 2, category: 'organize', endpoint: '/api/pdf-operations', operation: 'split', additionalFields: [{ name: 'range', label: 'Page Range', type: 'text', placeholder: '1-3, 5, 7-9' }] },
  { id: 'rotate', name: 'Rotate Pages', description: 'Rotate pages by 90°, 180°, 270°', icon: <RotateCw className="w-6 h-6" />, credits: 1, category: 'organize', endpoint: '/api/pdf-operations', operation: 'rotate', additionalFields: [{ name: 'angle', label: 'Angle', type: 'select', options: [{ value: '90', label: '90°' }, { value: '180', label: '180°' }, { value: '270', label: '270°' }], default: '90' }] },
  { id: 'reorder', name: 'Reorder Pages', description: 'Rearrange page order', icon: <ArrowUpDown className="w-6 h-6" />, credits: 1, category: 'organize', endpoint: '/api/pdf-operations', operation: 'reorder_pages', additionalFields: [{ name: 'order', label: 'New Order', type: 'text', placeholder: '3,1,2,4' }] },
  { id: 'delete', name: 'Delete Pages', description: 'Remove specific pages', icon: <Trash2 className="w-6 h-6" />, credits: 1, category: 'organize', endpoint: '/api/pdf-operations', operation: 'delete_pages', additionalFields: [{ name: 'pages', label: 'Pages', type: 'text', placeholder: '2, 4, 6-8' }] },
  { id: 'page-numbers', name: 'Add Page Numbers', description: 'Insert page numbers', icon: <Hash className="w-6 h-6" />, credits: 1, category: 'organize', endpoint: '/api/pdf-operations', operation: 'add_page_numbers', additionalFields: [{ name: 'position', label: 'Position', type: 'select', options: [{ value: 'bottom-center', label: 'Bottom Center' }, { value: 'bottom-right', label: 'Bottom Right' }], default: 'bottom-center' }] },
  // EDIT
  { id: 'compress', name: 'Compress PDF', description: 'Reduce file size', icon: <Minimize2 className="w-6 h-6" />, credits: 3, category: 'edit', endpoint: '/api/pdf-operations', operation: 'compress' },
  { id: 'watermark', name: 'Add Watermark', description: 'Add text watermark', icon: <Droplet className="w-6 h-6" />, credits: 2, category: 'edit', endpoint: '/api/pdf-operations', operation: 'watermark', additionalFields: [{ name: 'text', label: 'Text', type: 'text', placeholder: 'CONFIDENTIAL', default: 'CONFIDENTIAL' }, { name: 'position', label: 'Position', type: 'select', options: [{ value: 'diagonal', label: 'Diagonal' }, { value: 'center', label: 'Center' }], default: 'diagonal' }] },
  { id: 'sign', name: 'Sign Document', description: 'Add digital signature', icon: <FileSignature className="w-6 h-6" />, credits: 3, category: 'edit', endpoint: '/api/pdf-signatures', operation: 'sign', additionalFields: [{ name: 'signatureName', label: 'Your Name', type: 'text', placeholder: 'John Doe' }, { name: 'page', label: 'Page', type: 'number', default: 1 }] },
  // CONVERT
  { id: 'images-to-pdf', name: 'Images to PDF', description: 'Convert images to PDF', icon: <FileInput className="w-6 h-6" />, credits: 2, category: 'convert', endpoint: '/api/pdf-conversions', operation: 'images-to-pdf', acceptMultiple: true },
  { id: 'markdown-to-pdf', name: 'Markdown to PDF', description: 'Convert Markdown to PDF', icon: <FileOutput className="w-6 h-6" />, credits: 2, category: 'convert', endpoint: '/api/pdf-conversions', operation: 'markdown-to-pdf', additionalFields: [{ name: 'markdown', label: 'Markdown', type: 'textarea', placeholder: '# Heading\n\nContent...' }, { name: 'title', label: 'Title', type: 'text' }] },
  { id: 'text-to-pdf', name: 'Text to PDF', description: 'Convert text to PDF', icon: <FileText className="w-6 h-6" />, credits: 1, category: 'convert', endpoint: '/api/pdf-conversions', operation: 'text-to-pdf', additionalFields: [{ name: 'text', label: 'Text', type: 'textarea' }, { name: 'title', label: 'Title', type: 'text' }] },
  // SECURE
  { id: 'fill-form', name: 'Fill PDF Form', description: 'Fill form fields', icon: <FileInput className="w-6 h-6" />, credits: 3, category: 'secure', endpoint: '/api/pdf-forms', operation: 'fill', additionalFields: [{ name: 'fields', label: 'Fields (JSON)', type: 'textarea', placeholder: '[{"name": "field1", "value": "value1"}]' }] },
  { id: 'flatten-form', name: 'Flatten Form', description: 'Make forms non-editable', icon: <Lock className="w-6 h-6" />, credits: 2, category: 'secure', endpoint: '/api/pdf-forms', operation: 'flatten' },
];

const CATEGORIES = [
  { id: 'organize', name: 'Organize', icon: <FileText className="w-5 h-5" /> },
  { id: 'edit', name: 'Edit', icon: <FileSignature className="w-5 h-5" /> },
  { id: 'convert', name: 'Convert', icon: <FileOutput className="w-5 h-5" /> },
  { id: 'secure', name: 'Secure', icon: <Lock className="w-5 h-5" /> },
];

export default function PDFToolsDashboard() {
  const [selectedTool, setSelectedTool] = useState(null);
  const [files, setFiles] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [processing, setProcessing] = useState({ status: 'idle', progress: 0, message: '' });
  const [credits, setCredits] = useState(100);
  const [activeCategory, setActiveCategory] = useState('organize');

  const onDrop = useCallback((acceptedFiles) => {
    if (selectedTool?.acceptMultiple) {
      setFiles(prev => [...prev, ...acceptedFiles]);
    } else {
      setFiles(acceptedFiles.slice(0, 1));
    }
  }, [selectedTool]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: selectedTool?.id?.includes('images') 
      ? { 'image/*': ['.png', '.jpg', '.jpeg'] }
      : { 'application/pdf': ['.pdf'] },
    multiple: selectedTool?.acceptMultiple || false,
  });

  const handleFieldChange = (name, value) => {
    setFieldValues(prev => ({ ...prev, [name]: value }));
  };

  const handleProcess = async () => {
    if (!selectedTool) return;
    
    const needsFiles = !['markdown-to-pdf', 'text-to-pdf'].includes(selectedTool.id);
    if (needsFiles && files.length === 0) {
      setProcessing({ status: 'error', progress: 0, message: 'Please upload a file first' });
      return;
    }

    if (credits < selectedTool.credits) {
      setProcessing({ status: 'error', progress: 0, message: `Insufficient credits. Need ${selectedTool.credits}` });
      return;
    }

    setProcessing({ status: 'processing', progress: 20, message: 'Processing...' });

    try {
      const formData = new FormData();
      if (selectedTool.acceptMultiple) {
        files.forEach(file => formData.append('files', file));
      } else if (files.length > 0) {
        formData.append('file', files[0]);
      }
      Object.entries(fieldValues).forEach(([key, value]) => {
        if (value !== undefined && value !== '') formData.append(key, String(value));
      });

      if (selectedTool.id === 'sign') {
        formData.append('signature', JSON.stringify({
          type: 'type', data: fieldValues.signatureName || 'Signature',
          x: 100, y: 100, page: fieldValues.page || 1, includeDate: true
        }));
      }

      setProcessing(prev => ({ ...prev, progress: 50 }));

      const response = await fetch(`${selectedTool.endpoint}?operation=${selectedTool.operation}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}` },
        body: formData,
      });

      if (!response.ok) throw new Error((await response.json()).error || 'Failed');

      const contentType = response.headers.get('Content-Type');
      if (contentType?.includes('application/pdf')) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'result.pdf';
        setProcessing({ status: 'complete', progress: 100, message: 'Done!', resultUrl: url, resultFilename: filename });
        setCredits(prev => prev - selectedTool.credits);
      } else {
        setProcessing({ status: 'complete', progress: 100, message: (await response.json()).message || 'Done!' });
      }
    } catch (error) {
      setProcessing({ status: 'error', progress: 0, message: error.message || 'Failed' });
    }
  };

  const handleDownload = () => {
    if (processing.resultUrl) {
      const link = document.createElement('a');
      link.href = processing.resultUrl;
      link.download = processing.resultFilename || 'result.pdf';
      link.click();
    }
  };

  const handleReset = () => {
    setFiles([]);
    setFieldValues({});
    setProcessing({ status: 'idle', progress: 0, message: '' });
  };

  const filteredTools = PDF_TOOLS.filter(tool => tool.category === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg"><FileText className="w-6 h-6 text-white" /></div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PDF Builder Pro</h1>
              <p className="text-sm text-gray-500">All-in-one PDF toolkit</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-900">{credits} credits</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${activeCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                  {cat.icon}{cat.name}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {filteredTools.map(tool => (
                <button key={tool.id} onClick={() => { setSelectedTool(tool); handleReset(); }}
                  className={`p-4 rounded-xl border-2 transition text-left ${selectedTool?.id === tool.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg ${selectedTool?.id === tool.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{tool.icon}</div>
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">{tool.credits} credits</span>
                  </div>
                  <h3 className="mt-3 font-semibold text-gray-900">{tool.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{tool.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              {selectedTool ? (
                <>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">{selectedTool.name}</h2>

                  {!['markdown-to-pdf', 'text-to-pdf'].includes(selectedTool.id) && (
                    <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}>
                      <input {...getInputProps()} />
                      <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">{isDragActive ? 'Drop here...' : selectedTool.id.includes('images') ? 'Drop images' : 'Drop PDF'}</p>
                    </div>
                  )}

                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <button onClick={() => setFiles(files.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedTool.additionalFields && (
                    <div className="mt-4 space-y-4">
                      {selectedTool.additionalFields.map(field => (
                        <div key={field.name}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                          {field.type === 'select' && (
                            <select value={fieldValues[field.name] ?? field.default ?? ''} onChange={(e) => handleFieldChange(field.name, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                              {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                          )}
                          {field.type === 'text' && (
                            <input type="text" value={fieldValues[field.name] ?? ''} onChange={(e) => handleFieldChange(field.name, e.target.value)}
                              placeholder={field.placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                          )}
                          {field.type === 'number' && (
                            <input type="number" value={fieldValues[field.name] ?? field.default ?? ''} onChange={(e) => handleFieldChange(field.name, parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                          )}
                          {field.type === 'textarea' && (
                            <textarea value={fieldValues[field.name] ?? ''} onChange={(e) => handleFieldChange(field.name, e.target.value)}
                              placeholder={field.placeholder} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {processing.status !== 'idle' && (
                    <div className={`mt-4 p-3 rounded-lg ${processing.status === 'error' ? 'bg-red-50' : processing.status === 'complete' ? 'bg-green-50' : 'bg-blue-50'}`}>
                      <div className="flex items-center gap-2">
                        {processing.status === 'processing' && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
                        {processing.status === 'complete' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {processing.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                        <span className={`text-sm font-medium ${processing.status === 'error' ? 'text-red-700' : processing.status === 'complete' ? 'text-green-700' : 'text-blue-700'}`}>{processing.message}</span>
                      </div>
                      {processing.status === 'processing' && (
                        <div className="mt-2 bg-blue-200 rounded-full h-2">
                          <div className="bg-blue-600 rounded-full h-2 transition-all" style={{ width: `${processing.progress}%` }} />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-6 space-y-3">
                    {processing.status === 'complete' && processing.resultUrl ? (
                      <button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
                        <Download className="w-5 h-5" />Download Result
                      </button>
                    ) : (
                      <button onClick={handleProcess} disabled={processing.status === 'processing'}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50">
                        {processing.status === 'processing' ? <><Loader2 className="w-5 h-5 animate-spin" />Processing...</> : <>{selectedTool.icon}{selectedTool.name} ({selectedTool.credits} credits)</>}
                      </button>
                    )}
                    {(files.length > 0 || processing.status !== 'idle') && (
                      <button onClick={handleReset} className="w-full px-4 py-2 text-gray-600 hover:text-gray-900 transition text-sm">Start Over</button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a tool to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
