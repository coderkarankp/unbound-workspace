import { PDFDocument, degrees, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

export interface ProcessorParams {
  id: string;
  files: any[];
  config: any;
  updateStatus: (id: string, status: string, progress: number) => void;
  setCurrentMsg: (msg: string) => void;
}

const dataURLToUint8Array = (dataURL: string): Uint8Array => {
  const parts = dataURL.split(',');
  const base64 = parts.length > 1 ? parts[1] : parts[0];
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const hexToRgb = (hex: string) => {
  if (!hex || hex.length < 7) return rgb(0,0,0);
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
};

export const runToolProcessor = async (params: ProcessorParams) => {
  const { id, files, config, updateStatus, setCurrentMsg } = params;
  const results: any[] = [];

  if (!files || files.length === 0) throw new Error("No files provided for processing.");

  // Tool: Merge PDF
  if (id === 'merge-pdf') {
    setCurrentMsg("Merging files...");
    const mergedPdf = await PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      updateStatus(f.id, 'processing', ((i + 1) / files.length) * 100);
      const donor = await PDFDocument.load(await f.file.arrayBuffer());
      const donorPages = await mergedPdf.copyPages(donor, donor.getPageIndices());
      donorPages.forEach(p => mergedPdf.addPage(p));
    }
    const bytes = await mergedPdf.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    return [{ id: 'merged', name: 'merged.pdf', blob, url: URL.createObjectURL(blob) }];
  }

  // Tool: Image to PDF
  if (id === 'jpg-to-pdf') {
    setCurrentMsg("Creating PDF...");
    const merged = await PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      updateStatus(f.id, 'processing', ((i + 1) / files.length) * 100);
      const imgBytes = await f.file.arrayBuffer();
      const img = f.file.type === 'image/png' ? await merged.embedPng(imgBytes) : await merged.embedJpg(imgBytes);
      const page = merged.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }
    const bytes = await merged.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    return [{ id: 'combined', name: 'combined.pdf', blob, url: URL.createObjectURL(blob) }];
  }

  // Tool: Split / Organize
  if (id === 'split-pdf' || id === 'organize-pdf') {
    const f = files[0];
    const srcPdf = await PDFDocument.load(await f.file.arrayBuffer());
    const selectedIndices = (config.selectedPages && config.selectedPages.length > 0)
      ? config.selectedPages.map((p: number) => p - 1)
      : Array.from({ length: srcPdf.getPageCount() }, (_, i) => i);

    if (config.splitMode === 'individual') {
      const pages = [];
      for (let i = 0; i < selectedIndices.length; i++) {
        const idx = selectedIndices[i];
        if (idx < 0 || idx >= srcPdf.getPageCount()) continue;
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(srcPdf, [idx]);
        newPdf.addPage(copiedPage);
        const bytes = await newPdf.save();
        pages.push({ pageNum: idx + 1, blob: new Blob([bytes], { type: 'application/pdf' }) });
        updateStatus(f.id, 'processing', Math.round(((i + 1) / selectedIndices.length) * 100));
      }
      updateStatus(f.id, 'completed', 100);
      return { type: 'split-result', name: f.file.name, pages };
    } else {
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(srcPdf, selectedIndices);
      copiedPages.forEach(p => newPdf.addPage(p));
      const bytes = await newPdf.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      updateStatus(f.id, 'completed', 100);
      return [{ id: f.id, name: f.file.name.replace('.pdf', '_processed.pdf'), blob, url: URL.createObjectURL(blob) }];
    }
  }

  // Generic Batch Processor
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    updateStatus(f.id, 'processing', 10);
    const originalBuffer = await f.file.arrayBuffer();
    let res: any = { id: f.id, name: f.file.name };

    try {
      switch (id) {
        case 'compress-pdf': {
          setCurrentMsg("Optimizing file size...");
          const compressSrc = await pdfjsLib.getDocument({ data: originalBuffer }).promise;
          const compressedPdf = await PDFDocument.create();
          for (let pNum = 1; pNum <= compressSrc.numPages; pNum++) {
            const page = await compressSrc.getPage(pNum);
            const viewport = page.getViewport({ scale: 0.8 });
            const canvas = document.createElement('canvas');
            canvas.height = viewport.height; canvas.width = viewport.width;
            const context = canvas.getContext('2d')!;
            await page.render({ canvasContext: context, viewport }).promise;
            const imgBytes = dataURLToUint8Array(canvas.toDataURL('image/jpeg', 0.4));
            const embeddedImg = await compressedPdf.embedJpg(imgBytes);
            const newPage = compressedPdf.addPage([embeddedImg.width, embeddedImg.height]);
            newPage.drawImage(embeddedImg, { x: 0, y: 0, width: embeddedImg.width, height: embeddedImg.height });
            updateStatus(f.id, 'processing', 10 + Math.round((pNum / compressSrc.numPages) * 80));
          }
          const finalBytes = await compressedPdf.save();
          res.blob = new Blob([finalBytes], { type: 'application/pdf' });
          res.name = f.file.name.replace('.pdf', '_compressed.pdf');
          break;
        }

        case 'pdf-to-jpg': {
          setCurrentMsg("Rendering pages...");
          const zip = new JSZip();
          const doc = await pdfjsLib.getDocument({ data: originalBuffer }).promise;
          for (let pNum = 1; pNum <= doc.numPages; pNum++) {
            const page = await doc.getPage(pNum);
            const vp = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            canvas.height = vp.height; canvas.width = vp.width;
            await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise;
            const blob = await new Promise<Blob>(r => canvas.toBlob(b => r(b!), 'image/jpeg', 0.9));
            zip.file(`page_${pNum}.jpg`, blob);
            updateStatus(f.id, 'processing', 10 + Math.round((pNum / doc.numPages) * 80));
          }
          res.blob = await zip.generateAsync({ type: 'blob' });
          res.name = f.file.name.replace('.pdf', '_images.zip');
          break;
        }

        case 'rotate-pdf': {
          const rotDoc = await PDFDocument.load(originalBuffer);
          const rotations = config.pageRotations || {};
          rotDoc.getPages().forEach((page, idx) => {
            const angle = rotations[idx + 1] || 0;
            if (angle !== 0) page.setRotation(degrees((page.getRotation().angle + angle) % 360));
          });
          res.blob = new Blob([await rotDoc.save()], { type: 'application/pdf' });
          res.name = f.file.name.replace('.pdf', '_rotated.pdf');
          break;
        }

        case 'metadata-editor': {
          const mDoc = await PDFDocument.load(originalBuffer);
          if (config.metaTitle) mDoc.setTitle(config.metaTitle);
          if (config.metaAuthor) mDoc.setAuthor(config.metaAuthor);
          if (config.metaKeywords) mDoc.setKeywords(config.metaKeywords.split(',').map((k: string) => k.trim()));
          res.blob = new Blob([await mDoc.save()], { type: 'application/pdf' });
          res.name = f.file.name.replace('.pdf', '_updated.pdf');
          break;
        }

        default:
          res.blob = new Blob([originalBuffer], { type: f.file.type });
      }

      if (res.blob && res.blob.size > 0) {
        res.url = URL.createObjectURL(res.blob);
        results.push(res);
        updateStatus(f.id, 'completed', 100);
      } else {
        throw new Error("Output document was empty or failed to generate.");
      }
    } catch (err: any) {
      updateStatus(f.id, 'error', 0);
      console.error("Processor Error:", err);
      throw new Error(`Browser processing failed: ${err.message || 'Unknown error'}`);
    }
  }

  return results;
};