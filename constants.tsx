import React from 'react';
import { 
  FileText, Files, Scissors, Zap, FileUp, FileImage, Languages, 
  BrainCircuit, ScanText, Lock, RotateCw, LayoutGrid, Monitor, 
  Repeat, Unlock, ShieldAlert, PenTool, Minimize2, Wrench, 
  Eye, FileCheck, FileCode, FileSearch, Trash2, Layers, 
  Stamp, Table, Hash, Type, FileJson, Mail, Share2, 
  Palette, Download, Cloud, Cpu, Sparkles, BookOpen, 
  ArrowRightLeft, ListOrdered, Shapes, Grid, Bookmark, 
  Clock, History, HardDrive, Settings, Smartphone, MessageSquare
} from 'lucide-react';
import { Tool } from './types';

export const TOOLS: Tool[] = [
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    description: 'Convert PDF documents to editable Microsoft Word files.',
    icon: <FileText className="w-8 h-8" />,
    category: 'convert',
    color: 'bg-at-teal dark:bg-at-teal-dark'
  },
  {
    id: 'pdf-to-ppt',
    name: 'PDF to PPT',
    description: 'Turn PDF pages into PowerPoint presentation slides.',
    icon: <Monitor className="w-8 h-8" />,
    category: 'convert',
    color: 'bg-noir-text dark:bg-at-teal-dark'
  },
  {
    id: 'merge-pdf',
    name: 'Merge PDF',
    description: 'Combine multiple PDFs into one single document.',
    icon: <Files className="w-8 h-8" />,
    category: 'edit',
    color: 'bg-noir-text dark:bg-at-teal-dark'
  },
  {
    id: 'split-pdf',
    name: 'Split PDF',
    description: 'Separate one page or a whole set for easy conversion.',
    icon: <Scissors className="w-8 h-8" />,
    category: 'edit',
    color: 'bg-at-teal dark:bg-at-teal-dark'
  },
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    description: 'Reduce file size while optimizing for maximal PDF quality.',
    icon: <Zap className="w-8 h-8" />,
    category: 'optimize',
    color: 'bg-at-amber dark:bg-at-amber-dark'
  },
  {
    id: 'protect-pdf',
    name: 'Protect PDF',
    description: 'Protect PDF files with a password. Encrypt documents securely.',
    icon: <Lock className="w-8 h-8" />,
    category: 'security',
    color: 'bg-noir-text dark:bg-at-teal-dark'
  },
  {
    id: 'rotate-pdf',
    name: 'Rotate PDF',
    description: 'Rotate your PDFs the way you need them. Supports batch mode.',
    icon: <RotateCw className="w-8 h-8" />,
    category: 'edit',
    color: 'bg-at-teal dark:bg-at-teal-dark'
  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF to JPG',
    description: 'Extract images or convert each page to high-quality JPG.',
    icon: <FileImage className="w-8 h-8" />,
    category: 'convert',
    color: 'bg-at-teal dark:bg-at-teal-dark'
  },
  {
    id: 'jpg-to-pdf',
    name: 'Image to PDF',
    description: 'Convert JPG, PNG and other images into a professional PDF.',
    icon: <FileImage className="w-8 h-8" />,
    category: 'convert',
    color: 'bg-at-teal dark:bg-at-teal-dark'
  },
  {
    id: 'ai-summarize',
    name: 'AI Summarize',
    description: 'Get key insights from long PDF documents instantly.',
    icon: <BrainCircuit className="w-8 h-8" />,
    category: 'ai',
    color: 'bg-noir-text dark:bg-at-amber-dark'
  },
  {
    id: 'ai-ocr',
    name: 'AI OCR',
    description: 'Extract text from scanned documents and images.',
    icon: <ScanText className="w-8 h-8" />,
    category: 'ai',
    color: 'bg-at-teal dark:bg-at-teal-dark'
  },
  {
    id: 'pdf-translate',
    name: 'Translate PDF',
    description: 'Translate documents into 100+ languages instantly.',
    icon: <Languages className="w-8 h-8" />,
    category: 'ai',
    color: 'bg-at-amber dark:bg-at-amber-dark'
  },
  {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    description: 'Convert DOC and DOCX files to professional PDF.',
    icon: <FileUp className="w-8 h-8" />,
    category: 'convert',
    color: 'bg-noir-text dark:bg-at-teal-dark'
  },
  { id: 'excel-to-pdf', name: 'Excel to PDF', description: 'Transform spreadsheets into clean PDF documents.', icon: <Table />, category: 'convert', color: 'bg-at-teal dark:bg-at-teal-dark' },
  { id: 'ppt-to-pdf', name: 'PPT to PDF', description: 'Convert presentation slides to portable PDF format.', icon: <Monitor />, category: 'convert', color: 'bg-noir-text dark:bg-at-teal-dark' },
  { id: 'unlock-pdf', name: 'Unlock PDF', description: 'Remove password and permissions from secured PDFs.', icon: <Unlock />, category: 'security', color: 'bg-at-teal dark:bg-at-teal-dark' },
  { id: 'watermark-pdf', name: 'Watermark PDF', description: 'Add image or text stamps over your document pages.', icon: <Stamp />, category: 'security', color: 'bg-noir-text dark:bg-at-teal-dark' },
  { id: 'sign-pdf', name: 'Sign PDF', description: 'Add your digital signature to PDF documents securely.', icon: <PenTool />, category: 'security', color: 'bg-at-teal dark:bg-at-teal-dark' },
  { id: 'repair-pdf', name: 'Repair PDF', description: 'Fix corrupted PDF files and recover data.', icon: <Wrench />, category: 'optimize', color: 'bg-noir-text dark:bg-at-amber-dark' },
  { id: 'page-numbers', name: 'Page Numbers', description: 'Add page numbers to PDF with custom positioning.', icon: <Hash />, category: 'edit', color: 'bg-at-teal dark:bg-at-teal-dark' },
  { id: 'edit-pdf', name: 'Edit PDF', description: 'Add text, shapes, and images directly to your PDF.', icon: <Type />, category: 'edit', color: 'bg-noir-text dark:bg-at-teal-dark' },
  { id: 'pdf-to-html', name: 'PDF to HTML', description: 'Convert PDF files to web-friendly HTML code.', icon: <FileCode />, category: 'convert', color: 'bg-at-teal dark:bg-at-teal-dark' },
  { id: 'pdf-to-excel', name: 'PDF to Excel', description: 'Extract tables from PDF to editable Excel sheets.', icon: <Table />, category: 'convert', color: 'bg-noir-text dark:bg-at-teal-dark' },
  { id: 'ocr-batch', name: 'Batch OCR', description: 'Process hundreds of images into text at once.', icon: <Layers />, category: 'ai', color: 'bg-noir-text dark:bg-at-amber-dark' },
  { id: 'analyze-pdf', name: 'AI Analyzer', description: 'Deep analysis of document structure and metadata.', icon: <Cpu />, category: 'ai', color: 'bg-at-teal dark:bg-at-teal-dark' },
  { id: 'redact-pdf', name: 'Redact PDF', description: 'Permanently hide sensitive information in documents.', icon: <Trash2 />, category: 'security', color: 'bg-noir-text dark:bg-at-teal-dark' },
  { id: 'validate-pdf', name: 'Validate PDF', description: 'Check PDF compliance with ISO standards like PDF/A.', icon: <FileCheck />, category: 'optimize', color: 'bg-at-teal dark:bg-at-teal-dark' },
  { id: 'compare-pdf', name: 'Compare PDF', description: 'Find differences between two versions of a document.', icon: <ArrowRightLeft />, category: 'edit', color: 'bg-noir-text dark:bg-at-teal-dark' },
  { id: 'flatten-pdf', name: 'Flatten PDF', description: 'Merge form fields and annotations into the page content.', icon: <Shapes />, category: 'edit', color: 'bg-at-teal dark:bg-at-teal-dark' },
  { id: 'organize-pdf', name: 'Organize PDF', description: 'Rearrange, delete or add pages with visual editor.', icon: <Grid />, category: 'edit', color: 'bg-noir-text dark:bg-at-teal-dark' },
  { id: 'pdf-to-json', name: 'PDF to JSON', description: 'Export document data into structured JSON format.', icon: <FileJson />, category: 'convert', color: 'bg-at-teal dark:bg-at-teal-dark' },
  { id: 'email-to-pdf', name: 'Email to PDF', description: 'Convert email threads and attachments to PDF archive.', icon: <Mail />, category: 'convert', color: 'bg-noir-text dark:bg-at-teal-dark' },
  { id: 'share-pdf', name: 'Secure Share', description: 'Share documents with expiry links and tracking.', icon: <Share2 />, category: 'security', color: 'bg-at-teal dark:bg-at-teal-dark' },
  { id: 'optimize-web', name: 'Web Optimizer', description: 'Optimize PDF for fast rendering on mobile and web.', icon: <Smartphone />, category: 'optimize', color: 'bg-noir-text dark:bg-at-amber-dark' },
  { id: 'metadata-editor', name: 'Metadata Editor', description: 'Change author, title, and keywords of your PDF.', icon: <Settings />, category: 'edit', color: 'bg-at-teal dark:bg-at-teal-dark' },
  { id: 'dark-mode-pdf', name: 'Dark Mode PDF', description: 'Invert document colors for comfortable night reading.', icon: <Eye />, category: 'optimize', color: 'bg-noir-text dark:bg-at-teal-dark' },
  { id: 'compress-images', name: 'Image Compactor', description: 'Heavily compress document images without blur.', icon: <Minimize2 />, category: 'optimize', color: 'bg-at-teal dark:bg-at-teal-dark' },
  { id: 'pdf-search', name: 'Global Search', description: 'Search across all your stored documents instantly.', icon: <FileSearch />, category: 'ai', color: 'bg-noir-text dark:bg-at-amber-dark' },
  { id: 'ai-chat', name: 'Chat with PDF', description: 'Ask questions directly to your document context.', icon: <MessageSquare />, category: 'ai', color: 'bg-at-teal dark:bg-at-teal-dark' },
  { id: 'epub-to-pdf', name: 'EPUB to PDF', description: 'Convert eBooks to standard printable PDF format.', icon: <BookOpen />, category: 'convert', color: 'bg-noir-text dark:bg-at-teal-dark' },
  { id: 'pdf-bookmarks', name: 'Manage Bookmarks', description: 'Create and edit document outline and bookmarks.', icon: <Bookmark />, category: 'edit', color: 'bg-at-teal dark:bg-at-teal-dark' },
  { id: 'timestamp-pdf', name: 'Timestamp PDF', description: 'Add certified time-stamps for legal validity.', icon: <Clock />, category: 'security', color: 'bg-noir-text dark:bg-at-teal-dark' },
  { id: 'pdf-history', name: 'Version History', description: 'Track and revert changes across document sessions.', icon: <History />, category: 'edit', color: 'bg-at-teal dark:bg-at-teal-dark' },
  { id: 'cloud-sync', name: 'Cloud Sync', description: 'Sync your workspace across all your devices.', icon: <Cloud />, category: 'optimize', color: 'bg-noir-text dark:bg-at-teal-dark' },
  { id: 'local-backup', name: 'Local Backup', description: 'Export your entire workspace for local storage.', icon: <HardDrive />, category: 'security', color: 'bg-at-teal dark:bg-at-teal-dark' },
  { id: 'smart-folders', name: 'Smart Folders', description: 'Automatically categorize documents using AI.', icon: <LayoutGrid />, category: 'ai', color: 'bg-noir-text dark:bg-at-amber-dark' },
  { id: 'palette-gen', name: 'Palette Gen', description: 'Extract color themes from your document visuals.', icon: <Palette />, category: 'ai', color: 'bg-at-teal dark:bg-at-teal-dark' },
  { id: 'high-res-print', name: 'Print Ready', description: 'Prepare documents for professional grade printing.', icon: <Palette />, category: 'optimize', color: 'bg-noir-text dark:bg-at-teal-dark' },
  { id: 'pdf-to-svg', name: 'PDF to SVG', description: 'Convert vector graphics in PDF to scalable SVG.', icon: <Shapes />, category: 'convert', color: 'bg-at-teal dark:bg-at-teal-dark' },
  { id: 'barcode-scan', name: 'Barcode Reader', description: 'Find and decode barcodes within PDF pages.', icon: <ScanText />, category: 'ai', color: 'bg-noir-text dark:bg-at-teal-dark' },
  { id: 'pdf-forms', name: 'Form Builder', description: 'Create interactive fillable PDF forms from scratch.', icon: <ListOrdered />, category: 'edit', color: 'bg-at-teal dark:bg-at-teal-dark' },
  { id: 'smart-crop', name: 'Smart Crop', description: 'AI-assisted margin removal and content centering.', icon: <Scissors />, category: 'optimize', color: 'bg-noir-text dark:bg-at-teal-dark' },
  { id: 'pdf-join', name: 'Join Images', description: 'Stitch multiple images into a seamless long PDF.', icon: <Layers />, category: 'edit', color: 'bg-at-teal dark:bg-at-teal-dark' },
  { id: 'secure-delete', name: 'Secure Delete', description: 'Permanently wipe files beyond software recovery.', icon: <Trash2 />, category: 'security', color: 'bg-noir-text dark:bg-at-teal-dark' },
  { id: 'font-embed', name: 'Font Embed', description: 'Ensure document portability by embedding all fonts.', icon: <Type />, category: 'optimize', color: 'bg-at-teal dark:bg-at-teal-dark' }
];