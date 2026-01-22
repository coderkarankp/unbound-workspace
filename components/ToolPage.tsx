
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Upload, X, File as FileIcon, Loader2, ArrowLeft, Zap, RefreshCw, AlertTriangle, Sparkles, CheckCircle2, Archive, FileDown, Download, ExternalLink, Trash2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { TOOLS } from '../constants';
import { FileState } from '../types';
import { runToolProcessor } from '../services/toolProcessors';
import { WatermarkPanel, SplitPanel, SecurityPanel, AIConfigPanel, MetadataPanel, RotatePanel } from './toolSettings/SettingsPanels';

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
    if (!url) return;
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
        const res = batchResult[0];
        if (res.url) {
          downloadFile(res.url, res.name);
        } else {
          throw new Error("Generated file has no data URL.");
        }
      } else if (batchResult.length > 1) {
        const zip = new JSZip();
        batchResult.forEach(res => {
          if (res.blob) zip.file(res.name, res.blob);
        });
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        downloadFile(url, `unbound_workspace_export.zip`);
      }
    } catch (err) {
      console.error("Download handling error:", err);
      setError("The generated document couldn't be retrieved. Please try re-processing.");
    }
  };

  const startPipeline = async () => {
    setError(null);
    
    // Validation for Protect PDF
    if (id === 'protect-pdf') {
      if (config.password !== config.confirmPassword) {
        setError("Passwords do not match. Please ensure both password fields are identical.");
        return;
      }
    }

    setIsProcessing(true);
    try {
      // FIX: Cast results to any to allow checking for non-array return types like split-result
      const results: any = await runToolProcessor({
        id: id!, files, config, 
        updateStatus: (fid, stat, prog) => setFiles(prev => prev.map(f => f.id === fid ? {...f, status: stat as any, progress: prog} : f)),
        setCurrentMsg: setProgressMsg
      });

      if (results && !Array.isArray(results) && results.type === 'split-result') {
        setSplitResult(results);
      } else if (Array.isArray(results) && results.length > 0) {
        setBatchResult(results);
      } else {
        throw new Error("Tool processing returned empty or invalid results.");
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
    <div className="max-w-6xl mx-auto px-4 py-16 page-flow-in">
      <motion.button 
        whileHover={{ x: -4 }}
        onClick={() => navigate(-1)} 
        className="inline-flex items-center gap-2 text-theme-muted hover:text-theme-primary font-black text-[12px] uppercase tracking-[0.15em] mb-12"
      >
        <ArrowLeft className="w-5 h-5" /> Back
      </motion.button>
      
      <div className="text-center mb-16">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className={`inline-flex p-7 rounded-[2.5rem] ${tool.color} text-theme-text dark:text-theme-primary mb-10 shadow-2xl relative overflow-hidden group`}
        >
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
          {tool.icon}
        </motion.div>
        <h1 className="text-6xl font-black text-theme-text mb-6 tracking-tight">{tool.name}</h1>
        <p className="text-lg text-theme-muted max-w-2xl mx-auto font-medium">{tool.description}</p>
      </div>

      <div className="bg-theme-surface rounded-[4rem] border-4 border-dashed border-theme-primary/10 p-12 shadow-2xl transition-all duration-500 relative overflow-hidden">
        {files.length === 0 ? (
          <label className="cursor-pointer group flex flex-col items-center py-20 relative z-10">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="p-14 rounded-[3.5rem] mb-10 bg-theme-bg group-hover:bg-theme-primary/10 transition-all shadow-inner"
            >
              <Upload className="w-16 h-16 text-theme-muted/30 group-hover:text-theme-primary transition-colors" />
            </motion.div>
            <span className="bg-theme-primary text-theme-bg px-16 py-6 rounded-3xl font-black text-xl shadow-xl noir-glow-teal hover:scale-105 transition-transform active:scale-95">Upload Documents</span>
            <input type="file" multiple className="hidden" onChange={handleFileUpload} />
          </label>
        ) : (
          <div className="space-y-16">
            <div className="flex justify-between items-center border-b border-theme-border pb-8">
               <h3 className="font-black text-3xl tracking-tight">{files.length} {files.length === 1 ? 'File' : 'Files'} Selected</h3>
               <button onClick={clearSession} className="text-theme-accent font-black text-[12px] uppercase tracking-widest flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"><RefreshCw className="w-5 h-5" /> Reset Node</button>
            </div>

            <AnimatePresence mode="wait">
              {!hasResult ? (
                <motion.div 
                  key="setup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid lg:grid-cols-3 gap-12"
                >
                  <div className="lg:col-span-2 space-y-8">
                    {['split-pdf', 'organize-pdf'].includes(id!) && pdfDoc && <SplitPanel config={config} setConfig={setConfig} pdfDoc={pdfDoc} numPages={numPages} />}
                    {id === 'rotate-pdf' && pdfDoc && <RotatePanel config={config} setConfig={setConfig} pdfDoc={pdfDoc} numPages={numPages} />}
                    {id === 'watermark-pdf' && <WatermarkPanel config={config} setConfig={setConfig} />}
                    {id === 'protect-pdf' && <SecurityPanel config={config} setConfig={setConfig} />}
                    {id === 'metadata-editor' && <MetadataPanel config={config} setConfig={setConfig} />}
                    {['ai-summarize', 'pdf-translate'].includes(id!) && <AIConfigPanel config={config} setConfig={setConfig} id={id} />}
                    
                    {!['split-pdf', 'organize-pdf', 'watermark-pdf', 'protect-pdf', 'ai-summarize', 'pdf-translate', 'metadata-editor', 'rotate-pdf'].includes(id!) && (
                       <div className="p-10 bg-theme-bg rounded-[2.5rem] border border-theme-border text-left anime-text-entry">
                         <h4 className="font-black text-[12px] uppercase tracking-[0.2em] text-theme-primary mb-5 flex items-center gap-2">
                           <Sparkles className="w-4 h-4" /> Ready for Transmutation
                         </h4>
                         <p className="text-[16px] text-theme-muted font-semibold leading-relaxed">
                           Node is calibrated for conversion. Click initiate to begin the process. {id === 'merge-pdf' && "Drag to reorder the files in the queue."}
                         </p>
                       </div>
                    )}
                  </div>
                  
                  <div className="bg-theme-bg p-8 rounded-[2.5rem] h-fit border border-theme-border shadow-inner">
                    <h4 className="text-[12px] font-black uppercase text-theme-primary tracking-widest mb-8">Process Queue</h4>
                    <Reorder.Group 
                      axis="y" 
                      values={files} 
                      onReorder={setFiles} 
                      className="space-y-4"
                    >
                      {files.map((f) => (
                        <Reorder.Item 
                          key={f.id} 
                          value={f}
                          className="flex items-center gap-4 p-4 bg-theme-surface rounded-2xl border border-theme-border transition-none cursor-grab active:cursor-grabbing"
                          style={{ transition: 'none' }}
                          whileDrag={{ 
                            scale: 1.02, 
                            boxShadow: "0 20px 40px rgba(0,0,0,0.1)", 
                            zIndex: 50,
                          }}
                        >
                          <div className="pr-2 border-r border-theme-border text-theme-muted pointer-events-none">
                            <GripVertical className="w-5 h-5" />
                          </div>
                          <div className="bg-theme-primary/10 p-2 rounded-lg pointer-events-none">
                            <FileIcon className="w-5 h-5 text-theme-primary shrink-0" />
                          </div>
                          <div className="flex-1 min-w-0 pointer-events-none">
                            <p className="text-[13px] font-bold truncate text-theme-text">{f.file.name}</p>
                            <p className="text-[11px] text-theme-muted">{(f.file.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {f.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                            {f.status === 'processing' && <Loader2 className="w-5 h-5 text-theme-primary animate-spin" />}
                            {f.status !== 'processing' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFile(f.id);
                                }}
                                className="p-2 hover:bg-red-500/10 text-theme-muted hover:text-red-500 rounded-xl transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-10"
                >
                  <div className="p-12 bg-theme-text dark:bg-theme-elevated rounded-[3.5rem] text-theme-bg flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden group">
                     <div className="absolute inset-0 bg-theme-primary/5 pointer-events-none" />
                     <div className="text-left relative z-10">
                       <div className="flex items-center gap-3 mb-6">
                          <div className="bg-theme-primary/20 p-3 rounded-2xl"><Sparkles className="w-6 h-6 text-theme-primary" /></div>
                          <span className="text-theme-primary font-black text-[12px] uppercase tracking-[0.3em]">Sync Complete</span>
                       </div>
                       <h2 className="text-4xl font-black tracking-tight mb-4 text-theme-bg dark:text-theme-text">Transmission Ready</h2>
                       <p className="text-theme-bg/60 dark:text-theme-muted text-lg font-medium">Your processed data is ready for retrieval from the buffer.</p>
                     </div>
                     <motion.button 
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       onClick={handleDownload}
                       className="bg-theme-primary text-theme-bg px-14 py-6 rounded-2xl font-black uppercase tracking-widest text-[14px] shadow-2xl flex items-center gap-4 noir-glow-teal relative z-10"
                     >
                       <Download className="w-6 h-6" /> Download Result
                     </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!hasResult && (
              <motion.button 
                whileTap={{ scale: 0.98 }}
                disabled={isProcessing} 
                onClick={startPipeline} 
                className={`w-full py-10 rounded-[2.5rem] text-theme-bg font-black text-3xl shadow-2xl flex items-center justify-center gap-5 transition-all relative overflow-hidden ${isProcessing ? 'bg-theme-muted/20 cursor-wait' : 'bg-theme-primary hover:brightness-110 active:scale-[0.99] noir-glow-teal'}`}
              >
                {isProcessing ? (
                  <><Loader2 className="w-10 h-10 animate-spin text-theme-primary" /> <span className="animate-pulse tracking-widest text-2xl text-theme-text">{progressMsg}</span></>
                ) : (
                  <><Zap className="w-10 h-10" /> Initiate Conversion</>
                )}
                <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />
              </motion.button>
            )}

            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-red-500/10 border-2 border-red-500/20 rounded-[2.5rem] text-red-500 flex items-center gap-6">
                <AlertTriangle className="w-8 h-8 shrink-0" />
                <p className="font-bold text-lg">{error}</p>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
