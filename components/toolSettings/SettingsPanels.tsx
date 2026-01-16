
import React, { useRef, useEffect } from 'react';
import { 
  Type, ImageIcon, Layout, ListFilter, Eye, 
  ListChecks, Plus, CheckCircle2, Globe, RotateCw, Lock 
} from 'lucide-react';

// Shared Thumbnail Component
export const PageThumbnail: React.FC<{ 
  pdfDoc: any; 
  pageNum: number; 
  isSelected?: boolean;
  onToggle?: () => void;
}> = ({ pdfDoc, pageNum, isSelected, onToggle }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let isMounted = true;
    const render = async () => {
      const page = await pdfDoc.getPage(pageNum);
      const vp = page.getViewport({ scale: 0.25 });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.height = vp.height; canvas.width = vp.width;
      if (isMounted) await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
    };
    render();
    return () => { isMounted = false; };
  }, [pdfDoc, pageNum]);

  return (
    <div onClick={onToggle} className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-at-teal ring-2 ring-at-teal/20' : 'border-transparent hover:border-at-teal/20'}`}>
       <canvas ref={canvasRef} className="w-full h-auto" />
       {isSelected && <div className="absolute top-2 right-2 bg-at-teal text-white p-1 rounded-full"><CheckCircle2 className="w-3 h-3" /></div>}
       <div className="bg-black/5 dark:bg-white/5 py-1 text-[9px] font-black text-center">Page {pageNum}</div>
    </div>
  );
};

export const WatermarkPanel = ({ config, setConfig }: any) => (
  <div className="space-y-6 text-left">
    <div className="flex gap-4 p-1 bg-white/50 dark:bg-noir-bg-dark/50 rounded-xl">
      <button onClick={() => setConfig({ ...config, watermarkType: 'text' })} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${config.watermarkType === 'text' ? 'bg-at-teal text-white' : 'text-noir-text-muted'}`}><Type className="w-3 h-3" /> Text</button>
      <button onClick={() => setConfig({ ...config, watermarkType: 'image' })} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${config.watermarkType === 'image' ? 'bg-at-teal text-white' : 'text-noir-text-muted'}`}><ImageIcon className="w-3 h-3" /> Image</button>
    </div>
    {config.watermarkType === 'text' ? (
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-noir-text-muted">Watermark Text</label>
        <input type="text" value={config.watermarkText} onChange={e => setConfig({...config, watermarkText: e.target.value})} className="w-full bg-white dark:bg-noir-bg py-3 px-4 rounded-xl border border-noir-text/5 focus:border-at-teal outline-none font-bold" />
      </div>
    ) : (
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-noir-text-muted">Select Image</label>
        <input type="file" accept="image/*" onChange={e => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = ev => setConfig({...config, watermarkImage: ev.target?.result});
            reader.readAsDataURL(file);
          }
        }} className="text-xs w-full" />
      </div>
    )}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-[10px] font-black uppercase text-noir-text-muted">Transparency</label>
        <input type="range" min="0" max="1" step="0.1" value={config.watermarkOpacity} onChange={e => setConfig({...config, watermarkOpacity: parseFloat(e.target.value)})} className="w-full accent-at-teal" />
      </div>
      <div>
        <label className="text-[10px] font-black uppercase text-noir-text-muted">Size</label>
        <input type="range" min="10" max="200" value={config.watermarkSize} onChange={e => setConfig({...config, watermarkSize: parseInt(e.target.value)})} className="w-full accent-at-teal" />
      </div>
    </div>
  </div>
);

export const SplitPanel = ({ config, setConfig, pdfDoc, numPages }: any) => (
  <div className="grid md:grid-cols-2 gap-10">
    <div className="space-y-6 text-left">
      <div className="flex gap-4 p-1 bg-white/50 dark:bg-noir-bg-dark/50 rounded-xl">
        <button onClick={() => setConfig({ ...config, splitMode: 'individual' })} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${config.splitMode === 'individual' ? 'bg-at-teal text-white' : 'text-noir-text-muted'}`}>Extract Pages</button>
        <button onClick={() => setConfig({ ...config, splitMode: 'merged' })} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${config.splitMode === 'merged' ? 'bg-at-teal text-white' : 'text-noir-text-muted'}`}>Merge Pages</button>
      </div>
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase text-noir-text-muted">Enter Page Numbers</label>
        <input type="text" placeholder="e.g. 1-5, 10" className="w-full bg-white dark:bg-noir-bg py-3 px-4 rounded-xl border border-noir-text/5 outline-none font-bold" />
        <p className="text-[10px] text-noir-text-muted italic">You can also click on the pages in the preview.</p>
      </div>
    </div>
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase text-noir-text-muted">Page Preview</label>
      <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar border border-noir-text/5 p-2 rounded-xl">
        {Array.from({ length: numPages }, (_, i) => i + 1).map(pNum => (
          <PageThumbnail key={pNum} pdfDoc={pdfDoc} pageNum={pNum} isSelected={config.selectedPages.includes(pNum)} onToggle={() => {
            const next = config.selectedPages.includes(pNum) ? config.selectedPages.filter((p: number) => p !== pNum) : [...config.selectedPages, pNum].sort((a,b)=>a-b);
            setConfig({...config, selectedPages: next});
          }} />
        ))}
      </div>
    </div>
  </div>
);

export const SecurityPanel = ({ config, setConfig }: any) => (
  <div className="space-y-4 text-left">
    <label className="text-[10px] font-black uppercase text-noir-text-muted flex items-center gap-2"><Lock className="w-3 h-3" /> Set Password</label>
    <input type="password" placeholder="New Password" value={config.password} onChange={e => setConfig({...config, password: e.target.value})} className="w-full bg-white dark:bg-noir-bg py-3 px-4 rounded-xl border border-noir-text/5 outline-none font-bold" />
    <input type="password" placeholder="Confirm Password" value={config.confirmPassword} onChange={e => setConfig({...config, confirmPassword: e.target.value})} className="w-full bg-white dark:bg-noir-bg py-3 px-4 rounded-xl border border-noir-text/5 outline-none font-bold" />
  </div>
);

export const AIConfigPanel = ({ config, setConfig, id }: any) => (
  <div className="text-left space-y-4">
     {id === 'pdf-translate' && (
       <>
         <label className="text-[10px] font-black uppercase text-noir-text-muted flex items-center gap-2"><Globe className="w-3 h-3" /> Select Language</label>
         <select value={config.targetLang} onChange={e => setConfig({...config, targetLang: e.target.value})} className="w-full bg-white dark:bg-noir-bg py-3 px-4 rounded-xl border border-noir-text/5 font-bold">
           {['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Hindi'].map(l => <option key={l} value={l}>{l}</option>)}
         </select>
       </>
     )}
     <div className="bg-noir-bg dark:bg-noir-surface-elevated p-4 rounded-xl border border-noir-text/5">
        <p className="text-[11px] font-medium text-noir-text-muted">Your document is being processed privately by AI. No data is stored or used for training.</p>
     </div>
  </div>
);
