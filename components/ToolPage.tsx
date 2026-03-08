import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, File as FileIcon, Loader2, ArrowLeft, Zap, RefreshCw, AlertTriangle, Sparkles, CheckCircle2, Download, Trash2, GripVertical } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { TOOLS } from '../constants';
import { FileState } from '../types';
import { runToolProcessor } from '../services/toolProcessors';
import { SplitPanel, MetadataPanel, RotatePanel } from './toolSettings/SettingsPanels';

// Stable worker URL for PDF.js 4.x
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs`;

export const ToolPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tool = TOOLS.find(t => t.id === id);
  
  const [files, setFiles] = useState<FileState[]>([]);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [batchResult, setBatchResult] = useState<any[]>([]);
  const [splitResult, setSplitResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState<any>({
    selectedPages: [],
    splitMode: 'individual',
    password: '',
    confirmPassword: '',
    rotateAngle: 90,
    targetLang: 'English',
    watermarkType: 'text',
    watermarkText: 'CONFIDENTIAL',
    watermarkImage: null,
    watermarkOpacity: 0.4,
    watermarkRotation: -45,
    watermarkSize: 60,
    watermarkColor: '#ff0000',
    metaTitle: '',
    metaAuthor: '',
    metaKeywords: ''
  });

  const clearSession = () => {
    setFiles([]); setPdfDoc(null); setBatchResult([]); setSplitResult(null); setError(null);
  };

  const removeFile = (fid: string) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== fid);
      if (filtered.length === 0) clearSession();
      return filtered;
    });
  };

  const handleFileUpload = async (e: any) => {
    const uploaded = Array.from(e.target?.files || e) as File[];
    const newFiles = uploaded.map(f => ({ 
      id: Math.random().toString(36).substr(2,9), 
      file: f, 
      status: 'idle', 
      progress: 0, 
      originalSize: f.size 
    } as FileState));
    
    setFiles(id === 'merge-pdf' || id === 'jpg-to-pdf' ? [...files, ...newFiles] : newFiles);

    if (newFiles[0]?.file.type === 'application/pdf') {
      try {
        const doc = await pdfjsLib.getDocument({ data: await newFiles[0].file.arrayBuffer() }).promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setConfig((prev: any) => ({ ...prev, selectedPages: Array.from({length: doc.numPages}, (_,i)=>i+1)}));
      } catch (err) {
        console.error("PDF load error:", err);
        setError("Failed to preview PDF. The file might be corrupted or protected.");
      }
    }
  };

  const downloadFile = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownload = async () => {
    try {
      if (splitResult) {
        const zip = new JSZip();
        splitResult.pages.forEach((p: any) => zip.file(`page_${p.pageNum}.pdf`, p.blob));
        const content = await zip.generateAsync({ type: 'blob' });
        downloadFile(URL.createObjectURL(content), `${splitResult.name.split('.')[0]}_split.zip`);
      } else if (batchResult.length === 1) {
        downloadFile(batchResult[0].url, batchResult[0].name);
      } else if (batchResult.length > 1) {
        const zip = new JSZip();
        batchResult.forEach(res => zip.file(res.name, res.blob));
        const content = await zip.generateAsync({ type: 'blob' });
        downloadFile(URL.createObjectURL(content), `unbound_results.zip`);
      }
    } catch (err) {
      setError("Download failed. Your browser may have blocked the file generation.");
    }
  };

  const startPipeline = async () => {
    setIsProcessing(true);
    setError(null);
    setProgressMsg("Calibrating engine...");
    
    try {
      const results: any = await runToolProcessor({
        id: id!, files, config, 
        updateStatus: (fid, stat, prog) => setFiles(prev => prev.map(f => f.id === fid ? {...f, status: stat as any, progress: prog} : f)),
        setCurrentMsg: setProgressMsg
      });
      
      if (results?.type === 'split-result') {
        setSplitResult(results);
      } else if (Array.isArray(results) && results.length > 0) {
        setBatchResult(results);
      } else {
        throw new Error("Conversion engine returned no data.");
      }
    } catch (e: any) {
      setError(e.message || "A browser error occurred during client-side processing.");
    } finally {
      setIsProcessing(false);
      setProgressMsg("");
    }
  };

  if (!tool) return null;

  const hasResult = batchResult.length > 0 || splitResult;

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 page-flow-in">
      <motion.button whileHover={{ x: -4 }} onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-theme-muted hover:text-theme-primary font-black text-[12px] uppercase tracking-widest mb-12">
        <ArrowLeft className="w-5 h-5" /> Back
      </motion.button>
      
      <div className="text-center mb-16">
        <div className={`inline-flex p-7 rounded-[2.5rem] ${tool.color} text-theme-text dark:text-theme-primary mb-10 shadow-2xl`}>{tool.icon}</div>
        <h1 className="text-6xl font-black text-theme-text mb-6 tracking-tight">{tool.name}</h1>
        <p className="text-lg text-theme-muted max-w-2xl mx-auto font-medium">{tool.description}</p>
      </div>

      <div className="bg-theme-surface rounded-[4rem] border-4 border-dashed border-theme-primary/10 p-12 shadow-2xl relative overflow-hidden">
        {files.length === 0 ? (
          <label className="cursor-pointer group flex flex-col items-center py-20">
            <div className="p-14 rounded-[3.5rem] mb-10 bg-theme-bg group-hover:bg-theme-primary/10 transition-all shadow-inner">
              <Upload className="w-16 h-16 text-theme-muted/30 group-hover:text-theme-primary" />
            </div>
            <span className="bg-theme-primary text-theme-bg px-16 py-6 rounded-3xl font-black text-xl shadow-xl noir-glow-teal">Upload Documents</span>
            <input type="file" multiple className="hidden" onChange={handleFileUpload} />
          </label>
        ) : (
          <div className="space-y-16">
            <div className="flex justify-between items-center border-b border-theme-border pb-8">
               <h3 className="font-black text-3xl tracking-tight">{files.length} Selected</h3>
               <button onClick={clearSession} className="text-theme-accent font-black text-[12px] uppercase tracking-widest flex items-center gap-2 transition-all"><RefreshCw className="w-5 h-5" /> Reset Node</button>
            </div>

            <AnimatePresence mode="wait">
              {!hasResult ? (
                <motion.div key="setup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 space-y-8">
                    {['split-pdf', 'organize-pdf'].includes(id!) && pdfDoc && <SplitPanel config={config} setConfig={setConfig} pdfDoc={pdfDoc} numPages={numPages} />}
                    {id === 'rotate-pdf' && pdfDoc && <RotatePanel config={config} setConfig={setConfig} pdfDoc={pdfDoc} numPages={numPages} />}
                    {id === 'metadata-editor' && <MetadataPanel config={config} setConfig={setConfig} />}
                    
                    {!['split-pdf', 'organize-pdf', 'metadata-editor', 'rotate-pdf'].includes(id!) && (
                       <div className="p-10 bg-theme-bg rounded-[2.5rem] border border-theme-border text-left">
                         <h4 className="font-black text-[12px] uppercase tracking-widest text-theme-primary mb-5 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Local Engine Calibrated</h4>
                         <p className="text-[16px] text-theme-muted font-semibold leading-relaxed">Processing will happen entirely within your browser for maximum privacy.</p>
                       </div>
                    )}
                  </div>
                  <div className="bg-theme-bg p-8 rounded-[2.5rem] border border-theme-border shadow-inner">
                    <Reorder.Group axis="y" values={files} onReorder={setFiles} className="space-y-4">
                      {files.map((f) => (
                        <Reorder.Item key={f.id} value={f} className="flex items-center gap-4 p-4 bg-theme-surface rounded-2xl border border-theme-border cursor-grab">
                          <GripVertical className="w-5 h-5 text-theme-muted" />
                          <div className="flex-1 min-w-0 pointer-events-none">
                            <p className="text-[13px] font-bold truncate text-theme-text">{f.file.name}</p>
                            <p className="text-[11px] text-theme-muted">{(f.file.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {f.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                            {f.status === 'processing' && <Loader2 className="w-5 h-5 text-theme-primary animate-spin" />}
                            {f.status !== 'processing' && <button onClick={() => removeFile(f.id)} className="p-2 text-theme-muted hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
                          </div>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="results" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-12 bg-theme-text dark:bg-theme-elevated rounded-[3.5rem] text-theme-bg flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl">
                   <div className="text-left">
                     <div className="flex items-center gap-3 mb-6"><div className="bg-theme-primary/20 p-3 rounded-2xl"><Sparkles className="w-6 h-6 text-theme-primary" /></div><span className="text-theme-primary font-black text-[12px] uppercase tracking-widest">Process Complete</span></div>
                     <h2 className="text-4xl font-black tracking-tight mb-4 text-theme-bg dark:text-theme-text">Document Ready</h2>
                     <p className="text-theme-bg/60 dark:text-theme-muted text-lg font-medium">Locally processed and ready for download.</p>
                   </div>
                   <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleDownload} className="bg-theme-primary text-theme-bg px-14 py-6 rounded-2xl font-black uppercase tracking-widest text-[14px] shadow-2xl flex items-center gap-4 noir-glow-teal"><Download className="w-6 h-6" /> Download Result</motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {!hasResult && (
              <motion.button disabled={isProcessing} onClick={startPipeline} className={`w-full py-10 rounded-[2.5rem] text-theme-bg font-black text-3xl shadow-2xl flex items-center justify-center gap-5 ${isProcessing ? 'bg-theme-muted/20 cursor-wait' : 'bg-theme-primary hover:brightness-110 noir-glow-teal'}`}>
                {isProcessing ? <><Loader2 className="w-10 h-10 animate-spin" /> <span className="animate-pulse">{progressMsg || 'Processing...'}</span></> : <><Zap className="w-10 h-10" /> Initiate Process</>}
              </motion.button>
            )}

            {error && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-red-500/10 border-2 border-red-500/20 rounded-[2.5rem] text-red-500 flex items-center gap-6"><AlertTriangle className="w-8 h-8 shrink-0" /><p className="font-bold text-lg">{error}</p></motion.div>}
          </div>
        )}
      </div>
    </div>
  );
};