
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

export const runToolProcessor = async (params: ProcessorParams) => {
  const { id, files, config, updateStatus, setCurrentMsg } = params;
  const results: any[] = [];

  // Handle Multi-file Merging/Comparison Tools First
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

  // Handle Single-file Parallel Processing
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    setCurrentMsg(`Processing: ${f.file.name}`);
    updateStatus(f.id, 'processing', 20);
    const fileBuffer = await f.file.arrayBuffer();
    const base64 = btoa(new Uint8Array(fileBuffer).reduce((d, b) => d + String.fromCharCode(b), ''));
    
    let res: any = { id: f.id, name: f.file.name };

    switch (id) {
      case 'pdf-to-word':
        const wordText = await reconstructAsWord(base64, 'application/pdf');
        const docObj = new Document({ sections: [{ children: parseTextToDocxChildren(wordText) }] });
        const buffer = await Packer.toBuffer(docObj);
        res.blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        res.name = f.file.name.replace('.pdf', '.docx');
        break;

      case 'pdf-to-ppt':
        const pptx = new pptxgen();
        const pdfForPpt = await pdfjsLib.getDocument(fileBuffer).promise;
        for (let pNum = 1; pNum <= pdfForPpt.numPages; pNum++) {
          const page = await pdfForPpt.getPage(pNum);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          canvas.height = viewport.height; canvas.width = viewport.width;
          await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const slide = pptx.addSlide();
          slide.addImage({ data: dataUrl, x: 0, y: 0, w: '100%', h: '100%' });
        }
        const pptBuffer = await pptx.write('arraybuffer') as ArrayBuffer;
        res.blob = new Blob([pptBuffer], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
        res.name = f.file.name.replace('.pdf', '.pptx');
        break;

      case 'pdf-to-jpg':
        const pdfForJpg = await pdfjsLib.getDocument(fileBuffer).promise;
        const jpgZip = new JSZip();
        for (let pNum = 1; pNum <= pdfForJpg.numPages; pNum++) {
          const page = await pdfForJpg.getPage(pNum);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          canvas.height = viewport.height; canvas.width = viewport.width;
          await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
          const jpgBlob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.9));
          jpgZip.file(`page_${pNum}.jpg`, jpgBlob);
        }
        res.blob = await jpgZip.generateAsync({ type: 'blob' });
        res.name = f.file.name.replace('.pdf', '_images.zip');
        break;

      case 'palette-gen':
        const paletteJSON = await extractPalette(base64, f.file.type);
        res.blob = new Blob([paletteJSON], { type: 'application/json' });
        res.name = f.file.name.split('.')[0] + '_palette.json';
        break;

      case 'email-to-pdf':
      case 'epub-to-pdf':
        const reconstructedContent = await convertToPDFContent(base64, f.file.type);
        res.blob = new Blob([reconstructedContent], { type: 'text/markdown' });
        res.name = f.file.name.split('.')[0] + '_converted.md';
        break;

      case 'flatten-pdf':
        const flatDoc = await PDFDocument.load(fileBuffer);
        const flatForm = flatDoc.getForm();
        flatForm.flatten();
        const flatBytes = await flatDoc.save();
        res.blob = new Blob([flatBytes], { type: 'application/pdf' });
        res.name = f.file.name.replace('.pdf', '_flattened.pdf');
        break;

      case 'dark-mode-pdf':
        const darkDoc = await PDFDocument.load(fileBuffer);
        const darkPages = darkDoc.getPages();
        darkPages.forEach(p => {
          // Note: Full inversion requires complex stream parsing, 
          // but we can add a high-opacity dark overlay as a "Comfort Reading" mode.
          const { width, height } = p.getSize();
          p.drawRectangle({
            x: 0, y: 0, width, height,
            color: rgb(0.1, 0.1, 0.1),
            opacity: 0.15, // Subtle darkening
          });
        });
        const darkBytes = await darkDoc.save();
        res.blob = new Blob([darkBytes], { type: 'application/pdf' });
        res.name = f.file.name.replace('.pdf', '_darkmode.pdf');
        break;

      case 'split-pdf':
      case 'organize-pdf':
        const splitSrc = await PDFDocument.load(fileBuffer);
        const splitPages: any[] = [];
        if (config.splitMode === 'individual' && id === 'split-pdf') {
          for (const pNum of config.selectedPages) {
            const newPdf = await PDFDocument.create();
            const [copied] = await newPdf.copyPages(splitSrc, [pNum - 1]);
            newPdf.addPage(copied);
            const bytes = await newPdf.save();
            const blob = new Blob([bytes], { type: 'application/pdf' });
            splitPages.push({ pageNum: pNum, blob, url: URL.createObjectURL(blob) });
          }
          return { type: 'split-result', pages: splitPages, name: f.file.name };
        } else {
          const newPdf = await PDFDocument.create();
          const copied = await newPdf.copyPages(splitSrc, config.selectedPages.map((p: number) => p - 1));
          copied.forEach(p => newPdf.addPage(p));
          const bytes = await newPdf.save();
          res.blob = new Blob([bytes], { type: 'application/pdf' });
          res.name = f.file.name.replace('.pdf', id === 'split-pdf' ? '_extracted.pdf' : '_organized.pdf');
        }
        break;

      case 'watermark-pdf':
        const wmDoc = await PDFDocument.load(fileBuffer);
        const wmPages = wmDoc.getPages();
        const font = await wmDoc.embedFont(StandardFonts.HelveticaBold);
        let embeddedImg: any = null;
        if (config.watermarkType === 'image' && config.watermarkImage) {
           const binary = atob(config.watermarkImage.split(',')[1]);
           const bytes = new Uint8Array(binary.length);
           for (let j = 0; j < binary.length; j++) bytes[j] = binary.charCodeAt(j);
           embeddedImg = config.watermarkImage.includes('image/png') ? await wmDoc.embedPng(bytes) : await wmDoc.embedJpg(bytes);
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
          } else if (embeddedImg) {
            const scale = config.watermarkSize / 100;
            const iw = embeddedImg.width * scale;
            const ih = embeddedImg.height * scale;
            page.drawImage(embeddedImg, {
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

      case 'pdf-to-excel':
        const tableData = await extractTableData(base64, 'application/pdf');
        res.blob = new Blob([tableData], { type: 'text/csv' });
        res.name = f.file.name.replace('.pdf', '.csv');
        break;

      case 'pdf-to-json':
        const jsonStr = await extractJSON(base64, 'application/pdf');
        res.blob = new Blob([jsonStr], { type: 'application/json' });
        res.name = f.file.name.replace('.pdf', '.json');
        break;

      case 'pdf-to-html':
        const htmlText = await performOCR(base64, 'application/pdf');
        const htmlBody = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Converted PDF</title><style>body{font-family:sans-serif;line-height:1.6;max-width:800px;margin:40px auto;padding:20px;}</style></head><body>${htmlText.replace(/\n/g, '<br>')}</body></html>`;
        res.blob = new Blob([htmlBody], { type: 'text/html' });
        res.name = f.file.name.replace('.pdf', '.html');
        break;

      case 'protect-pdf':
        const protectDoc = await PDFDocument.load(fileBuffer);
        const encryptedBytes = await protectDoc.save({ userPassword: config.password, ownerPassword: config.password });
        res.blob = new Blob([encryptedBytes], { type: 'application/pdf' });
        res.name = f.file.name.replace('.pdf', '_protected.pdf');
        break;

      case 'metadata-editor':
        const metaDoc = await PDFDocument.load(fileBuffer);
        metaDoc.setTitle(config.metaTitle || f.file.name);
        metaDoc.setAuthor(config.metaAuthor || 'Unbound Workspace');
        metaDoc.setCreator('Unbound Workspace');
        metaDoc.setKeywords((config.metaKeywords || '').split(',').map((k: string) => k.trim()));
        const metaBytes = await metaDoc.save();
        res.blob = new Blob([metaBytes], { type: 'application/pdf' });
        res.name = f.file.name.replace('.pdf', '_updated.pdf');
        break;

      case 'rotate-pdf':
        const rotDoc = await PDFDocument.load(fileBuffer);
        config.selectedPages.forEach((pIdx: number) => {
          const p = rotDoc.getPages()[pIdx - 1];
          p.setRotation(degrees((p.getRotation().angle + config.rotateAngle) % 360));
        });
        const rotBytes = await rotDoc.save();
        res.blob = new Blob([rotBytes], { type: 'application/pdf' });
        res.name = f.file.name.replace('.pdf', '_rotated.pdf');
        break;

      default:
        res.content = "Not supported yet.";
    }

    if (res.blob) res.url = URL.createObjectURL(res.blob);
    results.push(res);
    updateStatus(f.id, 'completed', 100);
  }

  return results;
};
