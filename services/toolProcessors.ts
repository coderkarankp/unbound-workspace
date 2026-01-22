
import { PDFDocument, degrees, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import pptxgen from 'pptxgenjs';
import { 
  reconstructAsWord, summarizeDocument, performOCR, translateText, 
  extractTableData, extractJSON, extractPalette, compareDocuments, 
  convertToPDFContent 
} from './geminiService';

export interface ProcessorParams {
  id: string;
  files: any[];
  config: any;
  updateStatus: (id: string, status: string, progress: number) => void;
  setCurrentMsg: (msg: string) => void;
}

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

const hexToRgb = (hex: string) => {
  if (!hex) return rgb(0,0,0);
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
};

// Worker source code as a string to avoid cross-origin fetch issues
const PROTECT_WORKER_CODE = `
import { QPDF } from 'https://esm.sh/@file-forge/qpdf-wasm@0.0.1';

self.onmessage = async (e) => {
  const { fileBuffer, password, fileName } = e.data;
  try {
    self.postMessage({ type: 'status', msg: 'Initializing security engine...' });
    const qpdf = await QPDF.create();
    self.postMessage({ type: 'status', msg: 'Mounting virtual transmission...' });
    const inputPath = 'input.pdf';
    const outputPath = 'protected.pdf';
    qpdf.fs.writeFile(inputPath, new Uint8Array(fileBuffer));
    self.postMessage({ type: 'status', msg: 'Applying AES-256 encryption...' });
    await qpdf.run([
      '--encrypt', password, password, '256', '--', inputPath, outputPath
    ]);
    self.postMessage({ type: 'status', msg: 'Finalizing protected document...' });
    const result = qpdf.fs.readFile(outputPath);
    qpdf.fs.unlink(inputPath);
    qpdf.fs.unlink(outputPath);
    self.postMessage({ 
      type: 'completed', 
      bytes: result,
      fileName: fileName.replace('.pdf', '_protected.pdf')
    }, [result.buffer]);
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message || 'Encryption failed' });
  }
};
`;

export const runToolProcessor = async (params: ProcessorParams) => {
  const { id, files, config, updateStatus, setCurrentMsg } = params;
  const results: any[] = [];

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

  if (id === 'compare-pdf' && files.length >= 2) {
    setCurrentMsg("Analyzing document differences...");
    const f1 = files[0]; const f2 = files[1];
    const b1 = btoa(new Uint8Array(await f1.file.arrayBuffer()).reduce((d, b) => d + String.fromCharCode(b), ''));
    const b2 = btoa(new Uint8Array(await f2.file.arrayBuffer()).reduce((d, b) => d + String.fromCharCode(b), ''));
    const comparison = await compareDocuments(b1, b2);
    const blob = new Blob([comparison], { type: 'text/markdown' });
    return [{ id: 'comparison', name: 'comparison_report.md', blob, url: URL.createObjectURL(blob) }];
  }

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

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    setCurrentMsg(`Processing: ${f.file.name}`);
    updateStatus(f.id, 'processing', 20);
    const fileBuffer = await f.file.arrayBuffer();
    const base64 = btoa(new Uint8Array(fileBuffer).reduce((d, b) => d + String.fromCharCode(b), ''));
    
    let res: any = { id: f.id, name: f.file.name };

    switch (id) {
      case 'compress-pdf':
        setCurrentMsg("Optimizing document resources...");
        const compressSrc = await pdfjsLib.getDocument(fileBuffer).promise;
        const compressedPdf = await PDFDocument.create();
        for (let pNum = 1; pNum <= compressSrc.numPages; pNum++) {
          const page = await compressSrc.getPage(pNum);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.height = viewport.height; canvas.width = viewport.width;
          await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
          const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          const jpgBytes = await fetch(jpgDataUrl).then(r => r.arrayBuffer());
          const embeddedImg = await compressedPdf.embedJpg(jpgBytes);
          const newPage = compressedPdf.addPage([embeddedImg.width, embeddedImg.height]);
          newPage.drawImage(embeddedImg, { x: 0, y: 0, width: embeddedImg.width, height: embeddedImg.height });
          updateStatus(f.id, 'processing', Math.round((pNum / compressSrc.numPages) * 100));
        }
        const compressedBytes = await compressedPdf.save();
        res.blob = new Blob([compressedBytes], { type: 'application/pdf' });
        res.name = f.file.name.replace('.pdf', '_compressed.pdf');
        break;

      case 'pdf-to-word':
        const wordText = await reconstructAsWord(base64, 'application/pdf');
        const docObj = new Document({ sections: [{ children: parseTextToDocxChildren(wordText) }] });
        const buffer = await Packer.toBuffer(docObj);
        res.blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        res.name = f.file.name.replace('.pdf', '.docx');
        break;

      case 'protect-pdf':
        const workerBlob = new Blob([PROTECT_WORKER_CODE], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(workerBlob);
        const workerResult = await new Promise<any>((resolve, reject) => {
          const worker = new Worker(workerUrl, { type: 'module' });
          worker.onmessage = (event) => {
            if (event.data.type === 'status') setCurrentMsg(event.data.msg);
            else if (event.data.type === 'completed') resolve(event.data);
            else if (event.data.type === 'error') reject(new Error(event.data.error));
          };
          worker.onerror = (err) => reject(err);
          worker.postMessage({ fileBuffer, password: config.password, fileName: f.file.name }, [fileBuffer]);
        });
        URL.revokeObjectURL(workerUrl);
        res.blob = new Blob([workerResult.bytes], { type: 'application/pdf' });
        res.name = workerResult.fileName;
        break;

      case 'rotate-pdf':
        const rotDoc = await PDFDocument.load(fileBuffer);
        const pages = rotDoc.getPages();
        const rotations = config.pageRotations || {};
        for (let idx = 0; idx < pages.length; idx++) {
          const angle = rotations[idx + 1] || 0;
          if (angle !== 0) {
            const current = pages[idx].getRotation().angle;
            pages[idx].setRotation(degrees((current + angle) % 360));
          }
        }
        const rotBytes = await rotDoc.save();
        res.blob = new Blob([rotBytes], { type: 'application/pdf' });
        res.name = f.file.name.replace('.pdf', '_rotated.pdf');
        break;

      case 'watermark-pdf':
        const wmDoc = await PDFDocument.load(fileBuffer);
        const wmPages = wmDoc.getPages();
        const font = await wmDoc.embedFont(StandardFonts.HelveticaBold);
        let wmImg: any = null;
        if (config.watermarkType === 'image' && config.watermarkImage) {
           const binary = atob(config.watermarkImage.split(',')[1]);
           const bytes = new Uint8Array(binary.length);
           for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
           wmImg = config.watermarkImage.includes('image/png') ? await wmDoc.embedPng(bytes) : await wmDoc.embedJpg(bytes);
        }
        config.selectedPages.forEach((pIdx: number) => {
          const page = wmPages[pIdx - 1];
          const { width, height } = page.getSize();
          if (config.watermarkType === 'text') {
            const tw = font.widthOfTextAtSize(config.watermarkText, config.watermarkSize);
            page.drawText(config.watermarkText, {
              x: width / 2 - tw / 2, y: height / 2,
              size: config.watermarkSize, font, color: hexToRgb(config.watermarkColor),
              opacity: config.watermarkOpacity, rotate: degrees(config.watermarkRotation)
            });
          } else if (wmImg) {
            const scale = config.watermarkSize / 100;
            const iw = wmImg.width * scale;
            const ih = wmImg.height * scale;
            page.drawImage(wmImg, {
              x: width / 2 - iw / 2, y: height / 2 - ih / 2,
              width: iw, height: ih, opacity: config.watermarkOpacity, rotate: degrees(config.watermarkRotation)
            });
          }
        });
        const wmBytes = await wmDoc.save();
        res.blob = new Blob([wmBytes], { type: 'application/pdf' });
        res.name = f.file.name.replace('.pdf', '_watermarked.pdf');
        break;

      case 'ai-summarize':
        const summText = await performOCR(base64, 'application/pdf');
        const summary = await summarizeDocument(summText);
        res.blob = new Blob([summary], { type: 'text/markdown' });
        res.name = f.file.name.replace('.pdf', '_summary.md');
        break;

      case 'pdf-translate':
        const rawText = await performOCR(base64, 'application/pdf');
        const translated = await translateText(rawText, config.targetLang);
        res.blob = new Blob([translated], { type: 'text/markdown' });
        res.name = f.file.name.replace('.pdf', `_${config.targetLang.toLowerCase()}.md`);
        break;

      default:
        res.blob = new Blob([fileBuffer], { type: f.file.type });
        res.name = f.file.name;
    }

    if (res.blob) res.url = URL.createObjectURL(res.blob);
    results.push(res);
    updateStatus(f.id, 'completed', 100);
  }

  return results;
};
