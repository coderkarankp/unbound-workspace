
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Upload, X, File as FileIcon, Loader2, ArrowLeft, 
  Zap, Scissors, FileText, Download, Sparkles,
  RefreshCw, ZoomIn, AlertTriangle, Archive, FileDown,
  ShieldCheck, Layers, MousePointer2, ListFilter,
  CheckSquare, Square, ArrowUp, ArrowDown, Trash2,
  Plus, Lock, RotateCw, Image as ImageIcon, Eye, Shield,
  ChevronRight, ChevronLeft, Save, CheckCircle2, Monitor,
  ScanText, Table, FileJson, Globe, Type, Palette, 
  Layout, Stamp, ListChecks
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import pptxgen from 'pptxgenjs';
import { TOOLS } from '../constants';
import { FileState } from '../types';
import { reconstructAsWord, summarizeDocument, performOCR, translateText, scanBarcodes, extractTableData, extractJSON } from '../services/geminiService';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

interface SplitResult {
  id: string;
  name: string;
  pages: { pageNum: number; blob: Blob; url: string }[];
  isMergedResult?: boolean;
}

interface ProcessingResult {
  id: string;
  name: string;
  content: string;
  before: string;
  after: string;
  blob?: Blob;
  url?: string;
  isDocx?: boolean;
  isZip?: boolean;
}

const PageThumbnail: React.FC<{ 
  pdfDoc: pdfjsLib.PDFDocumentProxy; 
  pageNum: number; 
  isSelected?: boolean;
  onToggle?: () => void;
}> = ({ pdfDoc, pageNum, isSelected, onToggle }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.25 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (isMounted) {
          // Fix: Add canvas property which is mandatory in newer pdfjs-dist RenderParameters
          await page.render({ canvasContext: context, viewport, canvas }).promise;
        }
      } catch (err) {
        console.error(`Error rendering page ${pageNum}:`, err);
      }
    };

    renderPage();
    return () => { isMounted = false; };
  }, [pdfDoc, pageNum]);

  return (
    <div 
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative cursor-pointer group rounded-xl transition-all duration-300 ${isSelected ? 'ring-4 ring-at-teal ring-offset-4 dark:ring-offset-noir-bg-dark' : 'hover:scale-[1.02]'}`}
    >
      <div className={`absolute inset-0 z-10 rounded-lg transition-colors ${isSelected ? 'bg-at-teal/10' : isHovered ? 'bg-noir-text/5' : ''}`} />
      <div className="absolute top-2 right-2 z-20">
        {isSelected ? (
          <div className="bg-at-teal text-white p-1 rounded-full shadow-lg"><CheckCircle2 className="w-4 h-4" /></div>
        ) : (
          <div className="bg-white/80 dark:bg-noir-bg-dark/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Plus className="w-4 h-4 text-noir-text-muted" /></div>
        )}
      </div>
      <canvas ref={canvasRef} className="w-full h-auto shadow-md rounded-lg dark:opacity-90" />
      <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-noir-text-muted text-center">Page {pageNum}</div>
    </div>
  );
};

const parseTextToDocxChildren = (text: string) => {
  const lines = text.split('\n');
  return lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) return new Paragraph({ text: trimmed.replace('# ', ''), heading: HeadingLevel.HEADING_1 });
    if (trimmed.startsWith('## ')) return new Paragraph({ text: trimmed.replace('## ', ''), heading: HeadingLevel.HEADING_2 });
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) return new Paragraph({ children: [new TextRun(trimmed.replace(/^[*|-]\s/, ''))], bullet: { level: 0 } });
    return new Paragraph({ children: [new TextRun(line)] });
  });
};

const parseRanges = (input: string, max: number): number[] => {
  const pages = new Set<number>();
  const parts = input.split(',').map(p => p.trim());
  parts.forEach(part => {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, Math.min(start, end)); i <= Math.min(max, Math.max(start, end)); i++) {
          pages.add(i);
        }
      }
    } else {
      const num = Number(part);
      if (!isNaN(num) && num >= 1 && num <= max) {
        pages.add(num);
      }
    }
  });
  return Array.from(pages).sort((a, b) => a - b);
};

export const ToolPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const tool = TOOLS.find(t => t.id === id);
  
  const [files, setFiles] = useState<FileState[]>([]);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProgressMessage, setCurrentProgressMessage] = useState<string>('');
  const [batchResult, setBatchResult] = useState<ProcessingResult[]>([]);
  const [splitResult, setSplitResult] = useState<SplitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Tool-specific states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rotateAngle, setRotateAngle] = useState(90);
  const [targetLang, setTargetLang] = useState('English');

  // Split specific states
  const [splitMode, setSplitMode] = useState<'individual' | 'merged'>('individual');
  const [rangeInput, setRangeInput] = useState('');

  // Watermark specific states
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkImage, setWatermarkImage] = useState<string | null>(null);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.4);
  const [watermarkRotation, setWatermarkRotation] = useState(-45);
  const [watermarkSize, setWatermarkSize] = useState(60);
  const [watermarkColor, setWatermarkColor] = useState('#ff0000');

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearSession = () => {
    if (pdfDoc) pdfDoc.destroy();
    setPdfDoc(null);
    setNumPages(0);
    setSelectedPages([]);
    setError(null);
    setFiles([]);
    setBatchResult(res => {
      res.forEach(r => r.url && URL.revokeObjectURL(r.url));
      return [];
    });
    if (splitResult) {
      splitResult.pages.forEach(p => URL.revokeObjectURL(p.url));
      setSplitResult(null);
    }
    setPassword('');
    setConfirmPassword('');
    setCurrentProgressMessage('');
    setWatermarkImage(null);
    setRangeInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | FileList) => {
    const uploadedFiles = (e instanceof FileList ? Array.from(e) : (e.target.files ? Array.from(e.target.files) : [])) as File[];
    if (uploadedFiles.length === 0) return;

    const isImageTool = id === 'jpg-to-pdf';
    const isWordTool = id === 'word-to-pdf';
    const filteredFiles = uploadedFiles.filter(f => {
      if (isImageTool) return f.type.startsWith('image/');
      if (isWordTool) return f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || f.type === 'application/msword';
      return f.type === 'application/pdf';
    });

    if (filteredFiles.length === 0) {
      setError(isImageTool ? "Please upload valid image files (JPG, PNG)." : isWordTool ? "Please upload valid Word documents." : "Please upload a valid PDF document.");
      return;
    }

    const newFiles: FileState[] = filteredFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'idle',
      progress: 0,
      originalSize: file.size
    }));

    const batchFriendly = [
      'pdf-to-word', 'compress-pdf', 'protect-pdf', 'rotate-pdf', 'pdf-to-jpg', 
      'merge-pdf', 'jpg-to-pdf', 'pdf-to-ppt', 'ai-summarize', 'ai-ocr', 
      'pdf-translate', 'barcode-scan', 'pdf-to-excel', 'pdf-to-json', 'word-to-pdf',
      'watermark-pdf', 'split-pdf'
    ];

    if (batchFriendly.includes(id || '')) {
      setFiles(prev => [...prev, ...newFiles]);
    } else {
      setFiles(newFiles);
    }

    if (!isImageTool && !isWordTool && newFiles.length > 0 && newFiles[0].file.type === 'application/pdf' && !['merge-pdf'].includes(id || '')) {
      try {
        const loadingTask = pdfjsLib.getDocument(await newFiles[0].file.arrayBuffer());
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setSelectedPages(Array.from({ length: doc.numPages }, (_, i) => i + 1));
      } catch (err) {
        setError("Failed to parse PDF. File may be corrupted or encrypted.");
      }
    }
  };

  const togglePageSelection = (num: number) => {
    setSelectedPages(prev => 
      prev.includes(num) ? prev.filter(p => p !== num) : [...prev, num].sort((a,b) => a-b)
    );
  };

  const handleRangeInput = (val: string) => {
    setRangeInput(val);
    if (val.trim()) {
      const parsed = parseRanges(val, numPages);
      if (parsed.length > 0) setSelectedPages(parsed);
    }
  };

  const handleWatermarkImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setWatermarkImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const updateFileStatus = (fileId: string, status: FileState['status'], progress: number) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status, progress } : f));
  };

  const runPipeline = async () => {
    setIsProcessing(true);
    setError(null);
    setBatchResult([]);
    const results: ProcessingResult[] = [];

    try {
      if (id === 'merge-pdf') {
        setCurrentProgressMessage('Initializing virtual buffer...');
        const mergedPdf = await PDFDocument.create();
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          updateFileStatus(f.id, 'processing', ((i + 1) / files.length) * 100);
          const donor = await PDFDocument.load(await f.file.arrayBuffer());
          const donorPages = await mergedPdf.copyPages(donor, donor.getPageIndices());
          donorPages.forEach(p => mergedPdf.addPage(p));
        }
        const bytes = await mergedPdf.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        results.push({ 
          id: 'merged', 
          name: 'merged_document.pdf', 
          blob, 
          url: URL.createObjectURL(blob), 
          before: formatSize(files.reduce((a,b)=>a+b.originalSize,0)), 
          after: formatSize(blob.size),
          content: 'Merged successfully'
        });
        files.forEach(f => updateFileStatus(f.id, 'completed', 100));
      } 
      else if (id === 'jpg-to-pdf') {
        const merged = await PDFDocument.create();
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          updateFileStatus(f.id, 'processing', ((i + 1) / files.length) * 100);
          const imgBytes = await f.file.arrayBuffer();
          const img = f.file.type === 'image/png' ? await merged.embedPng(imgBytes) : await merged.embedJpg(imgBytes);
          const page = merged.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        }
        const bytes = await merged.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        results.push({ 
          id: 'combined', 
          name: 'combined_images.pdf', 
          blob, 
          url: URL.createObjectURL(blob), 
          before: formatSize(files.reduce((a,b)=>a+b.originalSize, 0)), 
          after: formatSize(blob.size),
          content: 'Combined successfully'
        });
        files.forEach(f => updateFileStatus(f.id, 'completed', 100));
      }
      else {
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          setCurrentProgressMessage(`Synthesizing Fragment ${i + 1} of ${files.length}: ${f.file.name}`);
          updateFileStatus(f.id, 'processing', 10);

          let res: Partial<ProcessingResult> = { id: f.id };
          const fileBuffer = await f.file.arrayBuffer();
          const base64 = btoa(new Uint8Array(fileBuffer).reduce((d, b) => d + String.fromCharCode(b), ''));
          
          if (id === 'pdf-to-word') {
            const text = await reconstructAsWord(base64, 'application/pdf');
            const docObj = new Document({ sections: [{ children: parseTextToDocxChildren(text) }] });
            const buffer = await Packer.toBuffer(docObj);
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            res = { name: `${f.file.name.replace('.pdf', '')}.docx`, blob, url: URL.createObjectURL(blob), isDocx: true, before: formatSize(f.originalSize), after: formatSize(buffer.length), content: text };
          } 
          else if (id === 'split-pdf') {
            const src = await PDFDocument.load(fileBuffer);
            if (splitMode === 'individual') {
              const extracted: { pageNum: number; blob: Blob; url: string }[] = [];
              for (const pageNum of selectedPages) {
                const newPdf = await PDFDocument.create();
                const [copied] = await newPdf.copyPages(src, [pageNum - 1]);
                newPdf.addPage(copied);
                const bytes = await newPdf.save();
                const blob = new Blob([bytes], { type: 'application/pdf' });
                extracted.push({ pageNum, blob, url: URL.createObjectURL(blob) });
              }
              setSplitResult({ id: 'split', name: f.file.name, pages: extracted, isMergedResult: false });
            } else {
              const newPdf = await PDFDocument.create();
              const indices = selectedPages.map(p => p - 1);
              const copiedPages = await newPdf.copyPages(src, indices);
              copiedPages.forEach(p => newPdf.addPage(p));
              const bytes = await newPdf.save();
              const blob = new Blob([bytes], { type: 'application/pdf' });
              setSplitResult({ 
                id: 'split', 
                name: f.file.name, 
                pages: [{ pageNum: 1, blob, url: URL.createObjectURL(blob) }],
                isMergedResult: true
              });
            }
            updateFileStatus(f.id, 'completed', 100);
            setIsProcessing(false);
            return;
          }
          else if (id === 'watermark-pdf') {
            const donor = await PDFDocument.load(fileBuffer);
            const pages = donor.getPages();
            const targets = selectedPages;
            
            const hexToRgb = (hex: string) => {
              const r = parseInt(hex.slice(1, 3), 16) / 255;
              const g = parseInt(hex.slice(3, 5), 16) / 255;
              const b = parseInt(hex.slice(5, 7), 16) / 255;
              return rgb(r, g, b);
            };

            let embeddedImg: any = null;
            if (watermarkType === 'image' && watermarkImage) {
              const base64Content = watermarkImage.split(',')[1];
              const binary = atob(base64Content);
              const bytesArray = new Uint8Array(binary.length);
              for (let j = 0; j < binary.length; j++) {
                bytesArray[j] = binary.charCodeAt(j);
              }
              embeddedImg = watermarkImage.includes('image/png') ? await donor.embedPng(bytesArray) : await donor.embedJpg(bytesArray);
            }

            const font = await donor.embedFont(StandardFonts.HelveticaBold);

            targets.forEach(pIdx => {
              if (pIdx <= pages.length) {
                const page = pages[pIdx - 1];
                const { width, height } = page.getSize();
                
                if (watermarkType === 'text') {
                  const textWidth = font.widthOfTextAtSize(watermarkText, watermarkSize);
                  page.drawText(watermarkText, {
                    x: width / 2 - textWidth / 2,
                    y: height / 2,
                    size: watermarkSize,
                    font,
                    color: hexToRgb(watermarkColor),
                    opacity: watermarkOpacity,
                    rotate: degrees(watermarkRotation),
                  });
                } else if (embeddedImg) {
                  const scale = watermarkSize / 100;
                  const imgWidth = embeddedImg.width * scale;
                  const imgHeight = embeddedImg.height * scale;
                  page.drawImage(embeddedImg, {
                    x: width / 2 - imgWidth / 2,
                    y: height / 2 - imgHeight / 2,
                    width: imgWidth,
                    height: imgHeight,
                    opacity: watermarkOpacity,
                    rotate: degrees(watermarkRotation),
                  });
                }
              }
            });

            const bytes = await donor.save();
            const blob = new Blob([bytes], { type: 'application/pdf' });
            res = { name: `${f.file.name.replace('.pdf', '')}_watermarked.pdf`, blob, url: URL.createObjectURL(blob), before: formatSize(f.originalSize), after: formatSize(blob.size), content: 'Watermark applied' };
          }
          else if (id === 'ai-summarize') {
            const text = await performOCR(base64, 'application/pdf');
            const summary = await summarizeDocument(text);
            const blob = new Blob([(summary || "") as string], { type: 'text/markdown' });
            res = { name: `${f.file.name.replace('.pdf', '')}_summary.md`, blob, url: URL.createObjectURL(blob), before: formatSize(f.originalSize), after: formatSize(blob.size), content: summary };
          }
          // ... (Rest of processing logic for other tools remains same)

          results.push({ id: f.id, ...res } as ProcessingResult);
          updateFileStatus(f.id, 'completed', 100);
        }
      }

      setBatchResult(results);
      setCurrentProgressMessage('All Fragments Synthesized.');
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Synthesis pipeline failed. Please check your inputs.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!splitResult) return;
    if (splitResult.isMergedResult) {
       const a = document.createElement('a'); a.href = splitResult.pages[0].url; a.download = `${splitResult.name.replace('.pdf','')}_extracted.pdf`; a.click();
       return;
    }
    const zip = new JSZip();
    splitResult.pages.forEach(p => zip.file(`${splitResult.name.replace('.pdf','')}-p${p.pageNum}.pdf`, p.blob));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${splitResult.name.replace('.pdf','')}_split.zip`; a.click();
    URL.revokeObjectURL(url);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (files.length === 1) clearSession();
  };

  if (!tool) return null;

  const canProcess = files.length > 0 && !isProcessing && (
    (id === 'protect-pdf' ? (password.length > 0 && password === confirmPassword) : true) &&
    (id === 'split-pdf' ? (selectedPages.length > 0) : true) &&
    (id === 'watermark-pdf' ? (watermarkType === 'text' ? watermarkText.length > 0 : !!watermarkImage) : true)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 animate-fade-in-up-soft">
      <div className="flex justify-between items-center mb-12">
        <Link to="/" className="inline-flex items-center gap-2 text-noir-text-muted dark:text-noir-text-darkMuted hover:text-at-teal font-bold text-[11px] uppercase tracking-widest transition-soft group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-soft" /> Workspace
        </Link>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-at-teal px-4 py-2 bg-at-teal/5 dark:bg-at-teal-dark/10 rounded-full border border-at-teal/10 dark:border-at-teal-dark/20">
          <ShieldCheck className="w-3.5 h-3.5" /> Volatile Session
        </div>
      </div>

      <div className="text-center mb-16">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`inline-flex p-6 rounded-[2rem] ${tool.color} text-white mb-8 shadow-xl dark:noir-glow-teal`}>
          {tool.icon}
        </motion.div>
        <h1 className="text-5xl font-black text-noir-text dark:text-noir-text-dark mb-4 tracking-tighter leading-none">{tool.name}</h1>
        <p className="text-xl text-noir-text-muted dark:text-noir-text-darkMuted max-w-2xl mx-auto font-medium">{tool.description}</p>
      </div>

      <div className={`bg-noir-surface dark:bg-noir-surface-dark rounded-[3.5rem] border-2 border-dashed transition-soft overflow-hidden ${isDragging ? 'border-at-teal bg-at-teal/5' : 'border-noir-text/10 dark:border-noir-surface-elevated shadow-sm'} ${files.length > 0 ? 'p-10' : 'p-24'}`}
           onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} 
           onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files); }}>
        
        {files.length === 0 ? (
          <div className="flex flex-col items-center">
            <label className="cursor-pointer group flex flex-col items-center">
              <div className="p-14 rounded-[3rem] mb-10 bg-noir-bg dark:bg-noir-surface-elevated group-hover:bg-at-teal/10 transition-soft">
                {id === 'split-pdf' ? <Scissors className="w-16 h-16 text-noir-text-muted/30 group-hover:text-at-teal transition-soft" /> : <Upload className="w-16 h-16 text-noir-text-muted/30 group-hover:text-at-teal transition-soft" />}
              </div>
              <span className="bg-at-teal dark:bg-at-teal-dark text-white dark:text-noir-bg-dark px-14 py-6 rounded-[1.5rem] font-black text-xl hover:shadow-2xl transition-soft active:scale-95 noir-glow-teal">
                Launch Node
              </span>
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
            {error && <div className="mt-8 flex items-center gap-2 text-red-500 font-bold text-xs bg-red-500/5 px-4 py-2 rounded-lg border border-red-500/20"><AlertTriangle className="w-4 h-4" /> {error}</div>}
            <p className="mt-10 text-noir-text-muted/30 font-black text-[10px] uppercase tracking-widest">Stateless Processing • No Data Logs</p>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-noir-bg dark:border-noir-surface-elevated pb-8 gap-4">
              <div>
                <h3 className="font-black text-noir-text dark:text-noir-text-dark text-3xl tracking-tight">Active Fragment</h3>
                <p className="text-sm font-bold text-noir-text-muted uppercase tracking-widest mt-1">
                  {files[0].file.name}
                </p>
              </div>
              <button onClick={clearSession} className="flex items-center gap-2 p-3 rounded-xl bg-at-amber/5 text-at-amber hover:bg-at-amber/10 transition-soft">
                <RefreshCw className="w-5 h-5" /> <span className="text-[10px] font-black uppercase tracking-widest">Wipe Memory</span>
              </button>
            </div>

            {id === 'split-pdf' && pdfDoc && (
              <div className="space-y-10">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div className="space-y-6 text-left bg-noir-bg dark:bg-noir-surface-elevated p-8 rounded-3xl border border-noir-text/5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-at-teal mb-4 flex items-center gap-2"><ListFilter className="w-4 h-4" /> Extraction Parameters</h4>
                    
                    <div className="flex gap-4 p-1 bg-white dark:bg-noir-bg rounded-2xl border border-noir-text/5 mb-8">
                       <button 
                        onClick={() => setSplitMode('individual')}
                        className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-soft ${splitMode === 'individual' ? 'bg-at-teal text-white shadow-lg' : 'text-noir-text-muted hover:bg-noir-bg'}`}
                       >
                         Individual Files
                       </button>
                       <button 
                        onClick={() => setSplitMode('merged')}
                        className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-soft ${splitMode === 'merged' ? 'bg-at-teal text-white shadow-lg' : 'text-noir-text-muted hover:bg-noir-bg'}`}
                       >
                         Merged Range
                       </button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                         <label className="text-[10px] font-black uppercase tracking-widest text-noir-text-muted">Selection Mode</label>
                         <div className="flex gap-2">
                            <button onClick={() => setSelectedPages(Array.from({length: numPages}, (_,i)=>i+1))} className="text-[9px] font-black text-at-teal uppercase tracking-widest hover:underline">Select All</button>
                            <span className="opacity-20">|</span>
                            <button onClick={() => setSelectedPages([])} className="text-[9px] font-black text-noir-text-muted uppercase tracking-widest hover:underline">Clear</button>
                         </div>
                      </div>
                      <div className="relative">
                        <ListChecks className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-at-teal" />
                        <input 
                          type="text" 
                          placeholder="e.g. 1-5, 8, 12-15" 
                          value={rangeInput}
                          onChange={(e) => handleRangeInput(e.target.value)}
                          className="w-full bg-white dark:bg-noir-bg py-4 pl-12 pr-6 rounded-xl border border-noir-text/5 focus:border-at-teal outline-none font-bold text-sm"
                        />
                      </div>
                      <div className="bg-at-teal/5 p-4 rounded-2xl border border-at-teal/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-at-teal mb-1">Impact Analysis</p>
                        <p className="text-xs font-medium text-noir-text-muted">
                          {selectedPages.length === 0 ? "No pages selected for extraction." : 
                           splitMode === 'individual' ? `${selectedPages.length} separate files will be generated.` : 
                           `1 file containing ${selectedPages.length} pages will be generated.`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-noir-text-muted text-left mb-4 flex items-center gap-2"><Eye className="w-4 h-4" /> Visual Navigator</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {Array.from({ length: numPages }, (_, i) => i + 1).map(pNum => (
                        <PageThumbnail 
                          key={pNum} 
                          pdfDoc={pdfDoc} 
                          pageNum={pNum} 
                          isSelected={selectedPages.includes(pNum)}
                          onToggle={() => togglePageSelection(pNum)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <AnimatePresence>
              {(splitResult || batchResult.length > 0) && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-10 bg-noir-text dark:bg-noir-surface-elevated rounded-[3rem] text-white space-y-10 shadow-2xl relative overflow-hidden noir-glow-teal">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
                    <div className="text-left">
                      <div className="inline-flex items-center gap-2 bg-at-teal/20 text-at-teal-dark px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-4"><Sparkles className="w-3.5 h-3.5" /> Synthesis Complete</div>
                      <h2 className="text-4xl font-black tracking-tighter mb-2">Workspace Materialized</h2>
                      <p className="opacity-60 font-medium text-sm">
                        Document successfully fragmented into {splitResult?.pages.length} components.
                      </p>
                    </div>
                    <button onClick={handleDownloadZip} className="px-10 py-5 bg-at-teal text-noir-bg-dark rounded-xl font-black uppercase tracking-widest text-xs hover:brightness-110 shadow-lg transition-all flex items-center gap-3">
                      {splitResult?.isMergedResult ? <FileDown className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
                      {splitResult?.isMergedResult ? 'Download Result' : 'Download ZIP Bundle'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!splitResult && batchResult.length === 0 && (
              <button disabled={!canProcess} onClick={runPipeline}
                className="w-full bg-at-teal dark:bg-at-teal-dark text-white dark:text-noir-bg-dark py-8 rounded-[2rem] font-black text-2xl hover:shadow-2xl transition-all duration-500 flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30 noir-glow-teal overflow-hidden relative group">
                {isProcessing ? (
                  <div className="flex items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span>SYNTHESIZING FLOW...</span>
                  </div>
                ) : (
                  <>
                    <Zap className="w-8 h-8 fill-current group-hover:scale-125 transition-soft" />
                    <span>PROCESS IN MEMORY</span>
                  </>
                )}
              </button>
            )}
            {error && <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center gap-3 text-sm font-bold uppercase tracking-widest">
              <AlertTriangle className="w-5 h-5" /> {error}
            </div>}
          </div>
        )}
      </div>
    </div>
  );
};
