
import React, { useRef, useEffect } from 'react';
import { 
  Type, ImageIcon, Layout, ListFilter, Eye, 
  ListChecks, Plus, CheckCircle2, Globe, RotateCw, Lock, Info, RotateCcw
} from 'lucide-react';

export const PageThumbnail: React.FC<{ 
  pdfDoc: any; 
  pageNum: number; 
  isSelected?: boolean;
  onToggle?: () => void;
  rotation?: number;
}> = ({ pdfDoc, pageNum, isSelected, onToggle, rotation = 0 }) => {
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
    <div onClick={onToggle} className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all group ${isSelected ? 'border-theme-primary ring-2 ring-theme-primary/20 bg-theme-primary/5' : 'border-transparent hover:border-theme-primary/20 bg-theme-bg/30'}`}>
       <div className="p-2 transition-transform duration-500 ease-in-out" style={{ transform: `rotate(${rotation}deg)` }}>
          <canvas ref={canvasRef} className="w-full h-auto shadow-sm rounded-sm" />
       </div>
       {isSelected && <div className="absolute top-2 right-2 bg-theme-primary text-theme-bg p-1 rounded-full z-10 shadow-lg"><CheckCircle2 className="w-3 h-3" /></div>}
       <div className="absolute bottom-0 left-0 right-0 bg-theme-bg/80 backdrop-blur-sm py-1 text-[9px] font-black text-center text-theme-text border-t border-theme-border/50">Page {pageNum}</div>
       {rotation !== 0 && (
         <div className="absolute top-2 left-2 bg-theme-accent text-theme-bg p-1 rounded-full text-[8px] font-black z-10 shadow-lg">
           {rotation}°
         </div>
       )}
    </div>
  );
};

export const RotatePanel = ({ config, setConfig, pdfDoc, numPages }: any) => {
  const pageRotations = config.pageRotations || {};

  const rotateSingle = (pNum: number) => {
    const current = pageRotations[pNum] || 0;
    const next = (current + 90) % 360;
    const newRotations = { ...pageRotations, [pNum]: next };
    setConfig({ ...config, pageRotations: newRotations });
  };

  const rotateAll = (angle: number) => {
    const newRotations: any = {};
    for (let i = 1; i <= numPages; i++) {
      newRotations[i] = angle;
    }
    setConfig({ ...config, pageRotations: newRotations, rotateAngle: angle });
  };

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-8 text-left">
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-theme-muted flex items-center gap-2">
            <RotateCw className="w-3 h-3" /> Batch Rotate All Pages
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[0, 90, 180, 270].map(angle => (
              <button
                key={angle}
                onClick={() => rotateAll(angle)}
                className={`py-4 rounded-2xl text-[10px] font-black uppercase transition-all flex flex-col items-center gap-2 border-2 ${
                  config.rotateAngle === angle 
                  ? 'bg-theme-primary text-theme-bg border-theme-primary shadow-lg noir-glow-teal' 
                  : 'bg-theme-surface text-theme-muted border-theme-border hover:border-theme-primary/20'
                }`}
              >
                <RotateCw className="w-4 h-4" style={{ transform: `rotate(${angle}deg)` }} />
                {angle}°
              </button>
            ))}
          </div>
        </div>
        <button 
          onClick={() => setConfig({ ...config, pageRotations: {} })}
          className="w-full py-4 bg-theme-bg border border-theme-border text-theme-muted rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-500/5 hover:text-red-500 transition-all flex items-center justify-center gap-3"
        >
          <RotateCcw className="w-4 h-4" /> Reset All Rotations
        </button>
      </div>
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase text-theme-muted flex items-center justify-between">
          <span>Page Visualizer</span>
        </label>
        <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar border-2 border-theme-border p-4 rounded-[2.5rem] bg-theme-bg/30 shadow-inner">
          {Array.from({ length: numPages }, (_, i) => i + 1).map(pNum => (
            <PageThumbnail 
              key={pNum} 
              pdfDoc={pdfDoc} 
              pageNum={pNum} 
              isSelected={true} 
              rotation={pageRotations[pNum] || 0}
              onToggle={() => rotateSingle(pNum)} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const MetadataPanel = ({ config, setConfig }: any) => (
  <div className="space-y-4 text-left">
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-theme-muted flex items-center gap-2"><Info className="w-3 h-3" /> Document Title</label>
      <input 
        type="text" 
        placeholder="Enter title" 
        value={config.metaTitle || ''} 
        onChange={e => setConfig({...config, metaTitle: e.target.value})} 
        className="w-full bg-theme-surface py-3 px-4 rounded-xl border border-theme-border outline-none font-black text-theme-text placeholder:text-theme-muted/50 focus:border-theme-primary" 
      />
    </div>
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-theme-muted">Author</label>
      <input 
        type="text" 
        placeholder="Enter author name" 
        value={config.metaAuthor || ''} 
        onChange={e => setConfig({...config, metaAuthor: e.target.value})} 
        className="w-full bg-theme-surface py-3 px-4 rounded-xl border border-theme-border outline-none font-black text-theme-text placeholder:text-theme-muted/50 focus:border-theme-primary" 
      />
    </div>
  </div>
);

export const SplitPanel = ({ config, setConfig, pdfDoc, numPages }: any) => (
  <div className="grid md:grid-cols-2 gap-10">
    <div className="space-y-6 text-left">
      <div className="flex gap-4 p-1 bg-theme-bg rounded-xl">
        <button onClick={() => setConfig({ ...config, splitMode: 'individual' })} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${config.splitMode === 'individual' ? 'bg-theme-primary text-theme-bg' : 'text-theme-muted'}`}>Extract Pages</button>
        <button onClick={() => setConfig({ ...config, splitMode: 'merged' })} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${config.splitMode === 'merged' ? 'bg-theme-primary text-theme-bg' : 'text-theme-muted'}`}>Merge Pages</button>
      </div>
      <div className="flex gap-2">
         <button onClick={() => setConfig({...config, selectedPages: Array.from({length: numPages}, (_,i)=>i+1)})} className="text-[9px] font-black uppercase px-3 py-1 bg-theme-primarySoft text-theme-primary rounded-md">Select All</button>
         <button onClick={() => setConfig({...config, selectedPages: []})} className="text-[9px] font-black uppercase px-3 py-1 bg-red-500/10 text-red-500 rounded-md">Clear</button>
      </div>
    </div>
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase text-theme-muted">Page Preview ({config.selectedPages.length} selected)</label>
      <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar border border-theme-border p-2 rounded-xl">
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
    <label className="text-[10px] font-black uppercase text-theme-muted flex items-center gap-2"><Lock className="w-3 h-3" /> Set Password</label>
    <input 
      type="password" 
      placeholder="New Password" 
      value={config.password} 
      onChange={e => setConfig({...config, password: e.target.value})} 
      className="w-full bg-theme-surface py-3 px-4 rounded-xl border border-theme-border outline-none font-black text-theme-text placeholder:text-theme-muted/50 focus:border-theme-primary" 
    />
    <input 
      type="password" 
      placeholder="Confirm Password" 
      value={config.confirmPassword} 
      onChange={e => setConfig({...config, confirmPassword: e.target.value})} 
      className="w-full bg-theme-surface py-3 px-4 rounded-xl border border-theme-border outline-none font-black text-theme-text placeholder:text-theme-muted/50 focus:border-theme-primary" 
    />
    <p className="text-[10px] text-theme-accent font-bold italic">AES-256 encryption applied locally.</p>
  </div>
);
