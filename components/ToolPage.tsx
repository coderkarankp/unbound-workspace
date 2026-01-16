
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Upload, X, File as FileIcon, Loader2, ArrowLeft, Zap, RefreshCw, AlertTriangle, Sparkles, CheckCircle2, Archive, FileDown, Download, ExternalLink, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { TOOLS } from '../constants';
import { FileState } from '../types';
import { runToolProcessor } from '../services/toolProcessors';
import { WatermarkPanel, SplitPanel, SecurityPanel, AIConfigPanel, MetadataPanel } from './toolSettings/SettingsPanels';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;

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
    const newFiles = uploaded.map(f => ({ id: Math.random().toString(36).substr(2,9), file: f, status: 'idle', progress: 0, originalSize: f.size } as FileState));
    setFiles(id === 'merge-pdf' || id === 'jpg-to-pdf' ? [...files, ...newFiles] : newFiles);

    if (newFiles[0]?.file.type === 'application/pdf') {
      try {
        const doc = await pdfjsLib.getDocument(await newFiles[0].file.arrayBuffer()).promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setConfig((prev: any) => ({ ...prev, selectedPages: Array.from({length: doc.numPages}, (_,i)=>i+1)}));
      } catch (err) {
        console.error("PDF load error:", err);
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
    if (splitResult) {
      const zip = new JSZip();
      const folder = zip.folder("extracted_pages");
      splitResult.pages.forEach((p: any) => {
        folder?.file(`page_${p.pageNum}.pdf`, p.blob);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      downloadFile(url, `${splitResult.name.split('.')[0]}_extracted.zip`);
      return;
    }

    if (batchResult.length === 1) {
      downloadFile(batchResult[0].url, batchResult[0].name);
    } else if (batchResult.length > 1) {
      const zip = new JSZip();
      batchResult.forEach(res => {
        zip.file(res.name, res.blob);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      downloadFile(url, `unbound_workspace_export.zip`);
    }
  };

  const startPipeline = async () => {
    setIsProcessing(true); setError(null);
    try {
      const results = await runToolProcessor({
        id: id!, files, config, 
        updateStatus: (fid, stat, prog) => setFiles(prev => prev.map(f => f.id === fid ? {...f, status: stat as any, progress: prog} : f)),
        setCurrentMsg: setProgressMsg
      });

      if (results && !Array.isArray(results) && results.type === 'split-result') {
        setSplitResult(results);
      } else if (Array.isArray(results)) {
        setBatchResult(results);
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!tool) return null;

  const hasResult = batchResult.length > 0 || splitResult;

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 animate-fade-in-up-soft">
      <button 
        onClick={() => navigate(-1)} 
        className="inline-flex items-center gap-2 text-noir-text-muted hover:text-at-teal font-bold text-[11px] uppercase tracking-widest mb-12"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="text-center mb-16">
        <div className={`inline-flex p-6 rounded-[2rem] ${tool.color} text-white mb-8 shadow-xl`}>{tool.icon}</div>
        <h1 className="text-5xl font-black text-noir-text dark:text-noir-text-dark mb-4 tracking-tighter">{tool.name}</h1>
        <p className="text-lg text-noir-text-muted dark:text-noir-text-darkMuted max-w-2xl mx-auto">{tool.description}</p>
      </div>

      <div className="bg-noir-surface dark:bg-noir-surface-dark rounded-[3.5rem] border-2 border-dashed border-noir-text/10 p-10 shadow-sm transition-all duration-500">
        {files.length === 0 ? (
          <label className="cursor-pointer group flex flex-col items-center py-20">
            <div className="p-12 rounded-[2.5rem] mb-8 bg-noir-bg dark:bg-noir-surface-elevated group-hover:bg-at-teal/10 transition-all"><Upload className="w-12 h-12 text-noir-text-muted/30 group-hover:text-at-teal" /></div>
            <span className="bg-at-teal text-white px-12 py-5 rounded-2xl font-black text-lg shadow-lg">Upload Files</span>
            <input type="file" multiple className="hidden" onChange={handleFileUpload} />
          </label>
        ) : (
          <div className="space-y-12">
            <div className="flex justify-between items-center border-b border-noir-bg dark:border-noir-surface-elevated pb-6">
               <h3 className="font-black text-2xl tracking-tight">{files.length} {files.length === 1 ? 'File' : 'Files'} Uploaded</h3>
               <button onClick={clearSession} className="text-at-amber font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:opacity-80 transition-soft"><RefreshCw className="w-4 h-4" /> Clear All</button>
            </div>

            <AnimatePresence mode="wait">
              {!hasResult ? (
                <motion.div 
                  key="setup"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid lg:grid-cols-3 gap-10"
                >
                  <div className="lg:col-span-2 space-y-6">
                    {['split-pdf', 'organize-pdf'].includes(id!) && pdfDoc && <SplitPanel config={config} setConfig={setConfig} pdfDoc={pdfDoc} numPages={numPages} />}
                    {id === 'watermark-pdf' && <WatermarkPanel config={config} setConfig={setConfig} />}
                    {id === 'protect-pdf' && <SecurityPanel config={config} setConfig={setConfig} />}
                    {id === 'metadata-editor' && <MetadataPanel config={config} setConfig={setConfig} />}
                    {['ai-summarize', 'pdf-translate'].includes(id!) && <AIConfigPanel config={config} setConfig={setConfig} id={id} />}
                    
                    {/* Default info for tools without complex settings */}
                    {!['split-pdf', 'organize-pdf', 'watermark-pdf', 'protect-pdf', 'ai-summarize', 'pdf-translate', 'metadata-editor'].includes(id!) && (
                       <div className="p-8 bg-noir-bg dark:bg-noir-surface-elevated rounded-3xl border border-noir-text/5 text-left">
                         <h4 className="font-black text-[10px] uppercase tracking-widest text-at-teal mb-4">Ready for Conversion</h4>
                         <p className="text-sm text-noir-text-muted dark:text-noir-text-darkMuted font-medium">Click the convert button below to start the high-speed processing node.</p>
                       </div>
                    )}
                  </div>
                  
                  <div className="bg-noir-bg dark:bg-noir-surface-elevated p-6 rounded-3xl h-fit border border-noir-text/5">
                    <h4 className="text-[10px] font-black uppercase text-at-teal tracking-widest mb-6">Files in Queue</h4>
                    <div className="space-y-3">
                      {files.map(f => (
                        <div key={f.id} className="flex items-center gap-3 p-3 bg-white dark:bg-noir-bg-dark rounded-xl border border-noir-text/5">
                          <FileIcon className="w-4 h-4 text-at-teal shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold truncate text-black dark:text-white">{f.file.name}</p>
                            <p className="text-[9px] text-noir-text-muted">{(f.file.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {f.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            {f.status === 'processing' && <Loader2 className="w-4 h-4 text-at-teal animate-spin" />}
                            {f.status !== 'processing' && (
                              <button 
                                onClick={() => removeFile(f.id)}
                                className="p-1.5 hover:bg-red-500/10 text-noir-text-muted hover:text-red-500 rounded-lg transition-colors"
                                title="Remove file"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                >
                  <div className="p-10 bg-noir-text dark:bg-noir-surface-elevated rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                     <div className="text-left">
                       <div className="flex items-center gap-3 mb-4">
                          <div className="bg-at-teal/20 p-2 rounded-lg"><Sparkles className="w-5 h-5 text-at-teal" /></div>
                          <span className="text-at-teal font-black text-[10px] uppercase tracking-[0.2em]">Processing Successful</span>
                       </div>
                       <h2 className="text-3xl font-black tracking-tighter mb-2">Files are Ready</h2>
                       <p className="text-white/60 text-sm">Your documents have been processed and are waiting for retrieval.</p>
                     </div>
                     <button 
                       onClick={handleDownload}
                       className="bg-at-teal text-noir-bg-dark px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all noir-glow-teal"
                     >
                       <Download className="w-5 h-5" /> Download Result
                     </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!hasResult && (
              <button 
                disabled={isProcessing} 
                onClick={startPipeline} 
                className={`w-full py-8 rounded-[2rem] text-white font-black text-2xl shadow-xl flex items-center justify-center gap-4 transition-all ${isProcessing ? 'bg-noir-text dark:bg-noir-surface-elevated cursor-wait' : 'bg-at-teal hover:brightness-105 active:scale-[0.99] noir-glow-teal'}`}
              >
                {isProcessing ? (
                  <><Loader2 className="w-8 h-8 animate-spin" /> <span className="animate-pulse">{progressMsg}</span></>
                ) : (
                  <><Zap className="w-8 h-8" /> Convert</>
                )}
              </button>
            )}

            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-500 flex items-center gap-4">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <p className="font-bold text-sm">{error}</p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
